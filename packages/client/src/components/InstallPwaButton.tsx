import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  canInstall,
  subscribeInstall,
  promptInstall,
  isStandalone,
  isIos,
} from '@/lib/pwa-install';

/**
 * "홈에 설치" 버튼 (사이드바) — PWA 설치 유도.
 * - Chrome/Android/데스크탑: beforeinstallprompt 준비되면 노출 → 클릭 시 네이티브 설치 프롬프트.
 * - iOS Safari: 프롬프트 미지원 → "공유 → 홈 화면에 추가" 안내 모달.
 * - 이미 설치(스탠드얼론) 상태거나 설치 불가 환경이면 렌더 안 함.
 */
export function InstallPwaButton() {
  const { t } = useTranslation('shell');
  const [ready, setReady] = useState(canInstall());
  const [iosGuide, setIosGuide] = useState(false);
  const ios = isIos();

  useEffect(() => subscribeInstall(() => setReady(canInstall())), []);

  if (isStandalone()) return null; // 이미 설치됨
  if (!ready && !ios) return null; // 설치 불가(미지원/이미 설치) 환경 → 죽은 버튼 안 띄움

  return (
    <>
      <button
        onClick={() => (ios ? setIosGuide(true) : void promptInstall())}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-black text-coral-600 hover:bg-white/60 transition-all"
        aria-label={t('install.button')}
        data-sound="select"
      >
        <span aria-hidden>📲</span>
        <span>{t('install.button')}</span>
      </button>

      {iosGuide && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-ink-900/50 p-4"
          onClick={() => setIosGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('install.iosTitle')}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-black font-display text-ink-900 break-keep">
              📲 {t('install.iosTitle')}
            </h2>
            <ol className="mt-4 flex flex-col gap-3 text-sm font-bold text-ink-700">
              <li className="flex items-start gap-2 break-keep">
                <span className="text-coral-500">1.</span>
                <span>{t('install.iosStep1')}</span>
              </li>
              <li className="flex items-start gap-2 break-keep">
                <span className="text-coral-500">2.</span>
                <span>{t('install.iosStep2')}</span>
              </li>
            </ol>
            <button
              onClick={() => setIosGuide(false)}
              className="mt-6 w-full rounded-full bg-coral-500 py-3 font-black text-white shadow-soft hover:bg-coral-600 transition"
            >
              {t('install.gotIt')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
