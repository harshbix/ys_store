import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173';
const API_URL = process.env.SMOKE_API_URL || 'http://localhost:4000/api';
const OTP_BASE_EMAIL = process.env.SMOKE_OTP_EMAIL || 'smoke.test@gmail.com';
const onePixelPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

const report = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  apiUrl: API_URL,
  flows: {
    auth: { pass: false, failureCause: null, checks: [] },
    adminPosting: { pass: false, failureCause: null, checks: [] }
  }
};

function addCheck(flow, name, pass, evidence = {}) {
  report.flows[flow].checks.push({ name, pass, evidence });
}

function setCause(flow, cause) {
  if (!report.flows[flow].failureCause) {
    report.flows[flow].failureCause = cause;
  }
}

function finalizeFlow(flow) {
  report.flows[flow].pass = report.flows[flow].checks.every((item) => item.pass);
  if (report.flows[flow].pass) {
    report.flows[flow].failureCause = null;
  }
}

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};

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

function resolveBackendEnv() {
  const candidates = [
    path.resolve(process.cwd(), '..', '..', 'backend', '.env'),
    path.resolve(process.cwd(), '..', 'backend', '.env'),
    path.resolve(process.cwd(), 'backend', '.env')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return parseEnvFile(candidate);
    }
  }

  return {};
}

function buildOtpEmail(base) {
  const trimmed = (base || '').trim();
  const fallback = `smoke.${Date.now()}@gmail.com`;
  if (!trimmed.includes('@')) return fallback;

  const [local, domain] = trimmed.split('@');
  const cleanLocal = local.split('+')[0] || 'smoke';
  return `${cleanLocal}+${Date.now()}@${domain}`;
}

