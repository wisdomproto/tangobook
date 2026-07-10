// Meta OAuth — dialog URL(순수) + 토큰 교환 + 계정 묶음 조회. graph v21.0.
// dflo(ai-server/services/metaOAuth.ts)에서 이식 — 로직 동일.
import type { MetaBundle, MetaPage } from '../meta-connection.store.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

export const META_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_manage_posts',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
  // pages_manage_metadata 제거 — 페이지 웹훅 구독용이라 발행엔 불필요. 요청하면 Invalid Scope 유발.
  // ⚠️ 광고 권한(ads_management/ads_read)은 뺐다 — 이 앱은 "Facebook 로그인" 이용 사례만 붙였고
  // 마케팅 API 제품이 없어서, ads_* 를 요청하면 로그인 다이얼로그에서 Invalid Scope 로 막힐 수 있다.
  // 광고 집행 기능을 붙일 때 마케팅 API 이용 사례 추가 + 여기에 ads_management/ads_read 재추가.
  // ⚠️ threads_basic / threads_content_publish 도 여기 넣으면 다이얼로그 전체가 막힌다
  // (Threads API 는 별도 OAuth — graph.threads.net). 추후 별도 연동.
];

export function buildAuthUrl(opts: { appId: string; redirectUri: string; state: string }): string {
  const scope = META_SCOPES.join(',');
  return (
    `https://www.facebook.com/v21.0/dialog/oauth?client_id=${opts.appId}` +
    `&redirect_uri=${encodeURIComponent(opts.redirectUri)}` +
    `&scope=${scope}&response_type=code&auth_type=rerequest` +
    `&state=${encodeURIComponent(opts.state)}`
  );
}

export async function exchangeCodeForToken(opts: {
  appId: string;
  appSecret: string;
  redirectUri: string;
  code: string;
}): Promise<{ token: string; expiresInSec: number }> {
  const shortRes = await fetch(
    `${GRAPH}/oauth/access_token?client_id=${opts.appId}&redirect_uri=${encodeURIComponent(
      opts.redirectUri
    )}&client_secret=${opts.appSecret}&code=${opts.code}`
  );
  const short = (await shortRes.json()) as Record<string, unknown>;
  if (short['error'])
    throw new Error(
      String((short['error'] as Record<string, unknown>)['message'] ?? 'short token error')
    );
  const longRes = await fetch(
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${opts.appId}&client_secret=${opts.appSecret}&fb_exchange_token=${String(short['access_token'] ?? '')}`
  );
  const long = (await longRes.json()) as Record<string, unknown>;
  return {
    token: String(long['access_token'] || short['access_token'] || ''),
    expiresInSec: Number(long['expires_in']) || 60 * 24 * 3600,
  };
}

export async function fetchAccounts(
  token: string,
  extraPageIds: string[] = []
): Promise<MetaBundle> {
  const [userRes, pagesRes] = await Promise.all([
    fetch(`${GRAPH}/me?fields=id,name&access_token=${token}`),
    fetch(
      `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account%7Bid,username%7D&access_token=${token}`
    ),
  ]);
  const user = (await userRes.json()) as Record<string, unknown>;
  const pages = (await pagesRes.json()) as Record<string, unknown>;
  const pagesData: Array<{
    id: string;
    name: string;
    access_token: string;
    instagram_business_account?: { id: string; username: string };
  }> =
    (pages['data'] as Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string; username: string };
    }>) || [];
  const mapped: MetaPage[] = pagesData.map((p) => ({
    id: p.id,
    name: p.name,
    pageAccessToken: p.access_token,
    instagram: p.instagram_business_account
      ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username }
      : null,
    threadsId: p.id,
  }));
  // 보강: /me/accounts 에 안 나오는 페이지(비즈니스 포트폴리오 소유 — 예: IG 연결 후 자산화)를
  // 알려진 page ID 로 직접 조회해서 합친다.
  const have = new Set(mapped.map((p) => p.id));
  for (const pid of extraPageIds) {
    if (!pid || have.has(pid)) continue;
    try {
      const r = await fetch(
        `${GRAPH}/${pid}?fields=id,name,access_token,instagram_business_account%7Bid,username%7D&access_token=${token}`
      );
      const p = (await r.json()) as {
        id?: string;
        name?: string;
        access_token?: string;
        instagram_business_account?: { id: string; username: string };
      };
      if (p.id && p.access_token) {
        mapped.push({
          id: p.id,
          name: p.name ?? p.id,
          pageAccessToken: p.access_token,
          instagram: p.instagram_business_account
            ? {
                id: p.instagram_business_account.id,
                username: p.instagram_business_account.username,
              }
            : null,
          threadsId: p.id,
        });
        have.add(p.id);
      }
    } catch {
      // 조회 실패한 페이지는 건너뜀
    }
  }
  return {
    userToken: token,
    userId: String(user['id'] ?? ''),
    userName: String(user['name'] ?? ''),
    pages: mapped,
    connectedAt: new Date().toISOString(),
  };
}
