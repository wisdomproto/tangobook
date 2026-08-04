import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  canInstall,
  subscribeInstall,
  promptInstall,
  isStandalone,
  isIos,
  isTouchDevice,
} from '@/lib/pwa-install';

/**
 * 설치 affordance 를 보여줄지 여부 + iOS/네이티브프롬프트 플래그 (구독형).
 * 🔴 노출 기준 = 설치 안 됨(!standalone) AND (네이티브 프롬프트 준비 OR 모바일 터치).
 * beforeinstallprompt 는 크롬 참여 휴리스틱상 첫 방문엔 잘 안 떠서, 그것만 기준으로 하면
 * 비로그인 첫 유입 게스트에게 버튼이 안 보인다(사용자 리포트 2026-07-16). 모바일이면 항상 노출하고
 * 클릭 시 프롬프트 없으면 수동 안내로 폴백. 로그인 상태와 무관.
 */
export function useCanInstallPwa(): { show: boolean; ios: boolean; ready: boolean } {
  const [ready, setReady] = useState(canInstall());
  useEffect(() => subscribeInstall(() => setReady(canInstall())), []);
  const ios = isIos();
  if (isStandalone()) return { show: false, ios, ready }; // 이미 설치됨
  return { show: ready || isTouchDevice(), ios, ready };
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
 * "홈에 설치" 버튼 — PWA 설치 유도. 로그인 여부와 무관하게 노출(모바일).
 * - 네이티브 프롬프트 준비(beforeinstallprompt 수신) → 클릭 시 즉시 설치 프롬프트.
 * - iOS Safari → "공유 → 홈 화면에 추가" 안내 모달.
 * - 그 외(프롬프트 아직 없음·안드로이드·인앱 브라우저) → 브라우저 메뉴 안내 모달.
 * - 이미 설치(스탠드얼론)면 렌더 안 함.
 * 기본 스타일 = 컴팩트 pill. className 으로 배너용 큰 버튼 등 오버라이드.
 */
export function InstallPwaButton({ className, iconClassName, label }: InstallPwaButtonProps = {}) {
  const { t } = useTranslation('shell');
  const { show, ios, ready } = useCanInstallPwa();
  const [guide, setGuide] = useState<null | 'ios' | 'other'>(null);

  if (!show) return null;

  const text = label ?? t('install.button');

  const handleClick = () => {
    if (ready) {
      void promptInstall(); // 네이티브 설치 프롬프트
      return;
    }
    setGuide(ios ? 'ios' : 'other'); // 폴백 안내
  };

  return (
    <>
      <button
        onClick={handleClick}
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

      {guide && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-ink-900/50 p-4"
          onClick={() => setGuide(null)}
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
                <span>{guide === 'ios' ? t('install.iosStep1') : t('install.otherStep1')}</span>
              </li>
              <li className="flex items-start gap-2 break-keep">
                <span className="text-coral-500">2.</span>
                <span>{guide === 'ios' ? t('install.iosStep2') : t('install.otherStep2')}</span>
              </li>
            </ol>
            <button
              onClick={() => setGuide(null)}
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
