import { useState, type ReactNode, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isDevEmail } from '@/config/dev';
import { opsApi, getStoredOpsPassword, storeOpsPassword, clearOpsPassword } from '../api/ops.api';

const EVENT_LABEL: Record<string, string> = {
  page_read: '페이지 읽기',
  word_exposed: '단어 노출',
  word_correct: '단어 정답',
  word_wrong: '단어 오답',
  word_spoken: '말하기',
  game_correct: '게임 정답',
  game_perfect: '게임 퍼펙트',
  phonics_complete: '파닉스 완료',
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-soft">
      <p className="text-xs font-bold text-ink-500 break-keep">{label}</p>
      <p className="mt-1 font-display text-2xl sm:text-3xl font-black text-ink-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-bold text-ink-400 break-keep">{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 sm:p-5 shadow-soft">
      <h2 className="mb-3 font-display text-base sm:text-lg font-black text-ink-900">{title}</h2>
      {children}
    </section>
  );
}

/** 비밀번호 입력 게이트 — 값은 서버(x-ops-password)에서만 검증. */
function OpsPasswordGate({ onSubmit, wrong }: { onSubmit: (pw: string) => void; wrong: boolean }) {
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
          📊
        </div>
        <h1 className="font-display text-xl font-black text-ink-900">운영 대시보드</h1>
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

/** 내부 운영 대시보드 — 운영 비밀번호 또는 DEV_EMAILS 로그인 (검증은 서버). */
export default function OpsDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { account } = useAuth();
  // 접근 시도 조건: 개발자 로그인 OR 비밀번호 입력됨. 실제 판정은 서버가 함.
  const [hasPw, setHasPw] = useState(() => !!getStoredOpsPassword());
  const [wrongPw, setWrongPw] = useState(false);
  const canTry = isDevEmail(account?.email) || hasPw;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['ops-overview'],
    queryFn: async () => {
      try {
        return await opsApi.overview();
      } catch (err) {
        // 비밀번호 오류(403) → 저장 지우고 다시 묻기
        const msg = err instanceof Error ? err.message : '';
        if (/\[40[13]\]/.test(msg) && getStoredOpsPassword()) {
          clearOpsPassword();
          setHasPw(false);
          setWrongPw(true);
        }
        throw err;
      }
    },
    enabled: canTry,
    staleTime: 60_000,
    retry: false,
  });

  if (!canTry) {
    return (
      <OpsPasswordGate
        wrong={wrongPw}
        onSubmit={(pw) => {
          storeOpsPassword(pw);
          setWrongPw(false);
          setHasPw(true);
          void queryClient.invalidateQueries({ queryKey: ['ops-overview'] });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-ink-900">
              📊 운영 대시보드
            </h1>
            <p className="mt-1 text-xs font-bold text-ink-500">
              Supabase first-party 집계 (KST)
              {data && ` · ${new Date(data.generatedAt).toLocaleString('ko-KR')} 기준`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-ink-700 shadow-soft hover:shadow-pop disabled:opacity-50 min-h-[44px]"
            >
              {isFetching ? '갱신 중…' : '🔄 새로고침'}
            </button>
            <button
              onClick={() => navigate('/library')}
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-ink-700 shadow-soft hover:shadow-pop min-h-[44px]"
            >
              🏠 홈
            </button>
          </div>
        </header>

        {isLoading && (
          <p className="py-20 text-center font-bold text-ink-500">집계를 불러오는 중…</p>
        )}
        {isError && (
          <p className="py-20 text-center font-bold text-danger break-keep">
            불러오기 실패: {error instanceof Error ? error.message : '알 수 없는 오류'}
          </p>
        )}

        {data && (
          <div className="space-y-5">
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="가입 계정" value={String(data.totals.accounts)} />
              <StatCard label="자녀 프로필" value={String(data.totals.childProfiles)} />
              <StatCard label="누적 학습 이벤트" value={data.totals.eventsTotal.toLocaleString()} />
              <StatCard
                label="활성 유료 이용권"
                value={String(data.totals.paidActive)}
                sub={`결제 ${data.totals.paidOrders}건 · ₩${data.totals.revenue.toLocaleString()}`}
              />
              <StatCard label="초대로 가입" value={String(data.totals.referredSignups)} />
              <StatCard
                label="D1 리텐션"
                value={data.retention.d1 === null ? '—' : `${data.retention.d1}%`}
                sub={`코호트 ${data.retention.cohortSize}명 (가입 7일+ 경과)`}
              />
              <StatCard
                label="D7 리텐션"
                value={data.retention.d7 === null ? '—' : `${data.retention.d7}%`}
                sub="가입 후 7일 내 학습 활동"
              />
              <StatCard
                label="오늘 활성 자녀"
                value={String(data.activeProfilesByDay.at(-1)?.count ?? 0)}
              />
            </div>

            {/* 추이 차트 */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="가입 추이 (14일)">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.signupsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e6dc" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d: string) => d.slice(5)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <Tooltip />
                      <Bar dataKey="count" name="가입" fill="#ff7c5c" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="활성 자녀 추이 (14일)">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.activeProfilesByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e6dc" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d: string) => d.slice(5)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="활성 자녀"
                        stroke="#22b8a6"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            {/* 인기 책 + 이벤트 분포 */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="많이 읽은 책 TOP 10 (페이지 읽기)">
                {data.topBooks.length === 0 ? (
                  <p className="text-sm font-bold text-ink-400">아직 데이터가 없어요</p>
                ) : (
                  <ol className="space-y-1.5">
                    {data.topBooks.map((b, i) => (
                      <li key={b.storybookId} className="flex items-center gap-2 text-sm">
                        <span className="w-6 shrink-0 text-center font-black text-coral-500">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-bold text-ink-800">
                          {b.title}
                        </span>
                        <span className="shrink-0 font-black text-ink-500">{b.reads}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
              <Panel title="학습 이벤트 분포 (누적)">
                <ul className="space-y-1.5">
                  {data.eventsByType.map((e) => (
                    <li key={e.type} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate font-bold text-ink-800">
                        {EVENT_LABEL[e.type] ?? e.type}
                      </span>
                      <span className="shrink-0 font-black text-ink-500">
                        {e.count.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            {/* 최근 가입 */}
            <Panel title="최근 가입 10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-black text-ink-500">
                      <th className="pb-2 pr-3">이메일</th>
                      <th className="pb-2 pr-3">가입일 (KST)</th>
                      <th className="pb-2">자녀</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentAccounts.map((a) => (
                      <tr key={a.email + a.createdAt} className="border-t border-cream-200">
                        <td className="py-2 pr-3 font-bold text-ink-800 break-all">{a.email}</td>
                        <td className="py-2 pr-3 whitespace-nowrap text-ink-600">
                          {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="py-2 font-black text-ink-700">{a.children}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
