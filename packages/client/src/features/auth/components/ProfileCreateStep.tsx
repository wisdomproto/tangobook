import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AvatarId } from '@tangobook/shared';
import { AvatarPicker } from './AvatarPicker';
import { profilesApi } from '../api/profiles.api';
import { useAuth } from '../context/AuthContext';
import { RedeemCodeInput } from '@/features/payment';
import { Mascot } from '@/design-system';

export function ProfileCreateStep() {
  const { t } = useTranslation('auth');
  const { account, refresh, setActiveProfile } = useAuth();
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const canSubmit = !busy && name.trim().length > 0 && !!avatarId && !!account;

  const handleSubmit = async () => {
    if (!canSubmit || !avatarId || !account) return;
    setBusy(true);
    try {
      const created = await profilesApi.create({
        accountId: account.id,
        name: name.trim(),
        avatarId,
        birthDate: birthDate.trim() === '' ? null : birthDate,
      });
      await refresh();
      setActiveProfile(created);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('profileCreate.createFailed'));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-pop flex flex-col gap-4 items-center">
        <Mascot state="waving" size="md" character="hori" />
        <span className="text-xs font-black text-mint-600 bg-mint-50 rounded-full px-3 py-1">
          {t('profileCreate.accountReady')}
        </span>
        <h1 className="text-2xl font-black text-ink-900 text-center">{t('profileCreate.title')}</h1>
        <p className="text-ink-500 text-center text-sm break-keep">
          {t('profileCreate.description')}
        </p>
        <div className="w-full space-y-3">
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          <input
            type="text"
            placeholder={t('profileCreate.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 10))}
            maxLength={10}
            className="w-full h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
          />
          <label className="block text-xs font-bold text-ink-400 pl-1 -mb-1">
            {t('profileCreate.birthDateLabel')}
          </label>
          <input
            type="date"
            aria-label={t('profileCreate.birthDateAria')}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full h-14 text-lg rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-14 rounded-xl bg-coral-500 text-white font-black text-lg hover:brightness-110 disabled:bg-ink-300"
        >
          {t('profileCreate.start')}
        </button>

        {/* 초대 코드로 온 사람용 — 링크(/invite)로 오면 자동 적용되지만, 코드만 받은 경우 여기서 입력. */}
        <div className="w-full border-t border-ink-100 pt-3">
          {showCode ? (
            <div className="w-full space-y-2">
              <p className="text-sm font-black text-ink-900">
                {t('profileCreate.inviteCodePrompt')}
              </p>
              <RedeemCodeInput />
            </div>
          ) : (
            <button
              onClick={() => setShowCode(true)}
              className="text-sm font-bold text-ink-400 hover:text-coral-500"
            >
              {t('profileCreate.haveInviteCode')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
