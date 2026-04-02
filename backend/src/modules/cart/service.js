import {
  findActiveCartByIdentity,
  createCart,
  findCartItems,
  insertCartItem,
  updateCartItem,
  deleteCartItem,
  findProductPriceAndTitle,
  findBuildPriceAndTitle
} from './repository.js';

export async function getOrCreateActiveCart(identity) {
  const found = await findActiveCartByIdentity(identity);
  if (found.error) throw { status: 500, code: 'cart_lookup_failed', message: found.error.message };
  if (found.data) return found.data;

  const created = await createCart(identity);
  if (created.error) throw { status: 500, code: 'cart_create_failed', message: created.error.message };
  return created.data;
}

export async function getCartWithItems(identity) {
  const cart = await getOrCreateActiveCart(identity);
  const itemsRes = await findCartItems(cart.id);
  if (itemsRes.error) throw { status: 500, code: 'cart_items_failed', message: itemsRes.error.message };

  const items = itemsRes.data || [];
  const estimated_total_tzs = items.reduce((acc, i) => acc + i.unit_estimated_price_tzs * i.quantity, 0);

  return { cart, items, estimated_total_tzs };
}

export async function addItemToCart(identity, payload) {
  const cart = await getOrCreateActiveCart(identity);

  let unit = 0;
  let title = '';

  if (payload.item_type === 'product') {
    const product = await findProductPriceAndTitle(payload.product_id);
    if (product.error) throw { status: 400, code: 'invalid_product', message: product.error.message };
    unit = product.data.estimated_price_tzs;
    title = product.data.title;
  }

  if (payload.item_type === 'custom_build') {
    const build = await findBuildPriceAndTitle(payload.custom_build_id);
    if (build.error) throw { status: 400, code: 'invalid_build', message: build.error.message };
    unit = build.data.total_estimated_price_tzs;
    title = build.data.name || 'Custom Build';
  }

  const inserted = await insertCartItem({
    cart_id: cart.id,
    item_type: payload.item_type,
    product_id: payload.product_id || null,
    custom_build_id: payload.custom_build_id || null,
    quantity: payload.quantity,
    unit_estimated_price_tzs: unit,
    title_snapshot: title,
    specs_snapshot: null
  });

  if (inserted.error) throw { status: 500, code: 'cart_item_create_failed', message: inserted.error.message };
  return getCartWithItems(identity);
}

export async function updateItemQuantity(identity, itemId, quantity) {
  const updated = await updateCartItem(itemId, { quantity });
  if (updated.error) throw { status: 500, code: 'cart_item_update_failed', message: updated.error.message };
  return getCartWithItems(identity);
}

export async function removeItemFromCart(identity, itemId) {
  const removed = await deleteCartItem(itemId);
  if (removed.error) throw { status: 500, code: 'cart_item_delete_failed', message: removed.error.message };
  return getCartWithItems(identity);
}
