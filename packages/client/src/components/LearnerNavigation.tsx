import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourseTheme } from '@/design-system';
import { cn } from '@/lib/cn';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';

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
          ? 'fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden'
          : 'storybook-navigation hidden min-w-0 items-center gap-2 md:flex'
      }
    >
      {destinations.map(({ to, key, end }) => {
        const active =
          (end ? pathname === to : pathname.startsWith(to)) ||
          (key === 'activities' &&
            (pathname.startsWith('/games') || pathname.startsWith('/vocabulary'))) ||
          (key === 'books' && pathname.startsWith('/continuous'));
        const theme = getCourseTheme(key);
        return (
          <Link
            key={key}
            to={to}
            aria-current={active ? 'page' : undefined}
            aria-label={t(`nav.${key}`)}
            title={t(`nav.${key}`)}
            className={cn(
              'rounded-xl font-bold text-ink-600 transition-colors hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-coral-700',
              mobile
                ? 'flex min-h-[72px] min-w-0 flex-1 flex-col items-center justify-center gap-1 text-sm'
                : 'flex min-h-[68px] min-w-[64px] flex-col items-center justify-center gap-0.5 px-3 text-center text-xs lg:min-w-[76px] lg:text-sm',
              theme?.focus,
              active && (theme ? `${theme.badge} ${theme.hover}` : 'bg-coral-100 text-coral-700')
            )}
          >
            <span
              aria-hidden="true"
              className="flex h-9 items-center justify-center text-3xl leading-none"
            >
              {key === 'home' ? (
                <StorybookSprite name="scenery-cottage" size={34} />
              ) : key === 'books' ? (
                <StorybookSprite name="book" size={34} />
              ) : key === 'activities' ? (
                <StorybookSprite name="combine" size={34} />
              ) : (
                <img
                  src={
                    key === 'korean'
                      ? '/images/learning/cloud-v1/korean.webp'
                      : '/images/learning/cloud-v1/english.webp'
                  }
                  alt=""
                  className="h-9 w-10 object-contain"
                />
              )}
            </span>
            {t(`nav.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
