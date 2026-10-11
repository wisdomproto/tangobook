import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { Home, BookOpen, Grid2X2 } from 'lucide-react';

const destinations = [
  { to: '/library', key: 'home', symbol: '⌂', end: true },
  { to: '/library/phonics/korean', key: 'korean', symbol: '가' },
  { to: '/library/phonics/english', key: 'english', symbol: 'Aa' },
  { to: '/library/books', key: 'books', symbol: '▤' },
  { to: '/library/activities', key: 'activities', symbol: '✦' },
];

export function LearnerNavigation({ mobile = false }: { mobile?: boolean }) {
  const { t } = useTranslation('shell');
  const { pathname } = useLocation();
  return (
    <nav
      aria-label={t(mobile ? 'nav.mobile' : 'nav.main')}
      className={
        mobile
          ? 'fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden'
          : 'hidden items-center gap-1 lg:flex'
      }
    >
      {destinations.map(({ to, key, symbol, end }) => {
        const active =
          (end ? pathname === to : pathname.startsWith(to)) ||
          (key === 'activities' &&
            (pathname.startsWith('/games') || pathname.startsWith('/vocabulary'))) ||
          (key === 'books' && pathname.startsWith('/continuous'));
        return (
          <Link
            key={key}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-xl font-bold text-ink-600 transition-colors hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-coral-700',
              mobile
                ? 'flex min-h-[72px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-sm'
                : 'flex min-h-12 items-center justify-center px-4 text-base lg:px-5 lg:text-lg',
              active && 'bg-coral-100 text-coral-700'
            )}
          >
            {mobile && (
              <span aria-hidden="true" className="text-xl leading-6">
                {key === 'home' ? (
                  <Home size={22} />
                ) : key === 'books' ? (
                  <BookOpen size={22} />
                ) : key === 'activities' ? (
                  <Grid2X2 size={22} />
                ) : (
                  symbol
                )}
              </span>
            )}
            {t(`nav.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
