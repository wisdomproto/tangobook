import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/store/theme.store';
import { VocabTreeModal } from '@/features/vocabulary/components/VocabTreeModal';

const RESOURCES = [
  { href: '/pitch.html', icon: '💼', label: 'Series A Pitch', desc: '투자자용 16+1장 슬라이드' },
  { href: '/strategy.html', icon: '📋', label: '사업 전략서', desc: '비즈니스 전략·로드맵' },
  {
    href: '/curriculum-master.html',
    icon: '📚',
    label: '커리큘럼 마스터',
    desc: '책 마스터플랜·DB 연동',
  },
  {
    href: '/vocabulary-master.html',
    icon: '🔤',
    label: '어휘 마스터 (영어)',
    desc: 'Cambridge Starters 매칭',
  },
  {
    href: '/vocabulary-master-ko.html',
    icon: '🇰🇷',
    label: '어휘 마스터 (한글)',
    desc: '한글 번역 + 한글 파닉스',
  },
];

function ResourcesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
        title="자료실"
      >
        📁 자료실 <span className="text-[10px]">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
          {RESOURCES.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-start gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
            >
              <span className="text-base mt-0.5">{item.icon}</span>
              <span>
                <span className="block font-semibold text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {item.desc}
                </span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const { isDark, toggle } = useThemeStore();
  const [vocabOpen, setVocabOpen] = useState(false);

  return (
    <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-2">
        <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-base font-semibold text-slate-800 dark:text-slate-100">
          TangoBook Author
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={isDark ? '라이트 모드' : '다크 모드'}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
        <ResourcesDropdown />
        <button
          onClick={() => setVocabOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          어휘 DB
        </button>
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          동화책 뷰어
        </button>
      </div>
      <VocabTreeModal open={vocabOpen} onClose={() => setVocabOpen(false)} />
    </header>
  );
}
