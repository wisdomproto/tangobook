import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import type { ViewerSettings } from '../hooks/useViewerSettings';

interface ViewerToolbarProps {
  title: string;
  settings: ViewerSettings;
  onUpdateSettings: (patch: Partial<ViewerSettings>) => void;
  onBack?: () => void;
}

const TEXT_SIZE_LABELS: Record<ViewerSettings['textSize'], string> = {
  sm: '가',
  md: '가',
  lg: '가',
};

const TEXT_SIZE_CYCLE: ViewerSettings['textSize'][] = ['sm', 'md', 'lg'];

export function ViewerToolbar({ title, settings, onUpdateSettings, onBack }: ViewerToolbarProps) {
  const navigate = useNavigate();

  const cycleTextSize = () => {
    const idx = TEXT_SIZE_CYCLE.indexOf(settings.textSize);
    onUpdateSettings({ textSize: TEXT_SIZE_CYCLE[(idx + 1) % TEXT_SIZE_CYCLE.length] });
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm">
      {/* 뒤로가기 */}
      <button
        onClick={() => (onBack ? onBack() : navigate('/library'))}
        className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
        title="목록으로"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 제목 */}
      <h1 className="flex-1 text-white/90 text-sm font-medium truncate">{title}</h1>

      {/* 언어 선택 */}
      <select
        value={settings.language}
        onChange={(e) => onUpdateSettings({ language: e.target.value })}
        className="bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/20 outline-none"
      >
        <option value="ko">한국어</option>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      {/* 텍스트 크기 */}
      <button
        onClick={cycleTextSize}
        className={`px-2 py-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors ${
          settings.textSize === 'sm'
            ? 'text-xs'
            : settings.textSize === 'md'
              ? 'text-sm'
              : 'text-base'
        }`}
        title={`텍스트 크기: ${settings.textSize}`}
      >
        {TEXT_SIZE_LABELS[settings.textSize]}
      </button>

      {/* 텍스트 표시 토글 */}
      <button
        onClick={() => onUpdateSettings({ showText: !settings.showText })}
        className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${
          settings.showText ? 'text-white' : 'text-white/40'
        }`}
        title={settings.showText ? '텍스트 숨기기' : '텍스트 보이기'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h12"
          />
        </svg>
      </button>

      {/* 다크모드 */}
      <button
        onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
        className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
        title={settings.darkMode ? '라이트 모드' : '다크 모드'}
      >
        {settings.darkMode ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* 전체화면 */}
      <button
        onClick={toggleFullscreen}
        className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
        title="전체화면"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>
    </div>
  );
}
