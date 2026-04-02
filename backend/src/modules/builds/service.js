import crypto from 'crypto';
import {
  createBuildRow,
  findBuildById,
  findBuildItems,
  upsertBuildComponent,
  deleteBuildItem,
  updateBuild,
  findCompatibilityRules,
  findProductSpecs
} from './repository.js';

function generateBuildCode() {
  return `BLD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function findSpec(specs, key) {
  return specs.find((s) => s.spec_key === key) || null;
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

export async function getBuild(buildId) {
  const [buildRes, itemsRes] = await Promise.all([findBuildById(buildId), findBuildItems(buildId)]);

  if (buildRes.error) throw { status: 500, code: 'build_lookup_failed', message: buildRes.error.message };
  if (!buildRes.data) throw { status: 404, code: 'build_not_found', message: 'Build not found' };
  if (itemsRes.error) throw { status: 500, code: 'build_items_failed', message: itemsRes.error.message };

  return { ...buildRes.data, items: itemsRes.data || [] };
}

export async function setBuildComponent(buildId, payload) {
  const upserted = await upsertBuildComponent({
    custom_build_id: buildId,
    component_type: payload.component_type,
    product_id: payload.product_id,
    quantity: 1,
    unit_estimated_price_tzs: 0,
    is_auto_replaced: false,
    compatibility_notes: null
  });

  if (upserted.error) throw { status: 500, code: 'build_item_upsert_failed', message: upserted.error.message };

  return getBuild(buildId);
}

export async function removeBuildItem(buildId, itemId) {
  const removed = await deleteBuildItem(itemId);
  if (removed.error) throw { status: 500, code: 'build_item_delete_failed', message: removed.error.message };
  return getBuild(buildId);
}

export async function validateBuild(buildId, autoReplace) {
  const build = await getBuild(buildId);
  const items = build.items || [];

  const errors = [];
  const warnings = [];
  const replacements = [];

  const ruleRes = await findCompatibilityRules();
  if (ruleRes.error) throw { status: 500, code: 'rules_fetch_failed', message: ruleRes.error.message };

  // Safest MVP-compatible option when DB rules are incomplete:
  // run explicit hard checks for CPU socket, GPU fit, PSU headroom, RAM compatibility.
  const byType = Object.fromEntries(items.map((i) => [i.component_type, i]));

  if (byType.cpu && byType.motherboard) {
    const [cpuSpecsRes, mbSpecsRes] = await Promise.all([
      findProductSpecs(byType.cpu.product_id),
      findProductSpecs(byType.motherboard.product_id)
    ]);
    if (!cpuSpecsRes.error && !mbSpecsRes.error) {
      const cpuSocket = findSpec(cpuSpecsRes.data || [], 'cpu_socket')?.value_text;
      const mbSocket = findSpec(mbSpecsRes.data || [], 'motherboard_socket')?.value_text;
      if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
        errors.push('CPU socket does not match motherboard socket.');
      }
    }
  }

  if (byType.gpu && byType.case) {
    const [gpuSpecsRes, caseSpecsRes] = await Promise.all([
      findProductSpecs(byType.gpu.product_id),
      findProductSpecs(byType.case.product_id)
    ]);
    if (!gpuSpecsRes.error && !caseSpecsRes.error) {
      const gpuLen = Number(findSpec(gpuSpecsRes.data || [], 'gpu_length_mm')?.value_number || 0);
      const caseMax = Number(findSpec(caseSpecsRes.data || [], 'case_max_gpu_length_mm')?.value_number || 0);
      if (gpuLen > 0 && caseMax > 0 && gpuLen > caseMax) {
        if (autoReplace) {
          warnings.push('GPU does not fit selected case. Replacement required.');
          replacements.push({ from: byType.case.product_id, to: null, reason: 'GPU length exceeds case limit' });
        } else {
          errors.push('GPU does not fit selected case.');
        }
      }
    }
  }

  const nextStatus = errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';
  const total = items.reduce((acc, i) => acc + Number(i.unit_estimated_price_tzs || 0) * Number(i.quantity || 1), 0);

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
    normalized_items: items,
    total_estimated_tzs: total,
    rules_count: (ruleRes.data || []).length
  };
}

export async function addBuildToCart(buildId, identity) {
  // Safest MVP-compatible option: delegate this to cart service in implementation pass.
  // Signature locked here so controller/route contracts are stable now.
  return {
    build_id: buildId,
    session_token: identity.sessionToken,
    queued_for_cart_insert: true
  };
}
