// mkt_meta_connection CRUD. 토큰 묶음은 암호화 저장(글로벌 단일 연동). 토큰은 절대 클라로 안 나간다.
// dflo(ai-server/services/metaConnectionStore.ts)에서 이식 — tangobook은 getSupabaseAdmin() 서비스롤
// 클라이언트를 재사용하고, 테이블명은 mkt_meta_connection. 별도 채널 테이블이 없어 getRegisteredPageIds 는
// mkt_meta_connection 에 이미 저장된 페이지 id 를 재보강용으로 반환한다.
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { AppError } from '../../middleware/error.middleware.js';
import { encrypt, decrypt, getEncKey } from './external/meta-crypto.js';

export interface MetaPage {
  id: string;
  name: string;
  pageAccessToken: string;
  instagram: { id: string; username: string } | null;
  threadsId: string | null;
}
export interface MetaBundle {
  userToken: string;
  userId: string;
  userName: string;
  pages: MetaPage[];
  connectedAt: string;
}

/** 토큰을 뺀 공개 연동 상태(클라 노출용). */
export interface MetaConnectionPublic {
  connected: boolean;
  userName?: string;
  pages?: Array<{
    id: string;
    name: string;
    instagram: { id: string; username: string } | null;
    threadsId: string | null;
  }>;
}

function admin(): SupabaseClient {
  const a = getSupabaseAdmin();
  if (!a) throw new AppError(502, 'Supabase 서비스 키가 설정되지 않았습니다.');
  return a;
}

export async function saveConnection(bundle: MetaBundle, expiresAt: string | null): Promise<void> {
  const enc_payload = encrypt(JSON.stringify(bundle), getEncKey());
  const { error } = await admin().from('mkt_meta_connection').upsert(
    {
      meta_user_id: bundle.userId,
      meta_user_name: bundle.userName,
      enc_payload,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'meta_user_id' }
  );
  if (error) throw new Error(error.message);
  invalidateBundleCache();
}

// 복호화된 번들 in-process 캐시(성공만). 스케줄러가 tick당 여러 번 호출 → 매번 Supabase 읽기 시
// 간헐 실패(pool/네트워크)로 getBundle 이 null 되어 "Meta 연결 없음" 오발생하던 것을 방지.
let _bundleCache: { bundle: MetaBundle; at: number } | null = null;
const BUNDLE_TTL_MS = 60_000;

export async function getBundle(): Promise<MetaBundle | null> {
  if (_bundleCache && Date.now() - _bundleCache.at < BUNDLE_TTL_MS) return _bundleCache.bundle;
  const a = getSupabaseAdmin();
  if (!a) return null; // 읽기 경로는 서비스롤 미설정 시 우아하게 미연결 처리
  // 간헐 읽기 실패 대비 재시도(복호화 실패=키 불일치는 재시도 무의미하니 즉시 반환).
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await a
      .from('mkt_meta_connection')
      .select('enc_payload')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) {
      try {
        const bundle = JSON.parse(
          decrypt(data[0].enc_payload as string, getEncKey())
        ) as MetaBundle;
        _bundleCache = { bundle, at: Date.now() }; // 성공만 캐시(실패는 캐시 안 함)
        return bundle;
      } catch {
        return null;
      }
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  return null;
}

/** 연결 저장/해제 시 캐시 무효화. */
export function invalidateBundleCache(): void {
  _bundleCache = null;
}

export async function getConnectionPublic(): Promise<MetaConnectionPublic> {
  const b = await getBundle();
  if (!b) return { connected: false };
  return {
    connected: true,
    userName: b.userName,
    pages: b.pages.map((p) => ({
      id: p.id,
      name: p.name,
      instagram: p.instagram,
      threadsId: p.threadsId,
    })),
  };
}

export function findPageToken(bundle: MetaBundle, targetId: string): string | null {
  for (const p of bundle.pages) {
    if (p.id === targetId || p.instagram?.id === targetId || p.threadsId === targetId) {
      return p.pageAccessToken;
    }
  }
  return null;
}

export async function deleteConnection(): Promise<void> {
  const { error } = await admin()
    .from('mkt_meta_connection')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
  invalidateBundleCache();
}

// /me/accounts 에 안 나오는 비즈니스 포트폴리오 소유 페이지(예: IG 연결 후 자산화) 보강용.
// 이미 저장된 연동의 page_id 들을 fetchAccounts 에서 직접 조회해 bundle 에 합친다.
export async function getRegisteredPageIds(): Promise<string[]> {
  const b = await getBundle();
  if (!b) return [];
  return [...new Set(b.pages.map((p) => p.id).filter(Boolean))];
}
