import { useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// 🔴 auth 는 barrel(index.ts) 없음 — OpsDashboardPage 와 동일하게 context 직접 import.
//    AuthContextValue 는 `user` 가 아니라 `account` 필드.
import { useAuth } from '@/features/auth/context/AuthContext';
import { isDevEmail } from '@/config/dev';
import {
  getStoredOpsPassword,
  storeOpsPassword,
  clearOpsPassword,
} from '@/features/ops/api/ops.api';
import { membersApi, type MemberSummary } from '../api/members.api';
import { MemberDetailDrawer } from '../components/MemberDetailDrawer';

const MEMBERS_KEY = ['ops-members'];
const fmtDate = (iso: string | null) => (iso ? iso.slice(0, 10) : '—');

function StatusBadge({ m }: { m: MemberSummary }) {
  if (m.banned)
    return (
      <span className="px-2 py-0.5 rounded-full bg-ink-900 text-white text-xs font-black">
        차단
      </span>
    );
  if (m.status === 'subscribed')
    return (
      <span className="px-2 py-0.5 rounded-full bg-mint-100 text-mint-700 text-xs font-black">
        구독 ~{fmtDate(m.paidUntil)}
      </span>
    );
  if (m.status === 'trial')
    return (
      <span className="px-2 py-0.5 rounded-full bg-coral-100 text-coral-600 text-xs font-black">
        체험 {m.trialDaysLeft}일
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full bg-ink-100 text-ink-500 text-xs font-black">
      만료
    </span>
  );
}

/** 비밀번호 입력 게이트 — 값은 서버(x-ops-password)에서만 검증. OpsDashboardPage 패턴 복사. */
function MembersPasswordGate({
  onSubmit,
  wrong,
}: {
  onSubmit: (pw: string) => void;
  wrong: boolean;
}) {
  const [pw, setPw] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pw.trim()) onSubmit(pw.trim());
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-2xl bg-white p-6 sm:p-8 shadow-pop text-center flex flex-col gap-4"
      >
        <div className="text-4xl" aria-hidden>
          👥
        </div>
        <h1 className="font-display text-xl font-black text-ink-900">회원 관리</h1>
        {wrong && <p className="text-sm font-bold text-danger">비밀번호가 틀렸어요</p>}
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="h-12 rounded-xl border-2 border-ink-100 px-4 text-center text-lg tracking-widest focus:border-coral-500 outline-none"
        />
        <button
          type="submit"
          disabled={!pw.trim()}
          className="h-12 rounded-xl bg-coral-500 font-black text-white hover:brightness-110 disabled:bg-ink-300"
        >
          들어가기
        </button>
      </form>
    </div>
  );
}

export default function MembersDashboardPage() {
  const { account } = useAuth();
  const qc = useQueryClient();
  const [pwEntered, setPwEntered] = useState(() => !!getStoredOpsPassword());
  const [wrong, setWrong] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // accountId

  const canTry = isDevEmail(account?.email) || pwEntered;
  const { data, isLoading, isError } = useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: async () => {
      try {
        return await membersApi.list();
      } catch (e) {
        // axios 응답 인터셉터가 에러를 `[403] 메시지` 형태의 평범한 Error 로 바꿈 → 메시지로 판별.
        // 저장된 비번(x-ops-password)이 요청을 가려 403 이면 지우고, dev 로그인 토큰 경로로 재시도.
        const msg = e instanceof Error ? e.message : '';
        if (/\[40[13]\]/.test(msg) && getStoredOpsPassword()) {
          clearOpsPassword();
          setPwEntered(false);
          setWrong(true);
          void qc.invalidateQueries({ queryKey: MEMBERS_KEY });
        }
        throw e;
      }
    },
    enabled: canTry,
    staleTime: 30_000,
    retry: false,
  });

  const filtered = useMemo(
    () => (data?.members ?? []).filter((m) => m.email.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );

  if (!canTry) {
    return (
      <MembersPasswordGate
        wrong={wrong}
        onSubmit={(pw) => {
          storeOpsPassword(pw);
          setWrong(false);
          setPwEntered(true);
          void qc.invalidateQueries({ queryKey: MEMBERS_KEY });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 p-4 sm:p-8">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-black text-ink-900 mb-4">👥 회원 관리</h1>
        {/* 요약 바 */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {(
              [
                ['총 회원', data.totals.members],
                ['오늘 활동', data.totals.activeToday],
                ['체험중', data.totals.trial],
                ['구독중', data.totals.subscribed],
                ['만료', data.totals.expired],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="bg-white rounded-2xl shadow-soft px-4 py-3">
                <p className="text-xs font-bold text-ink-500 break-keep">{label}</p>
                <p className="text-2xl font-black text-ink-900">{v}</p>
              </div>
            ))}
          </div>
        )}
        {/* 검색 */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이메일 검색"
          className="mb-3 w-full sm:w-80 rounded-xl bg-white px-4 py-2.5 shadow-soft font-bold outline-none"
        />
        {/* 테이블 */}
        {isLoading && <p className="text-ink-500 font-bold">불러오는 중…</p>}
        {isError && <p className="text-danger font-bold">불러오기 실패 — 비밀번호/서버 확인</p>}
        {data && (
          <div className="bg-white rounded-2xl shadow-soft overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-500 border-b border-ink-100">
                  {['이메일', '가입일', '자녀', '상태', '마지막 활동', '완독'].map((h) => (
                    <th key={h} className="px-4 py-3 font-black whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.accountId}
                    onClick={() => setSelected(m.accountId)}
                    className="border-b border-ink-50 hover:bg-peach-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-bold text-ink-900">{m.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                    <td className="px-4 py-3">{m.children}</td>
                    <td className="px-4 py-3">
                      <StatusBadge m={m} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(m.lastActiveAt)}</td>
                    <td className="px-4 py-3">{m.completedBooks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <MemberDetailDrawer
          accountId={selected}
          onClose={() => setSelected(null)}
          onChanged={() => void qc.invalidateQueries({ queryKey: MEMBERS_KEY })}
        />
      )}
    </div>
  );
}
