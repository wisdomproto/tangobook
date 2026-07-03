import { useState } from 'react';
import type { AvatarId } from '@tangobook/shared';
import { AvatarPicker } from './AvatarPicker';
import { profilesApi } from '../api/profiles.api';
import { useAuth } from '../context/AuthContext';
import { RedeemCodeInput } from '@/features/payment';
import { Mascot } from '@/design-system';

export function ProfileCreateStep() {
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
      alert(err instanceof Error ? err.message : '생성 실패');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream-50 to-peach-100 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-pop flex flex-col gap-4 items-center">
        <Mascot state="waving" size="md" character="hori" />
        <span className="text-xs font-black text-mint-600 bg-mint-50 rounded-full px-3 py-1">
          ✓ 부모님 계정이 만들어졌어요
        </span>
        <h1 className="text-2xl font-black text-ink-900 text-center">이제 아이를 등록해요</h1>
        <p className="text-ink-500 text-center text-sm break-keep">
          아이 프로필을 만들면 나이·이름에 맞게 추천해줘요 (나중에 최대 4명까지)
        </p>
        <div className="w-full space-y-3">
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          <input
            type="text"
            placeholder="아이 이름"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 10))}
            maxLength={10}
            className="w-full h-14 text-xl rounded-xl border-2 border-ink-100 px-4 focus:border-coral-500 outline-none"
          />
          <label className="block text-xs font-bold text-ink-400 pl-1 -mb-1">생년월일 (선택)</label>
          <input
            type="date"
            aria-label="아이 생년월일 (선택)"
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

        {/* 초대 코드로 온 사람용 — 링크(/invite)로 오면 자동 적용되지만, 코드만 받은 경우 여기서 입력. */}
        <div className="w-full border-t border-ink-100 pt-3">
          {showCode ? (
            <div className="w-full space-y-2">
              <p className="text-sm font-black text-ink-900">받은 초대 코드를 입력해 주세요</p>
              <RedeemCodeInput />
            </div>
          ) : (
            <button
              onClick={() => setShowCode(true)}
              className="text-sm font-bold text-ink-400 hover:text-coral-500"
            >
              🎁 초대 코드가 있어요
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
