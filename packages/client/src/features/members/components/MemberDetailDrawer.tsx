import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membersApi, type GrantInput } from '../api/members.api';

const DETAIL_KEY = (id: string) => ['ops-member', id];
const fmt = (iso: string | null) => (iso ? iso.replace('T', ' ').slice(0, 16) : '—');

export function MemberDetailDrawer({
  accountId,
  onClose,
  onChanged,
}: {
  accountId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: DETAIL_KEY(accountId),
    queryFn: () => membersApi.detail(accountId),
  });
  const [paidUntilDate, setPaidUntilDate] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: DETAIL_KEY(accountId) });
    onChanged();
  };
  const grantMut = useMutation({
    mutationFn: (input: GrantInput) => membersApi.grant(accountId, input),
    onSuccess: () => {
      setMsg('적용 완료');
      refresh();
    },
    onError: (e) => setMsg(`실패: ${String(e)}`),
  });
  const banMut = useMutation({
    mutationFn: (banned: boolean) => membersApi.ban(accountId, banned),
    onSuccess: () => {
      setMsg('적용 완료');
      refresh();
    },
    onError: (e) => setMsg(`실패: ${String(e)}`),
  });
  const deleteMut = useMutation({
    mutationFn: () => membersApi.remove(accountId),
    onSuccess: () => {
      onChanged();
      onClose();
    },
    onError: (e) => setMsg(`실패: ${String(e)}`),
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full overflow-y-auto bg-white p-6 shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="float-right text-2xl font-black text-ink-500">
          ✕
        </button>
        {isLoading && <p className="font-bold text-ink-500">불러오는 중…</p>}
        {data && (
          <div className="space-y-6">
            {/* 계정 */}
            <section>
              <h2 className="text-xl font-black text-ink-900 break-keep">{data.account.email}</h2>
              <p className="text-sm text-ink-500 font-bold break-keep">
                가입 {fmt(data.account.createdAt)} · 초대코드 {data.entitlement.referralCode ?? '—'}
                {data.account.banned ? ' · 🚫 차단됨' : ''}
              </p>
              <p className="text-sm text-ink-700 font-bold mt-1 break-keep">
                상태 {data.access.status} (체험 {data.access.trialDaysLeft}일 남음) · 보너스{' '}
                {data.entitlement.bonusDays}일 · 유료 ~{fmt(data.entitlement.paidUntil)} · 체험시작{' '}
                {fmt(data.entitlement.trialStartedAt)}
              </p>
            </section>
            {/* 친구 초대 */}
            <section className="rounded-2xl bg-cream-50 p-4 space-y-2">
              <h3 className="font-black text-ink-900">🤝 친구 초대</h3>
              <p className="text-sm font-bold text-ink-700 break-keep">
                받은 초대:{' '}
                {data.entitlement.referredByEmail ? (
                  <span className="text-ink-900">{data.entitlement.referredByEmail}</span>
                ) : (
                  <span className="text-ink-400">없음</span>
                )}
              </p>
              <div>
                <p className="text-sm font-bold text-ink-700 break-keep">
                  초대한 회원 ({data.invitedCount})
                </p>
                {data.invitedEmails.length > 0 ? (
                  <ul className="mt-1 space-y-0.5">
                    {data.invitedEmails.map((email, i) => (
                      <li
                        key={`${email}-${i}`}
                        className="text-sm font-bold text-ink-900 break-all"
                      >
                        · {email}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-bold text-ink-400">아직 없음</p>
                )}
              </div>
            </section>
            {/* 액션 */}
            <section className="space-y-2">
              <h3 className="font-black text-ink-900">권한 부여</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => grantMut.mutate({ type: 'bonus-days', days: 7 })}
                  className="px-3 py-2 rounded-xl bg-coral-100 text-coral-600 font-black text-sm"
                >
                  🎁 +7일
                </button>
                <button
                  onClick={() => grantMut.mutate({ type: 'bonus-days', days: 30 })}
                  className="px-3 py-2 rounded-xl bg-coral-100 text-coral-600 font-black text-sm"
                >
                  🎁 +30일
                </button>
                <button
                  onClick={() => grantMut.mutate({ type: 'trial-reset' })}
                  className="px-3 py-2 rounded-xl bg-peach-100 text-ink-700 font-black text-sm"
                >
                  체험 지금부터 리셋
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={paidUntilDate}
                  onChange={(e) => setPaidUntilDate(e.target.value)}
                  className="rounded-xl bg-cream-50 px-3 py-2 font-bold"
                />
                <button
                  disabled={!paidUntilDate}
                  onClick={() =>
                    grantMut.mutate({
                      type: 'paid-until',
                      until: `${paidUntilDate}T23:59:59+09:00`,
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-mint-100 text-mint-700 font-black text-sm disabled:opacity-40"
                >
                  💳 유료 ~날짜까지
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => banMut.mutate(!data.account.banned)}
                  className="px-3 py-2 rounded-xl bg-ink-100 text-ink-700 font-black text-sm"
                >
                  {data.account.banned ? '🔓 차단 해제' : '🚫 차단'}
                </button>
              </div>
              {msg && <p className="text-sm font-bold text-ink-500">{msg}</p>}
            </section>
            {/* 자녀별 활동 */}
            <section>
              <h3 className="font-black text-ink-900 mb-2">자녀 활동 ({data.children.length})</h3>
              <div className="space-y-3">
                {data.children.map((c) => (
                  <div key={c.profileId} className="rounded-2xl bg-cream-50 p-4">
                    <p className="font-black text-ink-900 break-keep">{c.name}</p>
                    <p className="text-sm font-bold text-ink-700 break-keep">
                      마지막 {fmt(c.lastActiveAt)} · 완독 {c.completedBooks} · 읽은시간{' '}
                      {c.readingMinutes}분 · 연속 {c.streak}일 · 단어 {c.wordsMet} · 게임{' '}
                      {c.gameSessions}판
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {c.week.map((d) => (
                        <span
                          key={d.key}
                          title={d.key}
                          className={`w-4 h-4 rounded-full ${d.active ? 'bg-coral-500' : 'bg-ink-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {data.children.length === 0 && (
                  <p className="text-sm text-ink-500 font-bold">자녀 프로필 없음</p>
                )}
              </div>
            </section>
            {/* 결제 이력 */}
            <section>
              <h3 className="font-black text-ink-900 mb-2">결제 이력 ({data.payments.length})</h3>
              {data.payments.map((p) => (
                <p key={p.orderId} className="text-sm font-bold text-ink-700 break-keep">
                  {fmt(p.paidAt ?? p.createdAt)} · {p.plan} · {p.amount.toLocaleString()}원 ·{' '}
                  {p.status}
                </p>
              ))}
              {data.payments.length === 0 && <p className="text-sm text-ink-500 font-bold">없음</p>}
            </section>
            {/* 삭제 */}
            <section className="rounded-2xl border-2 border-danger/30 p-4">
              <h3 className="font-black text-danger mb-2">🗑 계정 삭제 (복구 불가)</h3>
              <p className="text-xs text-ink-500 font-bold mb-2">
                이메일을 정확히 입력하면 활성화됩니다.
              </p>
              <div className="flex gap-2">
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={data.account.email}
                  className="flex-1 rounded-xl bg-cream-50 px-3 py-2 font-bold"
                />
                <button
                  disabled={deleteConfirm !== data.account.email || deleteMut.isPending}
                  onClick={() => deleteMut.mutate()}
                  className="px-4 py-2 rounded-xl bg-danger text-white font-black disabled:opacity-30"
                >
                  삭제
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
