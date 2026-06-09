/**
 * Google Analytics 4 Data API — service-account JWT → OAuth2 token → REST runReport.
 *
 * Self-contained: builds a Google OAuth2 service-account assertion (signed JWT,
 * RS256) with Node's built-in `crypto` — NO `google-auth-library`, NO
 * `@google-analytics/data` SDK. Exchanges the assertion for an access token
 * (cached in-memory ~55min, keyed by clientEmail), then calls:
 *   POST https://analyticsdata.googleapis.com/v1beta/properties/{id}:runReport
 *
 * `fetch` is global (Node 20). The REST runReport response uses the same
 * `dimensionValues[].value` / `metricValues[].value` row shape as the SDK, so
 * the row→viewmodel mappers (analytics.service) read `.value`.
 *
 * R-3 (PEM newlines / clock skew): RS256 signing needs the PEM with REAL
 * newlines. `resolveGa4Config` (analytics.service) un-escapes a row value's
 * literal `\n`, and `config.ga4.privateKey` already does (config/index.ts).
 * Do NOT double-process here — `buildServiceAccountAssertion` receives an
 * already-PEM key. `iat`/`exp` use the server clock; a >5-min skew vs Google
 * rejects the assertion (NTP-synced server assumed).
 */

import crypto from 'node:crypto';
import { AppError } from '../../../middleware/error.middleware.js';

export interface GA4Dimension {
  name: string;
}

export interface GA4Metric {
  name: string;
}

/**
 * A GA4 report row. The Data API (REST + SDK) returns dimension/metric values
 * as `{ value: string }[]`; mappers read `.value`.
 */
export interface GA4ReportRow {
  dimensionValues: { value?: string }[];
  metricValues: { value?: string }[];
}

export interface GA4Report {
  dimensionHeaders: unknown[];
  metricHeaders: unknown[];
  rows: GA4ReportRow[];
  rowCount: number;
}

/** base64url-encode (base64 → `-`/`_`, strip `=` padding). */
function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * PURE — build the signed Google service-account assertion (RS256 JWT).
 * Unit-tested: header/claim decode + signature verifies against the public key.
 */
export function buildServiceAccountAssertion(
  clientEmail: string,
  privateKey: string,
  nowSec = Math.floor(Date.now() / 1000)
): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const sig = crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKey);
  return `${signingInput}.${b64url(sig)}`;
}

// Module-level token cache, keyed by clientEmail so distinct service accounts
// don't share a token. Reused while `exp > now + 60` (≈55min effective life).
const _tokenCache = new Map<string, { token: string; exp: number }>();

/** Test-only: clear the token cache (one email or all). */
export function __resetGa4TokenCache(clientEmail?: string): void {
  if (clientEmail) _tokenCache.delete(clientEmail);
  else _tokenCache.clear();
}

/** Test-only: inspect the cached entry for an email. */
export function __getGa4TokenCache(
  clientEmail: string
): { token: string; exp: number } | undefined {
  return _tokenCache.get(clientEmail);
}

/**
 * Exchange the service-account assertion for an OAuth2 access token.
 * Caches per clientEmail; reuses while still valid (minus a 60s safety margin).
 */
export async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const cached = _tokenCache.get(clientEmail);
  if (cached && cached.exp > now + 60) return cached.token;

  const assertion = buildServiceAccountAssertion(clientEmail, privateKey, now);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new AppError(502, `GA4 token exchange 실패 (${res.status})`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new AppError(502, 'GA4 access_token 없음');
  _tokenCache.set(clientEmail, { token: json.access_token, exp: now + (json.expires_in ?? 3600) });
  return json.access_token;
}

/**
 * Run a report against the GA4 Data API. `reportBody` is the raw GA4 request
 * (dateRanges/metrics/dimensions/orderBys/limit), built per-report by callers.
 */
export async function runReport(
  cfg: { propertyId: string; clientEmail: string; privateKey: string },
  reportBody: Record<string, unknown>
): Promise<GA4Report> {
  const token = await getAccessToken(cfg.clientEmail, cfg.privateKey);
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${cfg.propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(reportBody),
    }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new AppError(502, `GA4 runReport 실패 (${res.status}): ${t.slice(0, 200)}`);
  }
  return (await res.json()) as GA4Report;
}
