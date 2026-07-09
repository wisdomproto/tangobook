// Meta(글로벌) 연동 상태/연결시작/해제 + 발행 실행 — /api/mkt 서버 프록시.
// 토큰은 서버 전용(암호화 저장) — 여기선 절대 토큰을 받지 않는다.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface MetaConnectionPage {
  id: string;
  name: string;
  instagram: { id: string; username: string } | null;
  threadsId: string | null;
}

export interface MetaConnection {
  connected: boolean;
  userName?: string;
  pages?: MetaConnectionPage[];
}

const META_CONNECTION_KEY = ['mkt', 'meta-connection'] as const;

async function getMetaConnection(): Promise<MetaConnection> {
  const res = await fetch('/api/mkt/meta/connection');
  const b = (await res.json().catch(() => ({}))) as MetaConnection & { success?: boolean };
  if (!res.ok || !b.success) return { connected: false };
  return { connected: b.connected, userName: b.userName, pages: b.pages };
}

/** 연동 상태 조회(글로벌 단일 연동). */
export function useMetaConnection() {
  return useQuery({
    queryKey: META_CONNECTION_KEY,
    queryFn: getMetaConnection,
    staleTime: 60_000,
  });
}

/** Facebook 로그인 다이얼로그로 top-level 이동(연동 완료 시 returnTo 로 복귀). */
export function startMetaConnect(returnTo: string): void {
  window.location.href = `/api/auth/meta?return=${encodeURIComponent(returnTo)}`;
}

/** 연동 해제(서버의 암호화 토큰 삭제). */
export function useDisconnectMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/mkt/meta/connection', { method: 'DELETE' });
      const b = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !b.success) throw new Error(b.error || '연결 해제 실패');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: META_CONNECTION_KEY });
    },
  });
}

/** 발행 레코드 1건 즉시 발행(수동·자동 공용 실행기). 반환 = postId. */
export async function runPublish(recordId: string): Promise<string> {
  const res = await fetch('/api/mkt/publish/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordId }),
  });
  const b = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    postId?: string;
    error?: string;
  };
  if (!res.ok || !b.success) throw new Error(b.error || '발행 실패');
  return b.postId ?? '';
}
