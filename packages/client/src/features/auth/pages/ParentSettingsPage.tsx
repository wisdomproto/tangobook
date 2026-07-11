import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { computeAccess, SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth.api';
import { InviteButton, RedeemCodeInput, useEntitlement } from '@/features/payment';
import { useUiSound } from '@/lib/useUiSound';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { setUiLanguage } from '@/i18n';
import { ChangePinStep } from './ChangePinStep';
import { PIN_REQUIRED } from '@/config/features';

export default function ParentSettingsPage() {
  const { t, i18n } = useTranslation('auth');
  const { account, signOut } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { paidUntil, referralBonusDays, trialStartedAt } = useEntitlement();
  const { muted: uiMuted, toggleMuted: toggleUiMuted } = useUiSound();

  const access = computeAccess({
    account: account ? { createdAt: account.createdAt } : null,
    subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
    referralBonusDays,
    trialStartedAt,
  });

  // 멤버십 상태 문구
  let membershipLine: string;
  if (access.status === 'subscribed') {
    const until = paidUntil ? new Date(paidUntil).toLocaleDateString('ko-KR') : '';
    membershipLine = until
      ? t('settings.membership.subscribedUntil', { date: until })
      : t('settings.membership.subscribed');
  } else if (access.status === 'trial') {
    membershipLine = t('settings.membership.trial', { days: access.trialDaysLeft });
  } else {
    // expired / 그 외
    membershipLine = PAYWALL_ENABLED
      ? t('settings.membership.trialEnded')
      : t('settings.membership.preLaunchFree');
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/library');
  };

  const handleDelete = async () => {
    const ok1 = window.confirm(t('settings.deleteAccount.confirm1'));
    if (!ok1) return;
    const ok2 = window.confirm(t('settings.deleteAccount.confirm2'));
    if (!ok2) return;
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      navigate('/library');
    } catch (err) {
      alert(err instanceof Error ? err.message : t('settings.deleteAccount.failed'));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 멤버십 — 상태 + 결제(구독) 진입점 */}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-1">{t('settings.membership.title')}</h3>
        <p className="text-ink-600 text-sm mb-4 break-keep">{membershipLine}</p>
        {/* 유료화 OFF 동안은 결제 진입점 숨김 — "무료라며? 왜 구독?" 혼란 + 미설정 토스키 에러 방지 */}
        {PAYWALL_ENABLED && access.status !== 'subscribed' && (
          <button
            onClick={() => navigate('/subscribe')}
            className="px-6 py-3 rounded-xl bg-coral-500 text-white font-black hover:brightness-110"
          >
            {t('settings.membership.purchase')}
          </button>
        )}
      </section>

      {/* 친구 초대 — 코드 기반. 내 코드 공유 + 받은 코드 입력. */}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-2">{t('settings.invite.title')}</h3>
        <p className="text-ink-600 text-sm mb-3 break-keep">
          <Trans t={t} i18nKey="settings.invite.description" components={{ b: <b /> }} />
        </p>
        <InviteButton className="px-6 py-3 rounded-xl bg-coral-500 text-white font-black hover:brightness-110" />

        <div className="mt-5 border-t border-ink-100 pt-4">
          <p className="text-sm font-black text-ink-900 mb-2">{t('settings.invite.haveCode')}</p>
          <RedeemCodeInput />
        </div>
      </section>

      {/* 화면 언어 — 메뉴/버튼 등 UI 언어 선택 (동화책 언어와 별개) */}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-1">
          🌐 {t('common:language.uiLanguage')}
        </h3>
        <p className="text-ink-600 text-sm mb-4 break-keep">
          {t('settings.uiLanguage.description')}
        </p>
        <select
          value={i18n.language}
          onChange={(e) => void setUiLanguage(e.target.value)}
          aria-label={t('common:language.uiLanguage')}
          className="h-12 min-w-[200px] rounded-xl border-2 border-ink-100 px-3 font-bold text-ink-900 bg-white focus:border-coral-500 outline-none"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.nativeName}
            </option>
          ))}
        </select>
      </section>

      {/* 효과음 — 버튼/페이지 넘김 등 UI 효과음 켜고 끄기 */}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-1">{t('settings.sound.title')}</h3>
        <p className="text-ink-600 text-sm mb-4 break-keep">{t('settings.sound.description')}</p>
        <button
          type="button"
          onClick={toggleUiMuted}
          aria-pressed={!uiMuted}
          data-sound="none"
          className={
            'px-6 py-3 rounded-xl font-black ' +
            (uiMuted
              ? 'bg-ink-100 text-ink-600 hover:brightness-95'
              : 'bg-mint-500 text-white hover:brightness-110')
          }
        >
          {uiMuted ? t('settings.sound.off') : t('settings.sound.on')}
        </button>
      </section>

      {PIN_REQUIRED && (
        <section className="bg-white rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-black text-ink-900 mb-4">{t('settings.pinChange')}</h3>
          <ChangePinStep />
        </section>
      )}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-4">{t('settings.signOut.title')}</h3>
        <button
          onClick={handleSignOut}
          className="px-6 py-3 rounded-xl bg-coral-500 text-white font-bold"
        >
          {t('settings.signOut.button')}
        </button>
      </section>
      <section className="bg-red-50 rounded-2xl p-6 border-2 border-danger/20">
        <h3 className="text-xl font-black text-danger mb-4">{t('settings.deleteAccount.title')}</h3>
        <p className="text-ink-700 text-sm mb-4">{t('settings.deleteAccount.description')}</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-6 py-3 rounded-xl bg-danger text-white font-bold hover:brightness-110 disabled:opacity-50"
        >
          {deleting ? t('settings.deleteAccount.deleting') : t('settings.deleteAccount.button')}
        </button>
      </section>
    </div>
  );
}
