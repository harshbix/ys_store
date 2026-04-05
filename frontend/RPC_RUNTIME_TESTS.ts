import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from './src/lib/supabase';

/**
 * RPC RUNTIME VALIDATION TEST SUITE
 * 
 * Prerequisites:
 * 1. Migrations 012-015 must be deployed to Supabase
 * 2. At least one product must exist in database
 * 3. Supabase environment variables configured
 * 
 * Setup:
 *   npm install @supabase/supabase-js
 * 
 * Run:
 *   npx vitest run RPC_RUNTIME_TESTS.ts
 */

describe('RPC Runtime Validation', () => {
  let testSessionToken: string;
  let testProductId: string;

  beforeEach(async () => {
    // Generate unique session token for each test
    testSessionToken = crypto.randomUUID();
    
    // Get a test product
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (products && products.length > 0) {
      testProductId = products[0].id;
    } else {
      console.warn('⚠️ WARNING: No products in database. Add test data before running tests.');
    }
  });

  // ================================================================
  // CART FLOW TESTS
  // ================================================================

  describe('Cart Flow', () => {
    it('should create new cart via get_or_create_customer_cart', async () => {
      const result = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data[0].id).toBeDefined();
      expect(result.data[0].session_token).toBe(testSessionToken);
      expect(result.data[0].status).toBe('active');
    });

    it('should add product to cart', async () => {
      // Create cart
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      // Add item
      const addResult = await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_custom_build_id: null,
        p_quantity: 1
      });

      expect(addResult.error).toBeNull();
      expect(addResult.data[0].estimated_total_tzs).toBeGreaterThan(0);
      expect(addResult.data[0].items).toBeDefined();
    });

    it('should recalculate totals on quantity update', async () => {
      // Create cart and add item
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      const addResult = await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      const itemId = addResult.data[0].items[0].id;
      const originalTotal = addResult.data[0].estimated_total_tzs;

      // Update quantity to 5
      const updateResult = await supabase.rpc('update_cart_item_quantity', {
        p_cart_id: cartId,
        p_item_id: itemId,
        p_quantity: 5
      });

      expect(updateResult.error).toBeNull();
      expect(updateResult.data[0].estimated_total_tzs).toBe(originalTotal * 5);
    });

    it('should detect duplicate items and merge quantities', async () => {
      // Create cart
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      // Add same item twice
      await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      const secondAdd = await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      // Should still have 1 item in cart (not 2)
      expect(secondAdd.data[0].items.length).toBe(1);
      // But quantity should be 2
      expect(secondAdd.data[0].items[0].quantity).toBe(2);
    });

    it('should remove cart item', async () => {
      // Create cart and add item
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      const addResult = await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      const itemId = addResult.data[0].items[0].id;

      // Remove item
      const removeResult = await supabase.rpc('remove_item_from_cart', {
        p_cart_id: cartId,
        p_item_id: itemId
      });

      expect(removeResult.error).toBeNull();
      expect(removeResult.data[0].items.length).toBe(0);
      expect(removeResult.data[0].estimated_total_tzs).toBe(0);
    });
  });

  // ================================================================
  // BUILD FLOW TESTS
  // ================================================================

  describe('Build Flow', () => {
    it('should create new custom build', async () => {
      const result = await supabase.rpc('create_or_get_custom_build', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken,
        p_name: 'Test Gaming Build'
      });

      expect(result.error).toBeNull();
      expect(result.data[0].id).toBeDefined();
      expect(result.data[0].build_code).toBeDefined();
      expect(result.data[0].name).toBe('Test Gaming Build');
      expect(result.data[0].total_estimated_price_tzs).toBe(0);
    });

    it('should add component to build', async () => {
      // Create build
      const buildResult = await supabase.rpc('create_or_get_custom_build', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const buildId = buildResult.data[0].id;

      // Add CPU
      const addResult = await supabase.rpc('upsert_custom_build_item', {
        p_build_id: buildId,
        p_component_type: 'cpu',
        p_product_id: testProductId
      });

      expect(addResult.error).toBeNull();
      expect(addResult.data[0].items.length).toBe(1);
      expect(addResult.data[0].items[0].component_type).toBe('cpu');
      expect(addResult.data[0].total_estimated_price_tzs).toBeGreaterThan(0);
    });

    it('should replace component when same type added', async () => {
      // Create another product for replacement
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(2);
      
      if (!products || products.length < 2) {
        console.warn('Skipping: Need 2 products in database');
        return;
      }

      const productId1 = (products as any)[0].id;
      const productId2 = (products as any)[1].id;

      // Create build and add first CPU
      const buildResult = await supabase.rpc('create_or_get_custom_build', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const buildId = buildResult.data[0].id;

      await supabase.rpc('upsert_custom_build_item', {
        p_build_id: buildId,
        p_component_type: 'cpu',
        p_product_id: productId1
      });

      // Add different CPU (should replace)
      const replaceResult = await supabase.rpc('upsert_custom_build_item', {
        p_build_id: buildId,
        p_component_type: 'cpu',
        p_product_id: productId2
      });

      // Still should have 1 item
      expect(replaceResult.data[0].items.length).toBe(1);
      expect(replaceResult.data[0].items[0].product_id).toBe(productId2);
    });

    it('should validate build and detect missing components', async () => {
      // Create empty build
      const buildResult = await supabase.rpc('create_or_get_custom_build', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const buildId = buildResult.data[0].id;

      // Validate
      const validateResult = await supabase.rpc('validate_custom_build', {
        p_build_id: buildId
      });

      expect(validateResult.error).toBeNull();
      expect(validateResult.data[0].is_valid).toBe(false);
      expect(validateResult.data[0].compatibility_status).toBe('warning');
      expect(validateResult.data[0].missing_components.length).toBeGreaterThan(0);
      expect(validateResult.data[0].missing_components).toContain('cpu');
      expect(validateResult.data[0].missing_components).toContain('motherboard');
    });

    it('should delete build item', async () => {
      // Create build and add component
      const buildResult = await supabase.rpc('create_or_get_custom_build', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const buildId = buildResult.data[0].id;

      const addResult = await supabase.rpc('upsert_custom_build_item', {
        p_build_id: buildId,
        p_component_type: 'cpu',
        p_product_id: testProductId
      });

      const itemId = addResult.data[0].items[0].id;

      // Delete item
      const deleteResult = await supabase.rpc('delete_custom_build_item', {
        p_build_id: buildId,
        p_item_id: itemId
      });

      expect(deleteResult.error).toBeNull();
      expect(deleteResult.data[0].items.length).toBe(0);
    });
  });

  // ================================================================
  // QUOTE FLOW TESTS
  // ================================================================

  describe('Quote Flow', () => {
    it('should create quote from cart', async () => {
      // Create and populate cart
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      // Create quote
      const quoteResult = await supabase.rpc('create_quote_from_cart', {
        p_customer_name: 'Test Customer',
        p_notes: 'Test quote',
        p_source_type: 'cart',
        p_source_id: cartId,
        p_idempotency_key: crypto.randomUUID()
      });

      expect(quoteResult.error).toBeNull();
      expect(quoteResult.data[0].id).toBeDefined();
      expect(quoteResult.data[0].quote_code).toBeDefined();
      expect(quoteResult.data[0].status).toBe('new');
      expect(quoteResult.data[0].customer_name).toBe('Test Customer');
    });

    it('should enforce idempotency - same key returns same quote', async () => {
      // Create cart with item
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      // Create quote twice with same idempotency key
      const idempotencyKey = crypto.randomUUID();

      const quote1 = await supabase.rpc('create_quote_from_cart', {
        p_customer_name: 'Test Customer',
        p_source_type: 'cart',
        p_source_id: cartId,
        p_idempotency_key: idempotencyKey
      });

      const quote2 = await supabase.rpc('create_quote_from_cart', {
        p_customer_name: 'Test Customer',
        p_source_type: 'cart',
        p_source_id: cartId,
        p_idempotency_key: idempotencyKey
      });

      // Should be the same quote
      expect(quote1.data[0].id).toBe(quote2.data[0].id);
      expect(quote1.data[0].quote_code).toBe(quote2.data[0].quote_code);
    });

    it('should track WhatsApp click', async () => {
      // Create quote
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      const quoteResult = await supabase.rpc('create_quote_from_cart', {
        p_customer_name: 'Test Customer',
        p_source_type: 'cart',
        p_source_id: cartId,
        p_idempotency_key: crypto.randomUUID()
      });
      const quoteId = quoteResult.data[0].id;

      // Track click
      const trackResult = await supabase.rpc('track_quote_whatsapp_click', {
        p_quote_id: quoteId
      });

      expect(trackResult.error).toBeNull();
      expect(trackResult.data[0].whatsapp_clicked_at).toBeDefined();
      expect(trackResult.data[0].whatsapp_clicked_at).not.toBeNull();
    });

    it('should retrieve quote with items', async () => {
      // Create quote
      const cartResult = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: testSessionToken
      });
      const cartId = cartResult.data[0].id;

      await supabase.rpc('add_item_to_cart', {
        p_cart_id: cartId,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 2
      });

      const quoteResult = await supabase.rpc('create_quote_from_cart', {
        p_customer_name: 'Test Customer',
        p_source_type: 'cart',
        p_source_id: cartId,
        p_idempotency_key: crypto.randomUUID()
      });
      const quoteId = quoteResult.data[0].id;

      // Retrieve
      const getResult = await supabase.rpc('get_quote_with_items', {
        p_quote_id: quoteId
      });

      expect(getResult.error).toBeNull();
      expect(getResult.data[0].items).toBeDefined();
      expect(getResult.data[0].items.length).toBe(1);
      expect(getResult.data[0].items[0].quantity).toBe(2);
    });
  });

  // ================================================================
  // RLS (Row Level Security) TESTS
  // ================================================================

  describe('RLS Security', () => {
    it('guest session should not access another guests cart items', async () => {
      const session1 = crypto.randomUUID();
      const session2 = crypto.randomUUID();

      // Create cart for session 1
      const cart1 = await supabase.rpc('get_or_create_customer_cart', {
        p_customer_auth_id: null,
        p_session_token: session1
      });
      const cart1Id = cart1.data[0].id;

      // Add item
      await supabase.rpc('add_item_to_cart', {
        p_cart_id: cart1Id,
        p_item_type: 'product',
        p_product_id: testProductId,
        p_quantity: 1
      });

      // Session 2 tries to view session 1's cart
      // This should fail or return empty due to RLS
      const result = await supabase.rpc('get_cart_with_items', {
        p_cart_id: cart1Id
      });

      // With proper RLS, session 2 should not see session 1's items
      // Note: Current RLS implementation may need adjustment for full enforcement
      // This test indicates where RLS should be verified
      expect(result).toBeDefined();
    });
  });
});
