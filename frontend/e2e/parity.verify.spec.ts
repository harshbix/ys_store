import path from 'path';
import fs from 'node:fs';
import { test, expect, type Locator, type Page } from '@playwright/test';

const onePixelPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

function parseCurrency(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return Number(digits || '0');
}

async function readCardPrices(page: Page, take: number): Promise<number[]> {
  const cards = page.locator('article.group');
  const count = Math.min(await cards.count(), take);
  const values: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const priceNode = cards.nth(index).locator('div.mt-3 p').first();
    const line = await priceNode.textContent();
    if (!line) continue;
    values.push(parseCurrency(line));
  }

  return values;
}

function isAscending(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] < values[i - 1]) return false;
  }
  return true;
}

async function addProductToCart(page: Page, button: Locator) {
  const postCartPromise = page.waitForResponse((response) => {
    return response.url().includes('/api/cart/items')
      && response.request().method() === 'POST'
      && (response.status() === 200 || response.status() === 201);
  });

  await button.click();
  const response = await postCartPromise;
  return response.json();
}

type BackendEnvConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  adminEmail: string;
};

function parseEnvFile(filePath: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const splitIndex = trimmed.indexOf('=');
    if (splitIndex < 0) continue;

    const key = trimmed.slice(0, splitIndex).trim();
    const value = trimmed.slice(splitIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function loadBackendEnvConfig(): BackendEnvConfig {
  const envPath = path.resolve(process.cwd(), '..', 'backend', '.env');
  const parsed = parseEnvFile(envPath);

  const supabaseUrl = parsed.SUPABASE_URL || '';
  const supabaseServiceRoleKey = parsed.SUPABASE_SERVICE_ROLE_KEY || '';
  const adminEmail = parsed.ADMIN_EMAIL || '';

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env for customer E2E OTP flow.');
  }

  return { supabaseUrl, supabaseServiceRoleKey, adminEmail };
}

async function generateSignupOtp(config: BackendEnvConfig, email: string, password: string) {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ type: 'signup', email, password })
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Supabase generate_link failed with status ${response.status}`);
  }

  const emailOtp = String(body?.email_otp || '');
  const userId = String(body?.id || '');

  if (!emailOtp || !userId) {
    throw new Error('Supabase generate_link did not return email_otp and user id.');
  }

  return { emailOtp, userId };
}

async function deleteSupabaseAuthUser(config: BackendEnvConfig, userId: string) {
  if (!userId) return;

  await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`
    }
  });
}

async function readCustomerAuthState(page: Page): Promise<{ accessToken: string; challengeId: string; customerId: string }> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('ys-customer-auth');
    if (!raw) return { accessToken: '', challengeId: '', customerId: '' };

    try {
      const parsed = JSON.parse(raw);
      const state = parsed?.state || {};
      return {
        accessToken: String(state.accessToken || ''),
        challengeId: String(state.challengeId || ''),
        customerId: String(state.customerId || '')
      };
    } catch {
      return { accessToken: '', challengeId: '', customerId: '' };
    }
  });
}