async function generateSignupOtp(config, email) {
  const password = `S!moke${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  return {
    status: response.status,
    emailOtp: String(body?.email_otp || ''),
    userId: String(body?.id || ''),
    ok: response.ok
  };
}

async function deleteSupabaseAuthUser(config, userId) {
  if (!userId) return;
  await fetch(`${config.supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}
`
    }
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseJsonMaybe(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function requestOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function classifyRequestRoute(url) {
  const origin = requestOrigin(url);
  const baseOrigin = requestOrigin(BASE_URL);
  if (!origin || !baseOrigin) return 'unknown';
  if (origin === baseOrigin) return 'same-origin-proxy-or-preview';
  if (/supabase\.co$/i.test(origin)) return 'live-supabase-direct';
  return 'direct-external';
}

function summarizeHeaders(headers) {
  return Object.fromEntries(Object.entries(headers || {}));
}

function summarizeRequest(request) {
  const rawBody = request.postData() || '';
  return {
    url: request.url(),
    origin: requestOrigin(request.url()),
    routeKind: classifyRequestRoute(request.url()),
    method: request.method(),
    resourceType: request.resourceType(),
    headers: summarizeHeaders(request.headers()),
    cookies: request.headers().cookie || '',
    bodyText: rawBody,
    bodyJson: parseJsonMaybe(rawBody)
  };
}

async function summarizeResponse(response) {
  const bodyText = await response.text().catch(() => '');
  return {
    url: response.url(),
    status: response.status(),
    ok: response.ok(),
    headers: summarizeHeaders(response.headers()),
    bodyText,
    bodyJson: parseJsonMaybe(bodyText)
  };
}

async function captureNetworkTrace(page, request, response) {
  const requestTrace = summarizeRequest(request);
  const responseTrace = response ? await summarizeResponse(response) : null;
  const cookies = await page.context().cookies(request.url()).catch(() => []);

  return {
    request: requestTrace,
    response: responseTrace,
    contextCookies: cookies
  };
}

async function waitForRequestResult(page, matcher, action, timeout = 30000) {
  let request = null;
  let response = null;
  let failed = null;

  const cleanup = () => {
    page.off('request', onRequest);
    page.off('response', onResponse);
    page.off('requestfailed', onRequestFailed);
  };

  const onRequest = (req) => {
    if (!request && matcher(req.url(), req.method())) {
      request = req;
    }
  };

  const onResponse = (resp) => {
    const req = resp.request();
    if (request && req === request) {
      response = resp;
    }
  };

  const onRequestFailed = (req) => {
    if (request && req === request) {
      failed = req.failure()?.errorText || 'request_failed';
    }
  };

  page.on('request', onRequest);
  page.on('response', onResponse);
  page.on('requestfailed', onRequestFailed);

  try {
    await action();
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeout) {
      if (response) {
        return { ok: true, requestFired: true, request, response, failed: null };
      }

      if (failed) {
        return { ok: false, requestFired: true, request, response: null, failed };
      }

      await page.waitForTimeout(100);
    }

    return { ok: false, requestFired: Boolean(request), request, response: null, failed: request ? 'no_response' : 'request_not_fired' };
  } finally {
    cleanup();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, body };
}

async function testAuth(page, backendEnv) {
  const otpEmail = buildOtpEmail(OTP_BASE_EMAIL);

  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'domcontentloaded' });
  const liveProductVisible = await page.locator('article.group').first().isVisible({ timeout: 15000 }).catch(() => false);
  addCheck('auth', 'homepage shows live products', liveProductVisible, {
    visible: liveProductVisible
  });

  await page.getByRole('button', { name: 'Open cart' }).click();
  await page.waitForURL('**/login', { timeout: 15000 });

  addCheck('auth', 'redirected to login from cart intent', page.url().includes('/login'), {
    url: page.url()
  });

  const navState = await page.evaluate(() => window.history.state?.usr || null);
  addCheck('auth', 'return target stored as /cart', navState?.returnTo === '/cart', { state: navState });

  await page.fill('#email-input', otpEmail);

  const requestOtpResult = await waitForRequestResult(
    page,
    (url, method) => method === 'POST' && url.includes('/auth/request-otp'),
    async () => {
      await page.getByRole('button', { name: /Send verification code|Send new code/i }).click();
    },
    30000
  );

  addCheck('auth', 'OTP request receives API response', Boolean(requestOtpResult.response), {
    requestFired: requestOtpResult.requestFired,
    failed: requestOtpResult.failed
  });

  if (requestOtpResult.request) {
    report.flows.auth.network = await captureNetworkTrace(page, requestOtpResult.request, requestOtpResult.response);
  }

  if (!requestOtpResult.response) {
    if (!requestOtpResult.requestFired) {
      setCause('auth', 'frontend bug');
    } else if (/ERR_CONNECTION_REFUSED|ERR_FAILED/i.test(String(requestOtpResult.failed || ''))) {
      setCause('auth', 'environment/config issue');
    } else {
      setCause('auth', 'backend bug');
    }
    finalizeFlow('auth');
    return;
  }

  const requestStatus = requestOtpResult.response.status();
  const requestJson = report.flows.auth.network?.response?.bodyJson ?? await requestOtpResult.response.json().catch(() => null);
  const challengeId = String(requestJson?.data?.challenge_id || '');

  addCheck('auth', 'OTP request succeeds', requestStatus === 201 && Boolean(challengeId), {
    status: requestStatus,
    challengeIdPresent: Boolean(challengeId)
  });

  if (requestStatus !== 201) {
    setCause('auth', requestStatus === 429 ? 'environment/config issue' : 'backend bug');
    finalizeFlow('auth');
    return;
  }

  if (!backendEnv.SUPABASE_URL || !backendEnv.SUPABASE_SERVICE_ROLE_KEY) {
    addCheck('auth', 'OTP code retrieval config available', false, {
      reason: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend .env.'
    });
    setCause('auth', 'environment/config issue');
    finalizeFlow('auth');
    return;
  }

  const otpResult = await generateSignupOtp({
    supabaseUrl: backendEnv.SUPABASE_URL,
    supabaseServiceRoleKey: backendEnv.SUPABASE_SERVICE_ROLE_KEY
  }, otpEmail);

  addCheck('auth', 'retrieved OTP token for verification', otpResult.ok && Boolean(otpResult.emailOtp), {
    status: otpResult.status,
    hasOtp: Boolean(otpResult.emailOtp)
  });

  if (!otpResult.ok || !otpResult.emailOtp) {
    setCause('auth', 'environment/config issue');
    finalizeFlow('auth');
    return;
  }

  await page.fill('input[autocomplete="one-time-code"]', otpResult.emailOtp);

  const verifyResult = await waitForRequestResult(
    page,
    (url, method) => method === 'POST' && url.includes('/auth/verify-otp'),
    async () => {
      await page.getByRole('button', { name: /Verify and continue/i }).click();
    },
    30000
  );

  addCheck('auth', 'OTP verify receives API response', Boolean(verifyResult.response), {
    requestFired: verifyResult.requestFired,
    failed: verifyResult.failed
  });

  if (verifyResult.request) {
    report.flows.auth.verifyNetwork = await captureNetworkTrace(page, verifyResult.request, verifyResult.response);
  }

  if (!verifyResult.response) {
    if (!verifyResult.requestFired) {
      setCause('auth', 'frontend bug');
    } else if (/ERR_CONNECTION_REFUSED|ERR_FAILED/i.test(String(verifyResult.failed || ''))) {
      setCause('auth', 'environment/config issue');
    } else {
      setCause('auth', 'backend bug');
    }
    finalizeFlow('auth');
    return;
  }

  const verifyStatus = verifyResult.response.status();
  addCheck('auth', 'OTP verify succeeds', verifyStatus === 200, { status: verifyStatus });

  if (verifyStatus !== 200) {
    setCause('auth', verifyStatus >= 500 ? 'backend bug' : 'environment/config issue');
    finalizeFlow('auth');
    return;
  }

  await page.waitForURL('**/cart', { timeout: 20000 });
  addCheck('auth', 'redirects back to intended page', page.url().includes('/cart'), {
    url: page.url()
  });

  const authState = await page.evaluate(() => {
    const raw = window.localStorage.getItem('ys-customer-auth');
    if (!raw) return { accessToken: '', customerId: '' };
    try {
      const parsed = JSON.parse(raw);
      return {
        accessToken: String(parsed?.state?.accessToken || ''),
        customerId: String(parsed?.state?.customerId || '')
      };
    } catch {
      return { accessToken: '', customerId: '' };
    }
  });

  addCheck('auth', 'session established after verify', Boolean(authState.accessToken && authState.customerId), {
    hasAccessToken: Boolean(authState.accessToken),
    hasCustomerId: Boolean(authState.customerId)
  });

  await deleteSupabaseAuthUser({
    supabaseUrl: backendEnv.SUPABASE_URL,
    supabaseServiceRoleKey: backendEnv.SUPABASE_SERVICE_ROLE_KEY
  }, otpResult.userId);

  finalizeFlow('auth');
}

async function testAdminPosting(page, backendEnv) {
  const adminEmail = process.env.SMOKE_ADMIN_EMAIL || backendEnv.ADMIN_EMAIL || '';
  const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || backendEnv.ADMIN_PASSWORD || '';

  addCheck('adminPosting', 'admin credentials available', Boolean(adminEmail && adminPassword), {
    hasEmail: Boolean(adminEmail),
    hasPassword: Boolean(adminPassword)
  });

  if (!adminEmail || !adminPassword) {
    setCause('adminPosting', 'environment/config issue');
    finalizeFlow('adminPosting');
    return;
  }

  await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#admin-email', adminEmail);
  await page.fill('#admin-password', adminPassword);

  const loginResult = await waitForRequestResult(
    page,
    (url, method) => method === 'POST' && url.includes('/admin/login'),
    async () => {
      await page.getByRole('button', { name: /Sign In/i }).click();
    },
    30000
  );

  addCheck('adminPosting', 'admin login receives API response', Boolean(loginResult.response), {
    requestFired: loginResult.requestFired,
    failed: loginResult.failed
  });

  if (loginResult.request) {
    report.flows.adminPosting.loginNetwork = await captureNetworkTrace(page, loginResult.request, loginResult.response);
  }

  if (!loginResult.response) {
    if (!loginResult.requestFired) {
      setCause('adminPosting', 'frontend bug');
    } else if (/ERR_CONNECTION_REFUSED|ERR_FAILED/i.test(String(loginResult.failed || ''))) {
      setCause('adminPosting', 'environment/config issue');
    } else {
      setCause('adminPosting', 'backend bug');
    }
    finalizeFlow('adminPosting');
    return;
  }

  addCheck('adminPosting', 'admin login succeeds', loginResult.response.status() === 200, {
    status: loginResult.response.status(),
    body: report.flows.adminPosting.loginNetwork?.response?.bodyJson || report.flows.adminPosting.loginNetwork?.response?.bodyText || null
  });

  if (loginResult.response.status() !== 200) {
    setCause('adminPosting', loginResult.response.status() === 401 ? 'environment/config issue' : 'backend bug');
    finalizeFlow('adminPosting');
    return;
  }

  await page.waitForURL('**/admin', { timeout: 20000 });

  const suffix = Date.now();
  const title = `Runtime Smoke Product ${suffix}`;
  const slug = slugify(title);

  const uploadFilePath = path.resolve(process.cwd(), 'test-results', `runtime-smoke-upload-${suffix}.png`);
  fs.mkdirSync(path.dirname(uploadFilePath), { recursive: true });
  fs.writeFileSync(uploadFilePath, Buffer.from(onePixelPngBase64, 'base64'));

  await page.setInputFiles('input[type="file"]', uploadFilePath);
  await page.fill('input[placeholder="Gaming PC RTX 3060"]', title);
  await page.fill('input[placeholder="850000"]', '1230000');
  await page.fill('input[placeholder="Example: Core i7, 16GB RAM, 512GB SSD"]', 'Core i7, 16GB RAM, 512GB SSD');

  const postResultPromise = waitForRequestResult(
    page,
    (url, method) => method === 'POST' && url.includes('/admin/products'),
    async () => {
      await page.getByRole('button', { name: /8\. Post Product/i }).click();
    },
    60000
  );

  const postResult = await postResultPromise;
  addCheck('adminPosting', 'product post receives API response', Boolean(postResult.response), {
    requestFired: postResult.requestFired,
    failed: postResult.failed
  });

  if (postResult.request) {
    report.flows.adminPosting.postNetwork = await captureNetworkTrace(page, postResult.request, postResult.response);
  }

  if (!postResult.response) {
    if (!postResult.requestFired) {
      setCause('adminPosting', 'frontend bug');
    } else if (/ERR_CONNECTION_REFUSED|ERR_FAILED/i.test(String(postResult.failed || ''))) {
      setCause('adminPosting', 'environment/config issue');
    } else {
      setCause('adminPosting', 'backend bug');
    }
    finalizeFlow('adminPosting');
    return;
  }

  const postStatus = postResult.response.status();
  const postJson = report.flows.adminPosting.postNetwork?.response?.bodyJson ?? await postResult.response.json().catch(() => null);
  const productId = postJson?.data?.id || null;

  addCheck('adminPosting', 'product post succeeds', postStatus === 201 && Boolean(productId), {
    status: postStatus,
    productIdPresent: Boolean(productId),
    code: postJson?.error?.code || null,
    message: postJson?.error?.message || null
  });

  if (postStatus !== 201 || !productId) {
    const errorCode = String(postJson?.error?.code || '');
    if (errorCode === 'invalid_spec_key' || errorCode === 'validation_error') {
      setCause('adminPosting', 'frontend bug');
    } else if (postStatus >= 500) {
      setCause('adminPosting', 'backend bug');
    } else {
      setCause('adminPosting', 'frontend bug');
    }
    finalizeFlow('adminPosting');
    return;
  }

  const uploadProgressVisible = await page.waitForFunction(() => {
    const progress = document.querySelector('p[aria-live="polite"]');
    return Boolean(progress && progress.textContent && progress.textContent.includes('Uploading'));
  }, { timeout: 60000 }).then(() => true).catch(() => false);

  addCheck('adminPosting', 'upload progress appears', uploadProgressVisible, {
    progressVisible: uploadProgressVisible
  });

  const uploadFinished = await page.waitForFunction(() => {
    const titleInput = document.querySelector('input[placeholder="Gaming PC RTX 3060"]');
    const progress = document.querySelector('p[aria-live="polite"]');
    return Boolean(titleInput && 'value' in titleInput && titleInput.value === '' && !progress);
  }, { timeout: 120000 }).then(() => true).catch(() => false);

  addCheck('adminPosting', 'upload flow completes before navigation', uploadFinished, {
    completed: uploadFinished
  });

  const detail = await fetchJson(`${API_URL}/products/${slug}`);
  const media = detail.body?.data?.media || [];
  const mediaUrls = media.flatMap((item) => [item.original_url, item.thumb_url, item.full_url].filter(Boolean));

  addCheck('adminPosting', 'newly posted product is live on API', detail.status === 200, {
    status: detail.status,
    slug,
    mediaCount: Array.isArray(media) ? media.length : 0
  });

  if (detail.status !== 200) {
    setCause('adminPosting', 'backend bug');
    finalizeFlow('adminPosting');
    return;
  }

  await page.goto(`${BASE_URL}/products/${slug}`, { waitUntil: 'domcontentloaded' });
  const detailImageSrc = await page.locator(`img[alt="${title}"]`).first().getAttribute('src').catch(() => null);

  const detailImageMatchesUpload = Boolean(detailImageSrc && mediaUrls.some((url) => detailImageSrc.includes(url)));
  addCheck('adminPosting', 'product detail shows correct uploaded image', detailImageMatchesUpload, {
    detailImageSrc,
    mediaSample: mediaUrls[0] || null
  });

  if (!detailImageMatchesUpload) {
    setCause('adminPosting', 'frontend bug');
  }

  if (fs.existsSync(uploadFilePath)) {
    fs.unlinkSync(uploadFilePath);
  }

  finalizeFlow('adminPosting');
}

async function main() {
  const backendEnv = resolveBackendEnv();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  try {
    try {
      await testAuth(page, backendEnv);
    } catch (error) {
      addCheck('auth', 'flow execution', false, { error: error instanceof Error ? error.message : 'flow_error' });
      setCause('auth', 'frontend bug');
      finalizeFlow('auth');
    }

    try {
      await testAdminPosting(page, backendEnv);
    } catch (error) {
      addCheck('adminPosting', 'flow execution', false, { error: error instanceof Error ? error.message : 'flow_error' });
      setCause('adminPosting', 'frontend bug');
      finalizeFlow('adminPosting');
    }
  } finally {
    await page.close();
    await browser.close();
  }

  report.completedAt = new Date().toISOString();
  report.summary = {
    passedFlows: Object.entries(report.flows).filter(([, value]) => value.pass).map(([key]) => key),
    failedFlows: Object.entries(report.flows).filter(([, value]) => !value.pass).map(([key]) => key)
  };

  const outDir = path.resolve(process.cwd(), 'test-results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `runtime-smoke-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log(JSON.stringify({ outFile, summary: report.summary }, null, 2));
}

main().catch((error) => {
  console.error('[runtime-smoke] failed', error);
  process.exitCode = 1;
});
