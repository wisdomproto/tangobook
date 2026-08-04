import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isIos, isTouchDevice } from '@/lib/pwa-install';

/**
 * 「TV로 보기」 — 화면 미러링 안내.
 *
 * 🔴 **버튼이 미러링을 켜지 않는다.** 웹에는 AirPlay 미러링·탭 캐스트를 코드로 부르는 API가
 *    없어서(설치 프롬프트와 달리 폴백조차 없다) 우리가 할 수 있는 건 안내뿐이다. 게임의
 *    `MobileLandscapeGate`(orientation.lock 이 거부되니 "가로로 돌려주세요"로 기대는 것)와 같은 처지.
 *
 * 🔴 미러링을 고른 이유: 유튜브로 내보내는 방식과 달리 **앱이 실제로 돌기 때문에** 학습 기록이
 *    그대로 남고(리포트·마스터리) 페이월도 유지된다. mp4·Cast 리시버·TV 앱이 전부 필요 없다.
 *
 * 데스크톱에선 렌더하지 않는다 — 미러링은 폰·태블릿에서 켜는 것이라 안내가 뜻이 없다.
 */
export function TvMirrorButton({ className }: { className?: string }) {
  const { t } = useTranslation('shell');
  const [open, setOpen] = useState(false);

  if (!isTouchDevice()) return null;
  const ios = isIos();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-sm font-black text-white transition hover:bg-white/25'
        }
        data-sound="select"
      >
        <span aria-hidden>📺</span>
        <span>{t('tv.button')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-900/50 p-4 sm:items-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('tv.title')}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-black text-ink-900 break-keep">
              📺 {t('tv.title')}
            </h2>
            <ol className="mt-4 flex flex-col gap-3 text-sm font-bold text-ink-700">
              <li className="flex items-start gap-2 break-keep">
                <span className="text-coral-500">1.</span>
                <span>{ios ? t('tv.iosStep1') : t('tv.aosStep1')}</span>
              </li>
              <li className="flex items-start gap-2 break-keep">
                <span className="text-coral-500">2.</span>
                <span>{ios ? t('tv.iosStep2') : t('tv.aosStep2')}</span>
              </li>
            </ol>
            <p className="mt-4 text-xs font-bold text-ink-500 break-keep">{t('tv.note')}</p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-full bg-coral-500 py-3 font-black text-white shadow-soft transition hover:bg-coral-600"
            >
              {t('install.gotIt')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
