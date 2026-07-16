import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'tb-parent-gate-ok';
const VALID_MS = 15 * 60 * 1000; // 한 번 통과하면 15분 유지

function isVerified(): boolean {
  try {
    const t = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0);
    return t > 0 && Date.now() - t < VALID_MS;
  } catch {
    return false;
  }
}

// 유아(4~5세)는 곱셈을 못 푼다 — PIN 없이 가벼운 어른 확인.
function makeQuestion() {
  const a = 6 + Math.floor(Math.random() * 4); // 6~9
  const b = 3 + Math.floor(Math.random() * 7); // 3~9
  return { a, b };
}

/**
 * 부모 전용 화면(설정·결제·리포트) 앞의 경량 어른 확인 게이트.
 * 아이가 아이패드에서 결제/계정삭제/로그아웃에 도달하는 것을 막는다 (PIN 온보딩 마찰 없이).
 * sessionStorage 라 탭 닫으면 리셋, 통과 후 15분간 재확인 없음.
 */
export function ParentGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [ok, setOk] = useState(isVerified);
  const [q, setQ] = useState(makeQuestion);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  if (ok) return <>{children}</>;

  const submit = () => {
    if (answer.trim() !== '' && Number(answer) === q.a * q.b) {
      try {
        sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        /* best-effort */
      }
      setOk(true);
    } else {
      setWrong(true);
      setQ(makeQuestion());
      setAnswer('');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-soft p-8 text-center">
        <div className="text-4xl mb-3">🧑‍🏫</div>
        <h1 className="font-display text-xl font-black text-ink-900 break-keep">
          {t('parentGate.title')}
        </h1>
        <p className="text-sm text-ink-500 mt-2 break-keep">{t('parentGate.description')}</p>

        <p className="mt-6 text-3xl font-black text-ink-900 tracking-wider">
          {q.a} × {q.b} = ?
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, '').slice(0, 3))}
            inputMode="numeric"
            autoFocus
            aria-label={t('parentGate.answerLabel')}
            className="flex-1 min-w-0 rounded-xl border-2 border-ink-100 px-4 py-3 text-center text-xl font-black text-ink-900 outline-none focus:border-coral-400"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-coral-500 px-6 py-3 font-black text-white hover:brightness-110"
          >
            {t('parentGate.submit')}
          </button>
        </form>
        {wrong && (
          <p className="mt-3 text-danger text-sm font-bold break-keep">{t('parentGate.wrong')}</p>
        )}

        <button
          type="button"
          onClick={() => navigate(-1)}
          data-sound="back"
          className="mt-6 text-sm font-bold text-ink-400 hover:text-ink-600"
        >
          {t('parentGate.back')}
        </button>
      </div>
    </div>
  );
}
