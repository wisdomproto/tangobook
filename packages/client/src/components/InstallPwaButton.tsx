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
 * 설치 affordance 를 보여줄지 여부 + iOS 플래그 (구독형 — beforeinstallprompt 도착 시 갱신).
 * 배너 등 외부에서 "설치 버튼 vs 대체 콘텐츠" 를 분기할 때도 사용. 로그인 상태와 무관.
 */
export function useCanInstallPwa(): { show: boolean; ios: boolean } {
  const [ready, setReady] = useState(canInstall());
  useEffect(() => subscribeInstall(() => setReady(canInstall())), []);
  const ios = isIos();
  if (isStandalone()) return { show: false, ios }; // 이미 설치됨
  return { show: ready || ios, ios };
}

interface InstallPwaButtonProps {
  /** 버튼 className 오버라이드 (배너용 큰 버튼 등). 없으면 기본 사이드바 pill. */
  className?: string;
  /** 아이콘(📲) className 오버라이드 (크게 키울 때). */
  iconClassName?: string;
  /** 라벨 오버라이드. 없으면 shell:install.button ("홈에 설치"). */
  label?: string;
}

/**
 * "홈에 설치" 버튼 — PWA 설치 유도. 로그인 여부와 무관하게 노출.
 * - Chrome/Android/데스크탑: beforeinstallprompt 준비되면 노출 → 클릭 시 네이티브 설치 프롬프트.
 * - iOS Safari: 프롬프트 미지원 → "공유 → 홈 화면에 추가" 안내 모달.
 * - 이미 설치(스탠드얼론) 상태거나 설치 불가 환경이면 렌더 안 함.
 * 기본 스타일 = UiLangMenu 와 동일한 컴팩트 pill. className 으로 배너용 큰 버튼 등 오버라이드.
 */
export function InstallPwaButton({ className, iconClassName, label }: InstallPwaButtonProps = {}) {
  const { t } = useTranslation('shell');
  const { show, ios } = useCanInstallPwa();
  const [iosGuide, setIosGuide] = useState(false);

  if (!show) return null;

  const text = label ?? t('install.button');

  return (
    <>
      <button
        onClick={() => (ios ? setIosGuide(true) : void promptInstall())}
        className={
          className ??
          'flex w-28 items-center justify-center gap-1.5 rounded-2xl border-2 border-coral-300 bg-white px-2 py-3 text-sm font-black text-coral-600 shadow-soft transition-all hover:border-coral-400 hover:bg-coral-50 hover:shadow-pop'
        }
        aria-label={text}
        data-sound="select"
      >
        <span className={iconClassName ?? 'text-lg leading-none'} aria-hidden>
          📲
        </span>
        <span className="truncate">{text}</span>
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
