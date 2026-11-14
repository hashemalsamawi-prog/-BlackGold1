import crypto from 'crypto';

export const KNOWN_PROD_D1_DATABASE_ID = 'afa90d7a-7ccd-4455-8124-8218a1df4ac4';
const ALLOWED_LOCAL_TEST_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export interface GuardOptions {
  requireMutationOptIn?: boolean;
  requireBaseUrl?: boolean;
}

export interface ValidatedTestConfig {
  accountId: string;
  databaseId: string;
  apiToken: string;
  baseUrl: string;
  allowMutation: boolean;
}

function computeIsolationProof(dbId: string, nonce: string): string {
  return crypto.createHmac('sha256', dbId).update(nonce).digest('hex');
}

/**
 * Unified fail-closed test environment guard.
 * MUST be invoked (and awaited) BEFORE importing ../d1, ../db, ../security, or ../../server.
 * Refuses to fall back to Production Cloudflare D1 or remote/unverified local servers.
 */
export async function enforceIsolatedTestEnvironment(options: GuardOptions = {}): Promise<ValidatedTestConfig> {
  const { requireMutationOptIn = true, requireBaseUrl = true } = options;

  const preExistingProdDbId = (process.env.CLOUDFLARE_DATABASE_ID || '').trim();
  const accountId = (process.env.CI_TEST_CLOUDFLARE_ACCOUNT_ID || '').trim();
  const databaseId = (process.env.CI_TEST_CLOUDFLARE_DATABASE_ID || '').trim();
  const apiToken = (process.env.CI_TEST_CLOUDFLARE_API_TOKEN || '').trim();
  const baseUrl = (process.env.CI_TEST_BASE_URL || '').trim();

  const missing: string[] = [];
  if (!accountId) missing.push('CI_TEST_CLOUDFLARE_ACCOUNT_ID');
  if (!databaseId) missing.push('CI_TEST_CLOUDFLARE_DATABASE_ID');
  if (!apiToken) missing.push('CI_TEST_CLOUDFLARE_API_TOKEN');
  if (requireBaseUrl && !baseUrl) missing.push('CI_TEST_BASE_URL');

  if (missing.length > 0) {
    throw new Error(
      `[ABORTED - FAIL CLOSED] Missing required isolated test environment variables: ${missing.join(', ')}. ` +
      'Refusing to connect to Production Cloudflare D1 or default server.'
    );
  }

  if (databaseId === KNOWN_PROD_D1_DATABASE_ID || (preExistingProdDbId && databaseId === preExistingProdDbId)) {
    throw new Error(
      '[ABORTED - FAIL CLOSED] CI_TEST_CLOUDFLARE_DATABASE_ID matches Production D1 database ID. ' +
      'Tests are strictly forbidden from running against Production D1.'
    );
  }

  let normalizedBaseUrl = '';
  if (baseUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(baseUrl);
    } catch {
      throw new Error('[ABORTED - FAIL CLOSED] CI_TEST_BASE_URL is not a valid URL.');
    }

    const host = parsedUrl.hostname.toLowerCase();
    if (
      !ALLOWED_LOCAL_TEST_HOSTS.has(host) ||
      host.endsWith('.vercel.app') ||
      host.endsWith('.run.app') ||
      host.includes('blackgold')
    ) {
      throw new Error(
        `[ABORTED - FAIL CLOSED] CI_TEST_BASE_URL host "${host}" is not an isolated local test host (localhost / 127.0.0.1 / ::1).`
      );
    }
    normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  }

  const allowMutation = process.env.CI_TESTS_ALLOW_MUTATION === 'true';
  if (requireMutationOptIn && !allowMutation) {
    throw new Error(
      '[ABORTED - FAIL CLOSED] This test suite performs database writes. ' +
      'Set CI_TESTS_ALLOW_MUTATION=true alongside isolated CI_TEST_* credentials to execute.'
    );
  }

  // Cryptographically prove the external server at CI_TEST_BASE_URL is NOT bound to Production D1
  if (normalizedBaseUrl) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let healthRes: Response;
    let healthBody: any = null;
    try {
      healthRes = await fetch(`${normalizedBaseUrl}/api/d1/health`, {
        method: 'GET',
        headers: { 'x-test-isolation-nonce': nonce },
        signal: controller.signal
      });
      healthBody = await healthRes.json().catch(() => null);
    } catch (err: any) {
      clearTimeout(timer);
      throw new Error(
        `[ABORTED - FAIL CLOSED] Failed to query ${normalizedBaseUrl}/api/d1/health to prove target server isolation: ${err?.message || err}`
      );
    }
    clearTimeout(timer);

    if (!healthRes.ok || !healthBody || healthBody.configured !== true || healthBody.isConnected !== true) {
      throw new Error(
        `[ABORTED - FAIL CLOSED] Target server at ${normalizedBaseUrl} did not report a healthy D1 connection (HTTP ${healthRes.status}). Refusing to execute tests.`
      );
    }

    if (healthBody.isProductionRuntime === true) {
      throw new Error(
        `[ABORTED - FAIL CLOSED] Target server at ${normalizedBaseUrl} is running with NODE_ENV=production. Refusing to run tests against it.`
      );
    }

    const proof = typeof healthBody.isolationProof === 'string' ? healthBody.isolationProof : '';
    if (!proof || proof.length !== 64) {
      throw new Error(
        `[ABORTED - FAIL CLOSED] Target server at ${normalizedBaseUrl} failed to return cryptographic D1 isolation proof. Cannot confirm it is not connected to Production D1.`
      );
    }

    const knownProdProof = computeIsolationProof(KNOWN_PROD_D1_DATABASE_ID, nonce);
    const preProdProof = preExistingProdDbId ? computeIsolationProof(preExistingProdDbId, nonce) : '';
    if (proof === knownProdProof || (preProdProof && proof === preProdProof)) {
      throw new Error(
        `[ABORTED - FAIL CLOSED] Target server at ${normalizedBaseUrl} is proven to be connected to Production Cloudflare D1! Aborting immediately.`
      );
    }

    const expectedTestProof = computeIsolationProof(databaseId, nonce);
    if (proof !== expectedTestProof) {
      throw new Error(
        `[ABORTED - FAIL CLOSED] Target server at ${normalizedBaseUrl} is connected to an unverified D1 database (does not match CI_TEST_CLOUDFLARE_DATABASE_ID). Refusing to proceed.`
      );
    }
  }

  // Only map dedicated test credentials AFTER strict validation passes
  process.env.CLOUDFLARE_ACCOUNT_ID = accountId;
  process.env.CLOUDFLARE_DATABASE_ID = databaseId;
  process.env.CLOUDFLARE_API_TOKEN = apiToken;
  if (normalizedBaseUrl) {
    process.env.TEST_BASE_URL = normalizedBaseUrl;
  }

  return {
    accountId,
    databaseId,
    apiToken,
    baseUrl: normalizedBaseUrl,
    allowMutation
  };
}
