import { useState } from 'react';
import type { AvatarId } from '@tangobook/shared';
import { AvatarPicker } from './AvatarPicker';
import { profilesApi } from '../api/profiles.api';
import { useAuth } from '../context/AuthContext';
import { Mascot } from '@/design-system';

export function ProfileCreateStep() {
  const { account, refresh, setActiveProfile } = useAuth();
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);

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
      alert(err instanceof Error ? err.message : '생성 실패');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-pop flex flex-col gap-4 items-center">
        <Mascot state="waving" size="md" character="hori" />
        <h1 className="text-2xl font-black text-ink-900 text-center">첫 아이 프로필을 만들어요</h1>
        <p className="text-ink-500 text-center text-sm">나이와 이름에 맞게 학습을 추천해줄게요</p>
        <div className="w-full space-y-3">
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 10))}
            maxLength={10}
            className="w-full h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
          />
          <input
            type="date"
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
          시작하기
        </button>
      </div>
    </div>
  );
}
