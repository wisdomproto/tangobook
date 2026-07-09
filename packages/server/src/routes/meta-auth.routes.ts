// Meta OAuth 라우트(공개). SPA가 /api/auth/meta로 top-level redirect → FB → /callback → SPA 복귀.
// dflo(ai-server/routes/metaAuth.ts)에서 이식.
import express, { Router } from 'express';
import { config } from '../config/index.js';
import {
  buildAuthUrl,
  exchangeCodeForToken,
  fetchAccounts,
} from '../services/mkt/external/meta-oauth.js';
import {
  saveConnection,
  getRegisteredPageIds,
  deleteConnection,
} from '../services/mkt/meta-connection.store.js';
import {
  parseSignedRequest,
  deletionConfirmationCode,
} from '../services/mkt/meta-data-deletion.js';

export const metaAuthRouter = Router();

function redirectBase(): string {
  return (process.env.META_REDIRECT_BASE || '').replace(/\/$/, '');
}

function spaOrigin(): string {
  return (process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || '').replace(/\/$/, '');
}

metaAuthRouter.get('/', (req, res) => {
  const appId = config.meta.appId;
  if (!appId) return res.status(500).send('META_APP_ID 미설정');
  const ret = String(req.query['return'] || spaOrigin());
  const redirectUri = `${redirectBase()}/api/auth/meta/callback`;
  res.redirect(buildAuthUrl({ appId, redirectUri, state: ret }));
});

metaAuthRouter.get('/callback', async (req, res) => {
  const spa = String(req.query['state'] || spaOrigin());
  const fail = (msg: string) => {
    console.error('[meta/callback] FAIL:', msg);
    return res.redirect(`${spa}?meta_error=${encodeURIComponent(msg)}`);
  };
  const code = req.query['code'] ? String(req.query['code']) : '';
  if (!code) return fail(String(req.query['error'] || 'no_code'));
  try {
    const { token, expiresInSec } = await exchangeCodeForToken({
      appId: config.meta.appId,
      appSecret: config.meta.appSecret,
      redirectUri: `${redirectBase()}/api/auth/meta/callback`,
      code,
    });
    const extraPageIds = await getRegisteredPageIds();
    const bundle = await fetchAccounts(token, extraPageIds);
    const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
    await saveConnection(bundle, expiresAt);
    res.redirect(`${spa}?meta_connected=1`);
  } catch (e) {
    fail(e instanceof Error ? e.message : 'oauth_failed');
  }
});

// POST /data-deletion — Facebook 데이터 삭제 콜백(앱 검수/라이브 요건).
// FB 가 form-urlencoded 로 signed_request 전송 → 검증 후 저장된 연동(토큰) 삭제 + 확인 URL/코드 반환.
metaAuthRouter.post('/data-deletion', express.urlencoded({ extended: false }), async (req, res) => {
  const signed = String((req.body ?? {}).signed_request || '');
  const payload = parseSignedRequest(signed, config.meta.appSecret);
  if (!payload) return res.status(400).json({ error: 'invalid signed_request' });
  const userId = String(payload.user_id || 'unknown');
  try {
    await deleteConnection();
  } catch {
    /* noop — 이미 없거나 일시 오류여도 삭제 응답은 반환 */
  }
  const code = deletionConfirmationCode(userId, config.meta.appSecret || 'salt');
  const siteBase = spaOrigin() || 'https://tangobook.co.kr';
  res.json({ url: `${siteBase}/data-deletion.html?code=${code}`, confirmation_code: code });
});
