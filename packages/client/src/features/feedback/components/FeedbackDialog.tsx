import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { playUi } from '@/lib/uiSound';
import { submitFeedback } from '../api/feedback.api';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * 건의하기 모달 — 로그인 사용자가 운영자에게 자유 메시지를 남긴다.
 * 저장은 supabase-direct(app_feedback, RLS own-row). 성공 시 감사 화면 → 자동 닫힘.
 */
export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const { t } = useTranslation('shell');
  const { account } = useAuth();
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');

  if (!open) return null;

  const close = () => {
    setMessage('');
    setState('idle');
    onClose();
  };

  const submit = async () => {
    const text = message.trim();
    if (!text || state === 'busy' || !account) return;
    setState('busy');
    try {
      await submitFeedback({ accountId: account.id, message: text, contact: account.email });
      playUi('success');
      setState('ok');
      // 감사 화면을 잠깐 보여준 뒤 자동으로 닫는다.
      window.setTimeout(close, 1600);
    } catch {
      setState('err');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={t('feedback.title')}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {state === 'ok' ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-5xl" aria-hidden>
              💌
            </span>
            <p className="text-lg font-black text-ink-900 break-keep">{t('feedback.thanks')}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-xl font-black font-display text-ink-900 break-keep">
                {t('feedback.title')}
              </h2>
              <button
                type="button"
                onClick={close}
                className="shrink-0 w-9 h-9 -mt-1 -mr-1 rounded-full text-ink-400 hover:bg-ink-100/60 hover:text-ink-700 flex items-center justify-center"
                aria-label={t('feedback.close')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-ink-500 font-bold mb-4 break-keep">
              {t('feedback.subtitle')}
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              placeholder={t('feedback.placeholder')}
              rows={5}
              autoFocus
              className="w-full resize-none rounded-2xl border-2 border-ink-100 px-4 py-3 text-ink-900 font-medium outline-none focus:border-coral-400 break-keep"
              aria-label={t('feedback.inputAria')}
            />

            {state === 'err' && (
              <p className="mt-2 text-danger text-xs font-bold break-keep">{t('feedback.error')}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={close}
                className="flex-1 rounded-2xl bg-ink-100 px-5 py-3 font-black text-ink-600 hover:bg-ink-200 transition-colors"
              >
                {t('feedback.cancel')}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!message.trim() || state === 'busy'}
                className="flex-1 rounded-2xl bg-coral-500 px-5 py-3 font-black text-white shadow-soft hover:bg-coral-600 disabled:opacity-40 transition-all"
              >
                {state === 'busy' ? t('feedback.sending') : t('feedback.send')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
