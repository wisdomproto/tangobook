import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ProfilePicker } from '@/features/auth/components/ProfilePicker';
import { ProfileChip } from '@/features/auth/components/ProfileChip';
import { FeedbackDialog } from '@/features/feedback';
import { LearnerNavigation } from './LearnerNavigation';
import { UiLangMenu } from './UiLangMenu';
import { InstallPwaButton } from './InstallPwaButton';

/** Learning entry points share navigation; readers and games keep their full screen. */
export function AppShell() {
  const { t, i18n } = useTranslation('shell');
  const { activeProfile, setActiveProfile, profiles, session, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const parentDialog = useRef<HTMLDialogElement>(null);
  const needsProfilePick = !!session && profiles.length > 1 && !activeProfile;
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);
  useEffect(() => {
    if (parentOpen) parentDialog.current?.showModal();
    else parentDialog.current?.close();
  }, [parentOpen]);
  const parentLink =
    'flex min-h-12 items-center rounded-xl px-4 text-base font-bold text-ink-900 hover:bg-cream-100 focus-visible:outline-coral-700';
  return (
    <div className="min-h-dvh bg-cream-50 text-ink-900">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream-50/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-[72px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/library"
            aria-label={t('logo.home')}
            className="flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline-coral-700"
          >
            <img
              src={i18n.language === 'ko' ? '/logo/logo-kr-520.webp' : '/logo/logo-en-520.webp'}
              alt={t('logo.alt')}
              className="h-9 w-auto"
            />
          </Link>
          <LearnerNavigation />
          <div className="flex shrink-0 items-center gap-2">
            {session && activeProfile && (
              <ProfileChip profile={activeProfile} onClick={() => setPickerOpen(true)} />
            )}
            <button
              type="button"
              aria-label={t('sidebar.parentMenu')}
              onClick={() => setParentOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-cream-100 focus-visible:outline-coral-700"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main className="pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
        <Outlet />
      </main>
      <LearnerNavigation mobile />
      <dialog
        ref={parentDialog}
        aria-labelledby="parent-menu-heading"
        onClose={() => setParentOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setParentOpen(false);
        }}
        className="m-auto w-[min(420px,calc(100%-32px))] overflow-visible rounded-3xl bg-white p-5 text-ink-900 shadow-pop backdrop:bg-ink-900/30"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="parent-menu-heading" className="flex-1 text-xl font-bold">
            {t('sidebar.parentMenu')}
          </h2>
          <UiLangMenu />
          <button
            type="button"
            aria-label={t('header.closeMenu')}
            onClick={() => setParentOpen(false)}
            className="h-11 w-11 rounded-full bg-cream-100 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {session && isConfigured ? (
            <>
              <Link
                className={parentLink}
                to="/parent/reports"
                onClick={() => setParentOpen(false)}
              >
                {t('sidebar.reports')}
              </Link>
              <Link
                className={parentLink}
                to="/parent/profiles"
                onClick={() => setParentOpen(false)}
              >
                {t('header.switch')}
              </Link>
              <Link
                className={parentLink}
                to="/parent/settings"
                onClick={() => setParentOpen(false)}
              >
                {t('sidebar.parentSettings')}
              </Link>
              <Link
                className={parentLink}
                to="/invite-friends"
                onClick={() => setParentOpen(false)}
              >
                {t('sidebar.inviteFriends')}
              </Link>
              <button
                type="button"
                className={parentLink}
                onClick={() => {
                  setParentOpen(false);
                  setFeedbackOpen(true);
                }}
              >
                {t('sidebar.feedback')}
              </button>
              <button
                type="button"
                className={parentLink}
                onClick={async () => {
                  if (window.confirm(t('sidebar.logoutConfirm'))) {
                    await signOut();
                    setParentOpen(false);
                  }
                }}
              >
                {t('sidebar.logout')}
              </button>
            </>
          ) : (
            isConfigured && (
              <Link to="/login" className={parentLink} onClick={() => setParentOpen(false)}>
                {t('sidebar.login')}
              </Link>
            )
          )}
          <div className="mt-3 flex min-h-12 items-center justify-between gap-3 border-t border-ink-100 pt-3">
            <InstallPwaButton className="min-h-11 rounded-xl bg-coral-700 px-4 font-bold text-white" />
          </div>
        </div>
      </dialog>
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      {(needsProfilePick || pickerOpen) && (
        <ProfilePicker
          profiles={profiles}
          onSelect={(p) => {
            setActiveProfile(p);
            setPickerOpen(false);
          }}
          onAddNew={() => {
            setPickerOpen(false);
            navigate('/parent/profiles');
          }}
          onClose={activeProfile ? () => setPickerOpen(false) : undefined}
        />
      )}
    </div>
  );
}