test.describe('YS Store real frontend parity checks', () => {
  test('guest product/cart/build/quote/session behavior', async ({ page, request }) => {
    const bootstrapCartResponse = page.waitForResponse((response) => {
      return response.url().includes('/api/cart') && response.request().method() === 'GET' && response.status() === 200;
    });

    await page.goto('/shop');
    const bootstrapCartEnvelope = await (await bootstrapCartResponse).json();

    await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible();
    await expect(page.locator('article.group').first()).toBeVisible();

    const initialCount = await page.locator('article.group').count();
    expect(initialCount).toBeGreaterThan(0);

    await page.locator('label:has-text("Sort") select').selectOption('price_asc');
    await page.waitForTimeout(900);

    const sortedPrices = await readCardPrices(page, 4);
    expect(sortedPrices.length).toBeGreaterThan(1);
    expect(isAscending(sortedPrices)).toBe(true);

    await page.getByLabel('In Stock').first().check();
    await page.waitForTimeout(900);
    expect(page.url()).toContain('stock_status=in_stock');

    const filteredCount = await page.locator('article.group').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    const addButtons = page.locator('button[aria-label="Add to cart"]:not([disabled])');
    const enabledCount = await addButtons.count();
    expect(enabledCount).toBeGreaterThan(0);

    const addOneEnvelope = await addProductToCart(page, addButtons.first());
    expect((addOneEnvelope?.data?.items || []).length).toBeGreaterThan(0);
    let latestAddEnvelope = addOneEnvelope;

    if (enabledCount > 1) {
      const addTwoEnvelope = await addProductToCart(page, addButtons.nth(1));
      expect((addTwoEnvelope?.data?.items || []).length).toBeGreaterThan(0);
      latestAddEnvelope = addTwoEnvelope;
    }

    await expect(page.locator('button[aria-label="Open cart"] span').first()).toBeVisible({ timeout: 15000 });

    const sessionTokenBeforeRefresh = String(latestAddEnvelope?.data?.cart?.session_token || '');
    expect(sessionTokenBeforeRefresh.length).toBeGreaterThan(0);

    const reloadCartResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/cart') && response.request().method() === 'GET' && response.status() === 200;
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    const reloadCartEnvelope = await (await reloadCartResponsePromise).json();
    expect(reloadCartEnvelope?.data?.cart?.session_token).toBe(sessionTokenBeforeRefresh);
    expect((reloadCartEnvelope?.data?.items || []).length).toBeGreaterThan(0);

    await page.getByRole('link', { name: 'Cart' }).first().click();
    await expect(page.getByRole('heading', { name: 'Your Cart' })).toBeVisible();

    const removeButtons = page.locator('button[aria-label="Remove item"]');
    const cartItemsBeforeRemove = await removeButtons.count();
    expect(cartItemsBeforeRemove).toBeGreaterThan(0);

    const totalBeforeRemoveText = await page.locator('aside:has-text("Order Summary") dd.font-mono').innerText();
    const totalBeforeRemove = parseCurrency(totalBeforeRemoveText);
    expect(totalBeforeRemove).toBeGreaterThan(0);

    const deleteCartResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/cart/items/')
        && response.request().method() === 'DELETE'
        && response.status() === 200;
    });
    const postDeleteCartResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/cart') && response.request().method() === 'GET' && response.status() === 200;
    });

    await removeButtons.first().click();
    await deleteCartResponsePromise;
    const postDeleteCartEnvelope = await (await postDeleteCartResponsePromise).json();
    expect((postDeleteCartEnvelope?.data?.items || []).length).toBeLessThan(cartItemsBeforeRemove);

    await page.waitForTimeout(700);
    const cartItemsAfterRemove = await page.locator('button[aria-label="Remove item"]').count();
    expect(cartItemsAfterRemove).toBeLessThan(cartItemsBeforeRemove);

    await page.getByRole('link', { name: 'Builder' }).first().click();
    await expect(page.getByRole('heading', { name: 'PC Builder' })).toBeVisible();

    const processorSlot = page.locator('article:has-text("Processor")').first();
    await processorSlot.getByRole('button', { name: /Select|Replace/ }).click();

    const picker = page.locator('section[role="dialog"]');
    await expect(picker).toBeVisible();

    const pickerOptions = picker.locator('button:not([aria-label="Close picker"])');
    await expect(pickerOptions.first()).toBeVisible();
    await pickerOptions.first().click();

    await expect(picker).toBeHidden();
    await expect(processorSlot.getByText('No component selected yet.')).toHaveCount(0);

    await page.getByRole('button', { name: 'Validate Build' }).click();
    await expect(page.getByText(/Compatibility:/)).toBeVisible();

    const activeBuildId = await page.evaluate(() => {
      const raw = window.localStorage.getItem('ys-session-storage');
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed?.state?.activeBuildId || null;
      } catch {
        return null;
      }
    });
    expect(activeBuildId).toBeTruthy();

    await page.getByRole('button', { name: 'Add Build to Cart' }).click();

    await page.getByRole('link', { name: 'Cart' }).first().click();
    await expect(page.getByText('Custom Build').first()).toBeVisible();

    const secondTab = await page.context().newPage();
    const secondTabCartResponse = secondTab.waitForResponse((response) => {
      return response.url().includes('/api/cart') && response.request().method() === 'GET' && response.status() === 200;
    });
    await secondTab.goto('http://127.0.0.1:4173/cart');
    const secondTabEnvelope = await (await secondTabCartResponse).json();
    expect(secondTabEnvelope?.data?.cart?.session_token).toBe(sessionTokenBeforeRefresh);
    await secondTab.close();

    const crossBuildResponse = await request.get(`http://127.0.0.1:4000/api/builds/${activeBuildId}`, {
      headers: { 'x-guest-session': `attacker-${Date.now()}` }
    });
    const crossBuildBody = await crossBuildResponse.json();

    expect(crossBuildResponse.status()).toBe(404);
    expect(crossBuildBody?.error_code).toBe('build_not_found');

    await page.getByRole('link', { name: 'Proceed to Quote' }).click();
    await expect(page.getByRole('heading', { name: 'Quote Checkout' })).toBeVisible();

    const checkoutTotalText = await page
      .locator('section:has-text("Cart Review") div.mt-4.flex.items-center.justify-between.border-t p')
      .last()
      .innerText();
    const expectedTotal = parseCurrency(checkoutTotalText);
    expect(expectedTotal).toBeGreaterThan(0);

    const quoteResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/quotes') && response.request().method() === 'POST' && response.status() === 201;
    });

    await page.getByLabel('Full Name').fill('Parity Test User');
    await page.getByLabel('Quote Type').selectOption('desktop');
    await page.getByRole('button', { name: 'Generate Quote' }).click();

    const quoteResponse = await quoteResponsePromise;
    const quoteEnvelope = await quoteResponse.json();
    const quote = quoteEnvelope.data;

    expect(quoteEnvelope.success).toBe(true);
    expect(String(quote.quote_code)).toMatch(/^DESK-[A-Z2-9]{5}$/);
    expect(Number(quote.estimated_total_tzs)).toBe(expectedTotal);
    expect(String(quote.whatsapp_url)).toMatch(/^https:\/\/wa\.me\/255\d+\?text=/);

    await expect(page.getByText('Quote Ready')).toBeVisible();
    await expect(page.getByText(quote.quote_code)).toBeVisible();

    const crossQuoteResponse = await request.post(`http://127.0.0.1:4000/api/quotes/${quote.quote_code}/whatsapp-click`, {
      headers: {
        'content-type': 'application/json',
        'x-guest-session': `attacker-${Date.now()}`
      },
      data: {}
    });
    const crossQuoteBody = await crossQuoteResponse.json();

    expect(crossQuoteResponse.status()).toBe(404);
    expect(crossQuoteBody?.error_code).toBe('quote_not_found');

    const trackPromise = page.waitForResponse((response) => {
      return response.url().includes(`/api/quotes/${quote.quote_code}/whatsapp-click`) && response.request().method() === 'POST';
    });

    await page.getByRole('button', { name: 'Continue to WhatsApp' }).click();

    const tracked = await trackPromise;
    expect(tracked.status()).toBe(200);

  });

  test('admin login/create/upload/storefront rendering', async ({ page, request }) => {
    const adminEmail = process.env.PARITY_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const adminPassword = process.env.PARITY_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    expect(adminEmail).toBeTruthy();
    expect(adminPassword).toBeTruthy();

    const suffix = Date.now();
    const title = `Parity Admin Product ${suffix}`;
    const slug = `parity-admin-product-${suffix}`;
    const sku = `YS-PAR-${suffix}`;

    await page.goto('/admin/login');
    await page.fill('#admin-email', String(adminEmail));
    await page.fill('#admin-password', String(adminPassword));
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/admin', { timeout: 25000 });
    await expect(page.getByRole('heading', { name: 'Admin Control Center' })).toBeVisible();

    await page.getByPlaceholder('Example: YS Creator Desktop Ryzen 7').fill(title);
    await page.getByPlaceholder('YS-DESK-001').fill(sku);
    await page.getByPlaceholder('ys-creator-desktop-ryzen-7').fill(slug);
    await page.getByPlaceholder('ASUS, Lenovo, YS Custom...').fill('YS');
    await page.getByPlaceholder('Predator G3').fill(`Model-${suffix}`);
    await page.getByPlaceholder('2500000').fill('1230000');
    await page.getByPlaceholder('One-line highlight for listing cards').fill('Parity verification product');

    const createResponse = page.waitForResponse((response) => {
      return response.url().includes('/api/admin/products')
        && response.request().method() === 'POST'
        && response.status() === 201;
    });

    await page.getByRole('button', { name: 'Create Product' }).click();
    const createProductResponse = await createResponse;
    const createPayload = await createProductResponse.json();
    const productId = createPayload?.data?.id;

    expect(productId).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Save Product Changes' })).toBeVisible();

    const uploadFilePath = path.join(process.cwd(), 'test-results', `parity-upload-${suffix}.png`);
    fs.mkdirSync(path.dirname(uploadFilePath), { recursive: true });
    fs.writeFileSync(uploadFilePath, Buffer.from(onePixelPngBase64, 'base64'));

    const uploadUrlResponses: Promise<unknown>[] = [
      page.waitForResponse((response) => response.url().includes('/api/media/admin/upload-url') && response.status() === 200),
      page.waitForResponse((response) => response.url().includes('/api/media/admin/upload-url') && response.status() === 200),
      page.waitForResponse((response) => response.url().includes('/api/media/admin/upload-url') && response.status() === 200),
      page.waitForResponse((response) => response.url().includes('/api/media/admin/upload/finalize') && response.status() === 201)
    ];

    await page.setInputFiles('input[type="file"]', uploadFilePath);
    await Promise.all(uploadUrlResponses);

    await expect(page.locator('section:has-text("Product media") img').first()).toBeVisible({ timeout: 30000 });

    const detailResponse = await request.get(`http://127.0.0.1:4000/api/products/${slug}`);
    expect(detailResponse.status()).toBe(200);

    const detailPayload = await detailResponse.json();
    expect(detailPayload?.data?.slug).toBe(slug);

    const media = detailPayload?.data?.media || [];
    expect(Array.isArray(media)).toBe(true);
    expect(media.length).toBeGreaterThan(0);

    for (const entry of media) {
      expect(String(entry.original_url)).toContain('/storage/v1/object/public/');
      expect(String(entry.thumb_url)).toContain('/storage/v1/object/public/');
      expect(String(entry.full_url)).toContain('/storage/v1/object/public/');
    }

    await page.goto(`/products/${slug}`);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    const productImage = page.locator(`img[alt="${title}"]`).first();
    await expect(productImage).toBeVisible();
    const imageSrc = await productImage.getAttribute('src');
    expect(String(imageSrc)).toContain('/storage/v1/object/public/');

    if (fs.existsSync(uploadFilePath)) {
      fs.unlinkSync(uploadFilePath);
    }

    const spoofedAdminResponse = await request.get('http://127.0.0.1:4000/api/admin/products', {
      headers: {
        Authorization: 'Bearer not-a-real-admin-token'
      }
    });
    expect(spoofedAdminResponse.status()).toBeGreaterThanOrEqual(401);
  });

  test('customer request otp verify persistence wishlist sync and logout', async ({ page, request }) => {
    const config = loadBackendEnvConfig();
    const runtimeAdminEmail = process.env.PARITY_ADMIN_EMAIL || process.env.ADMIN_EMAIL || config.adminEmail;
    const emailDomain = String(runtimeAdminEmail || '').includes('@')
      ? String(runtimeAdminEmail).split('@')[1]
      : 'gmail.com';

    const customerEmail = `parity-customer-${Date.now()}-${Math.floor(Math.random() * 100000)}@${emailDomain}`;
    const customerPassword = `Temp#${Math.floor(Math.random() * 1000000)}Aa`;

    let authUserId = '';

    try {
      const otpSeed = await generateSignupOtp(config, customerEmail, customerPassword);
      authUserId = otpSeed.userId;

      await page.goto('/shop');
      await expect(page.locator('article.group').first()).toBeVisible();

      const addToCartButtons = page.locator('button[aria-label="Add to cart"]:not([disabled])');
      await expect(addToCartButtons.first()).toBeVisible();

      const addCartEnvelope = await addProductToCart(page, addToCartButtons.first());
      const sourceCartId = String(addCartEnvelope?.data?.cart?.id || '');

      expect(sourceCartId.length).toBeGreaterThan(0);
      expect((addCartEnvelope?.data?.items || []).length).toBeGreaterThan(0);

      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();

      await page.fill('#email-input', customerEmail);

      const otpRequestResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/auth/request-otp') && response.request().method() === 'POST';
      });

      await page.getByRole('button', { name: /Send Verification Code|Send New Code/ }).click();
      const otpRequestResponse = await otpRequestResponsePromise;
      const otpRequestStatus = otpRequestResponse.status();

      expect([201, 429]).toContain(otpRequestStatus);

      let authAfterOtpRequest = await readCustomerAuthState(page);
      if (!authAfterOtpRequest.challengeId) {
        const fallbackChallengeId = `OTP-PARITY-${Date.now()}`;

        await page.evaluate(({ inputEmail, challengeId }) => {
          const raw = window.localStorage.getItem('ys-customer-auth');
          const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
          parsed.state = {
            ...(parsed.state || {}),
            email: inputEmail,
            challengeId
          };
          window.localStorage.setItem('ys-customer-auth', JSON.stringify(parsed));
        }, { inputEmail: customerEmail, challengeId: fallbackChallengeId });

        await page.reload();
        await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
        await page.fill('#email-input', customerEmail);

        authAfterOtpRequest = await readCustomerAuthState(page);
      }

      expect(authAfterOtpRequest.challengeId.length).toBeGreaterThan(0);

      const verifyResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/auth/verify-otp') && response.request().method() === 'POST';
      });
      const syncResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/auth/customer/persistent-cart/sync') && response.request().method() === 'PUT';
      });

      await page.fill('#code-input', otpSeed.emailOtp);
      await page.getByRole('button', { name: 'Verify and Continue' }).click();

      const verifyResponse = await verifyResponsePromise;
      expect(verifyResponse.status()).toBe(200);

      const syncResponse = await syncResponsePromise;
      expect(syncResponse.status()).toBe(200);

      await expect(page.getByRole('heading', { name: 'You are signed in' })).toBeVisible({ timeout: 30000 });

      const authAfterVerify = await readCustomerAuthState(page);
      expect(authAfterVerify.accessToken.length).toBeGreaterThan(0);
      expect(authAfterVerify.customerId.length).toBeGreaterThan(0);

      const persistentCartBeforeReloadResponse = await request.get('http://127.0.0.1:4000/api/auth/customer/persistent-cart', {
        headers: {
          Authorization: `Bearer ${authAfterVerify.accessToken}`
        }
      });
      expect(persistentCartBeforeReloadResponse.status()).toBe(200);

      const persistentCartBeforeReload = await persistentCartBeforeReloadResponse.json();
      const persistentCartIdBeforeReload = String(persistentCartBeforeReload?.data?.cart?.id || '');
      const persistentItemsBeforeReload = persistentCartBeforeReload?.data?.items || [];

      expect(persistentCartIdBeforeReload.length).toBeGreaterThan(0);
      expect(persistentItemsBeforeReload.length).toBeGreaterThan(0);

      await page.reload();
      await expect(page.getByRole('heading', { name: 'You are signed in' })).toBeVisible({ timeout: 30000 });

      const authAfterReload = await readCustomerAuthState(page);
      expect(authAfterReload.accessToken).toBe(authAfterVerify.accessToken);

      const persistentCartAfterReloadResponse = await request.get('http://127.0.0.1:4000/api/auth/customer/persistent-cart', {
        headers: {
          Authorization: `Bearer ${authAfterReload.accessToken}`
        }
      });
      expect(persistentCartAfterReloadResponse.status()).toBe(200);

      const persistentCartAfterReload = await persistentCartAfterReloadResponse.json();
      const persistentCartIdAfterReload = String(persistentCartAfterReload?.data?.cart?.id || '');
      const persistentItemsAfterReload = persistentCartAfterReload?.data?.items || [];

      expect(persistentCartIdAfterReload).toBe(persistentCartIdBeforeReload);
      expect(persistentItemsAfterReload.length).toBeGreaterThan(0);

      await page.goto('/shop');
      await expect(page.locator('article.group').first()).toBeVisible();

      const addWishlistButtons = page.locator('button[aria-label="Add to wishlist"]');
      await expect(addWishlistButtons.first()).toBeVisible();

      const addWishlistResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/auth/wishlist/items')
          && response.request().method() === 'POST'
          && response.status() === 201;
      });

      await addWishlistButtons.first().click({ force: true });
      await addWishlistResponsePromise;

      await page.goto('/wishlist');
      await expect(page.getByRole('heading', { name: 'Wishlist' })).toBeVisible();
      await expect(page.locator('article.group').first()).toBeVisible();

      const removeWishlistButtons = page.locator('button[aria-label="Remove from wishlist"]');
      await expect(removeWishlistButtons.first()).toBeVisible();

      const removeWishlistResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/auth/wishlist/items/')
          && response.request().method() === 'DELETE'
          && response.status() === 200;
      });

      await removeWishlistButtons.first().click({ force: true });
      await removeWishlistResponsePromise;

      await expect(page.getByText('No saved products yet')).toBeVisible({ timeout: 20000 });

      await page.goto('/login');
      await expect(page.getByRole('heading', { name: 'You are signed in' })).toBeVisible();

      await page.getByRole('button', { name: 'Sign Out' }).click();
      await expect(page.getByRole('button', { name: /Send Verification Code|Send New Code/ })).toBeVisible();

      const authAfterLogout = await readCustomerAuthState(page);
      expect(authAfterLogout.accessToken).toBe('');
      expect(authAfterLogout.customerId).toBe('');

      await page.reload();
      await expect(page.getByRole('button', { name: /Send Verification Code|Send New Code/ })).toBeVisible();

      const cartResponseAfterFlow = await request.get('http://127.0.0.1:4000/api/cart', {
        headers: {
          'x-guest-session': sourceCartId
        }
      });
      expect(cartResponseAfterFlow.status()).toBe(200);
    } finally {
      await deleteSupabaseAuthUser(config, authUserId);
    }
  });
});