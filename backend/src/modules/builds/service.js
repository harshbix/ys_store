import crypto from 'crypto';
import {
  createBuildRow,
  findBuildById,
  findBuildByIdForIdentity,
  findBuildItems,
  findBuildItemById,
  upsertBuildComponent,
  deleteBuildItem,
  updateBuild,
  findCompatibilityRules,
  findProductSpecs,
  findProductPrice,
  findComponentBySpecText,
  findComponentBySpecNumberMin
} from './repository.js';
import { addItemToCart } from '../cart/service.js';

function generateBuildCode() {
  return `BLD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function findSpec(specs, key) {
  return specs.find((s) => s.spec_key === key) || null;
}

async function assertBuildExists(buildId, identity = null) {
  const buildRes = identity
    ? await findBuildByIdForIdentity(buildId, identity)
    : await findBuildById(buildId);

  if (buildRes.error) {
    throw { status: 500, code: 'build_lookup_failed', message: buildRes.error.message };
  }

  if (!buildRes.data) {
    throw { status: 404, code: 'build_not_found', message: 'Build not found' };
  }

  return buildRes.data;
}

export async function createBuild(identity, payload) {
  const result = await createBuildRow({
    build_code: generateBuildCode(),
    owner_type: identity.customerAuthId ? 'customer' : 'guest',
    customer_auth_id: identity.customerAuthId || null,
    session_token: identity.sessionToken,
    name: payload.name || null,
    build_status: 'draft'
  });

  if (result.error) throw { status: 500, code: 'build_create_failed', message: result.error.message };
  return result.data;
}

export async function getBuild(buildId, identity = null) {
  const buildRes = await assertBuildExists(buildId, identity);
  const itemsRes = await findBuildItems(buildId);

  if (itemsRes.error) throw { status: 500, code: 'build_items_failed', message: itemsRes.error.message };

  return { ...buildRes, items: itemsRes.data || [] };
}

export async function setBuildComponent(buildId, payload, identity = null) {
  await assertBuildExists(buildId, identity);

  const productRes = await findProductPrice(payload.product_id);
  if (productRes.error || !productRes.data) {
    throw { status: 400, code: 'invalid_build_product', message: 'Selected component product not found' };
  }

  const upserted = await upsertBuildComponent({
    custom_build_id: buildId,
    component_type: payload.component_type,
    product_id: payload.product_id,
    quantity: 1,
    unit_estimated_price_tzs: productRes.data.price_tzs,
    is_auto_replaced: false,
    compatibility_notes: null
  });

  if (upserted.error) throw { status: 500, code: 'build_item_upsert_failed', message: upserted.error.message };

  return getBuild(buildId, identity);
}

export async function removeBuildItem(buildId, itemId, identity = null) {
  await assertBuildExists(buildId, identity);

  const itemRes = await findBuildItemById(itemId);
  if (itemRes.error) {
    throw { status: 500, code: 'build_item_lookup_failed', message: itemRes.error.message };
  }

  if (!itemRes.data || itemRes.data.custom_build_id !== buildId) {
    throw { status: 404, code: 'build_item_not_found', message: 'Build item not found' };
  }

  const removed = await deleteBuildItem(itemId, buildId);
  if (removed.error) throw { status: 500, code: 'build_item_delete_failed', message: removed.error.message };
  return getBuild(buildId, identity);
}

export async function validateBuild(buildId, autoReplace, identity = null) {
  const build = await getBuild(buildId, identity);
  const items = build.items || [];

  const errors = [];
  const warnings = [];
  const replacements = [];

  const ruleRes = await findCompatibilityRules();
  if (ruleRes.error) throw { status: 500, code: 'rules_fetch_failed', message: ruleRes.error.message };

  const byType = Object.fromEntries(items.map((i) => [i.component_type, i]));

  const specsCache = {};
  async function getSpecs(productId) {
    if (!productId) return [];
    if (!specsCache[productId]) {
      const res = await findProductSpecs(productId);
      if (res.error) throw { status: 500, code: 'build_specs_failed', message: res.error.message };
      specsCache[productId] = res.data || [];
    }
    return specsCache[productId];
  }

  async function replaceComponent(componentType, candidateProduct, reason) {
    const current = byType[componentType];
    if (!current || !candidateProduct?.id || current.product_id === candidateProduct.id) return false;

    const rep = await upsertBuildComponent({
      custom_build_id: buildId,
      component_type: componentType,
      product_id: candidateProduct.id,
      quantity: 1,
      unit_estimated_price_tzs: candidateProduct.estimated_price_tzs,
      is_auto_replaced: true,
      compatibility_notes: { reason }
    });

    if (rep.error) throw { status: 500, code: 'build_autoreplace_failed', message: rep.error.message };

    replacements.push({
      component_type: componentType,
      from_product_id: current.product_id,
      to_product_id: candidateProduct.id,
      reason,
      message: `We replaced ${componentType} due to compatibility.`
    });
    warnings.push(`We replaced ${componentType} due to compatibility.`);
    byType[componentType] = { ...current, product_id: candidateProduct.id, unit_estimated_price_tzs: candidateProduct.estimated_price_tzs };
    return true;
  }

  if (byType.cpu && byType.motherboard) {
    const cpuSpecs = await getSpecs(byType.cpu.product_id);
    const mbSpecs = await getSpecs(byType.motherboard.product_id);
    const cpuSocket = findSpec(cpuSpecs, 'cpu_socket')?.value_text;
    const mbSocket = findSpec(mbSpecs, 'motherboard_socket')?.value_text;

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      if (autoReplace) {
        const candidate = await findComponentBySpecText('motherboard', 'motherboard_socket', cpuSocket);
        if (candidate.error) throw { status: 500, code: 'autofix_motherboard_failed', message: candidate.error.message };
        const changed = await replaceComponent('motherboard', candidate.data, 'CPU and motherboard socket mismatch');
        if (!changed) errors.push('CPU socket does not match motherboard socket.');
      } else {
        errors.push('CPU socket does not match motherboard socket.');
      }
    }
  }

  if (byType.gpu && byType.case) {
    const gpuSpecs = await getSpecs(byType.gpu.product_id);
    const caseSpecs = await getSpecs(byType.case.product_id);
    const gpuLen = Number(findSpec(gpuSpecs, 'gpu_length_mm')?.value_number || 0);
    const caseMax = Number(findSpec(caseSpecs, 'case_max_gpu_length_mm')?.value_number || 0);
    if (gpuLen > 0 && caseMax > 0 && gpuLen > caseMax) {
      if (autoReplace) {
        const candidate = await findComponentBySpecNumberMin('case', 'case_max_gpu_length_mm', gpuLen);
        if (candidate.error) throw { status: 500, code: 'autofix_case_failed', message: candidate.error.message };
        const changed = await replaceComponent('case', candidate.data, 'GPU length exceeds case limit');
        if (!changed) errors.push('GPU does not fit selected case.');
      } else {
        errors.push('GPU does not fit selected case.');
      }
    }
  }

  if (byType.ram && byType.motherboard) {
    const ramSpecs = await getSpecs(byType.ram.product_id);
    const mbSpecs = await getSpecs(byType.motherboard.product_id);
    const ramType = findSpec(ramSpecs, 'ram_type')?.value_text;
    const mbRamType = findSpec(mbSpecs, 'motherboard_ram_type')?.value_text;
    if (ramType && mbRamType && ramType !== mbRamType) {
      if (autoReplace) {
        const candidate = await findComponentBySpecText('ram', 'ram_type', mbRamType);
        if (candidate.error) throw { status: 500, code: 'autofix_ram_failed', message: candidate.error.message };
        const changed = await replaceComponent('ram', candidate.data, 'RAM type does not match motherboard support');
        if (!changed) errors.push('RAM type is not compatible with motherboard.');
      } else {
        errors.push('RAM type is not compatible with motherboard.');
      }
    }
  }

  if (byType.psu) {
    const psuSpecs = await getSpecs(byType.psu.product_id);
    const psuWatt = Number(findSpec(psuSpecs, 'psu_wattage')?.value_number || 0);
    let estimatedSystemWatt = 0;
    for (const item of Object.values(byType)) {
      const itemSpecs = await getSpecs(item.product_id);
      estimatedSystemWatt += Number(findSpec(itemSpecs, 'estimated_system_wattage')?.value_number || 0);
    }
    const required = estimatedSystemWatt > 0 ? Math.ceil(estimatedSystemWatt * 1.2) : 0;

    if (required > 0 && psuWatt > 0 && psuWatt < required) {
      if (autoReplace) {
        const candidate = await findComponentBySpecNumberMin('psu', 'psu_wattage', required);
        if (candidate.error) throw { status: 500, code: 'autofix_psu_failed', message: candidate.error.message };
        const changed = await replaceComponent('psu', candidate.data, `PSU wattage below required headroom (${required}W)`);
        if (!changed) errors.push(`PSU wattage is insufficient. Required at least ${required}W.`);
      } else {
        errors.push(`PSU wattage is insufficient. Required at least ${required}W.`);
      }
    }
  }

  const refreshed = await getBuild(buildId, identity);
  const refreshedItems = refreshed.items || [];
  const nextStatus = errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';
  const total = refreshedItems.reduce((acc, i) => acc + Number(i.unit_estimated_price_tzs || 0) * Number(i.quantity || 1), 0);

  const updated = await updateBuild(buildId, {
    compatibility_status: nextStatus,
    replacement_summary: replacements,
    total_estimated_price_tzs: total,
    build_status: nextStatus === 'invalid' ? 'draft' : 'valid'
  });

  if (updated.error) throw { status: 500, code: 'build_update_failed', message: updated.error.message };

  return {
    compatibility_status: nextStatus,
    errors,
    warnings,
    replacements,
    normalized_items: refreshedItems,
    total_estimated_tzs: total,
    rules_count: (ruleRes.data || []).length
  };
}

export async function addBuildToCart(buildId, identity) {
  const build = await getBuild(buildId, identity);
  if (!build) throw { status: 404, code: 'build_not_found', message: 'Build not found' };

  const cart = await addItemToCart(identity, {
    item_type: 'custom_build',
    custom_build_id: buildId,
    quantity: 1
  });

  return {
    build_id: buildId,
    cart
  };
}
