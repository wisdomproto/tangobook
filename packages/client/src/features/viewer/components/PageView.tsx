import type { Page } from '@tangobook/shared';
import type { ViewerSettings } from '../hooks/useViewerSettings';

interface PageViewProps {
  page: Page;
  settings: ViewerSettings;
}

interface CoverViewProps {
  coverImage?: string;
  title: string;
  settings: ViewerSettings;
}

interface EndViewProps {
  onRestart: () => void;
  onBack: () => void;
  darkMode: boolean;
}

const TEXT_SIZE_CLASS: Record<ViewerSettings['textSize'], string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

const stripBold = (s: string) => s.replace(/\*\*/g, '');

function getPageText(page: Page, language: string): string {
  const text = language === 'ko' ? page.text : page.translations?.[language]?.text || page.text;
  return stripBold(text);
}

const OVERLAY_TEXT_SIZE_CLASS: Record<ViewerSettings['textSize'], string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function PageView({ page, settings }: PageViewProps) {
  const text = getPageText(page, settings.language);

  if (settings.fullscreenImage) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {page.illustrationUrl ? (
          <img
            src={page.illustrationUrl}
            alt={`페이지 ${page.pageNumber}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <svg
              className="w-16 h-16 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        {settings.showText && text && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
            <div
              className={`px-6 py-3 rounded-xl bg-black/60 backdrop-blur-sm text-white text-center leading-relaxed max-w-3xl ${OVERLAY_TEXT_SIZE_CLASS[settings.textSize]}`}
            >
              {text}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4">
      {page.illustrationUrl ? (
        <img
          src={page.illustrationUrl}
          alt={`페이지 ${page.pageNumber}`}
          className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
      ) : (
        <div className="w-full max-w-lg h-64 flex items-center justify-center bg-white/5 rounded-lg border border-white/10">
          <svg
            className="w-16 h-16 text-white/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {settings.showText && text && (
        <div
          className={`mt-6 max-w-2xl text-center leading-relaxed ${TEXT_SIZE_CLASS[settings.textSize]} ${
            settings.darkMode ? 'text-white/90' : 'text-gray-800'
          }`}
        >
          {text}
        </div>
      )}
    </div>
  );
}

export function CoverView({ coverImage, title, settings }: CoverViewProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 gap-6">
      {coverImage ? (
        <img
          src={coverImage}
          alt="표지"
          className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl aspect-[4/3]"
        />
      ) : (
        <div className="w-72 h-72 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
          <svg
            className="w-20 h-20 text-white/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      )}
      <h2
        className={`text-3xl font-bold text-center ${
          settings.darkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

export function EndView({ onRestart, onBack, darkMode }: EndViewProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 gap-6">
      <div className={`text-6xl mb-2 ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>
        <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      </div>
      <p className={`text-2xl font-medium ${darkMode ? 'text-white/90' : 'text-gray-800'}`}>끝</p>
      <div className="flex gap-3 mt-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          다시 읽기
        </button>
        <button
          onClick={onBack}
          className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
