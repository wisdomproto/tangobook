import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeAccess } from '@tangobook/shared';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth.api';
import { InviteButton, RedeemCodeInput, useEntitlement } from '@/features/payment';
import { useUiSound } from '@/lib/useUiSound';
import { PAYWALL_ENABLED } from '@/features/access/config';
import { ChangePinStep } from './ChangePinStep';
import { PIN_REQUIRED } from '@/config/features';

export default function ParentSettingsPage() {
  const { account, signOut } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const { paidUntil, referralBonusDays } = useEntitlement();
  const { muted: uiMuted, toggleMuted: toggleUiMuted } = useUiSound();

  const access = computeAccess({
    account: account ? { createdAt: account.createdAt } : null,
    subscription: paidUntil ? { status: 'active', currentPeriodEnd: paidUntil } : null,
    referralBonusDays,
  });

  // 멤버십 상태 문구
  let membershipLine: string;
  if (access.status === 'subscribed') {
    const until = paidUntil ? new Date(paidUntil).toLocaleDateString('ko-KR') : '';
    membershipLine = until ? `구독 중이에요 · ${until}까지` : '구독 중이에요';
  } else if (access.status === 'trial') {
    membershipLine = `무료 체험 중 🎉 ${access.trialDaysLeft}일 남았어요`;
  } else {
    // expired / 그 외
    membershipLine = PAYWALL_ENABLED
      ? '무료 체험이 끝났어요'
      : '정식 오픈 전이라 지금은 모든 동화가 무료예요';
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/library');
  };

  const handleDelete = async () => {
    const ok1 = window.confirm('정말 삭제할까요? 모든 자녀 프로필과 학습 기록이 사라져요');
    if (!ok1) return;
    const ok2 = window.confirm('다시 한 번, 삭제하면 되돌릴 수 없어요');
    if (!ok2) return;
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      navigate('/library');
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 실패');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 멤버십 — 상태 + 결제(구독) 진입점 */}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-1">💳 멤버십</h3>
        <p className="text-ink-600 text-sm mb-4 break-keep">{membershipLine}</p>
        {/* 유료화 OFF 동안은 결제 진입점 숨김 — "무료라며? 왜 구독?" 혼란 + 미설정 토스키 에러 방지 */}
        {PAYWALL_ENABLED && access.status !== 'subscribed' && (
          <button
            onClick={() => navigate('/subscribe')}
            className="px-6 py-3 rounded-xl bg-coral-500 text-white font-black hover:brightness-110"
          >
            이용권 구매하기
          </button>
        )}
      </section>

      {/* 친구 초대 — 코드 기반. 내 코드 공유 + 받은 코드 입력. */}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-2">🎁 친구 초대</h3>
        <p className="text-ink-600 text-sm mb-3 break-keep">
          내 코드를 친구에게 알려주세요. 친구가 <b>회원 가입 후 코드를 입력</b>하면 <b>둘 다</b>{' '}
          무료 기간이 7일씩 늘어나요 (각 최대 28일).
        </p>
        <InviteButton className="px-6 py-3 rounded-xl bg-coral-500 text-white font-black hover:brightness-110" />

        <div className="mt-5 border-t border-ink-100 pt-4">
          <p className="text-sm font-black text-ink-900 mb-2">받은 코드가 있나요?</p>
          <RedeemCodeInput />
        </div>
      </section>

      {/* 효과음 — 버튼/페이지 넘김 등 UI 효과음 켜고 끄기 */}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-1">🔊 효과음</h3>
        <p className="text-ink-600 text-sm mb-4 break-keep">
          버튼을 누르거나 페이지를 넘길 때 나는 소리예요.
        </p>
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
          {uiMuted ? '🔇 효과음 꺼짐' : '🔊 효과음 켜짐'}
        </button>
      </section>

      {PIN_REQUIRED && (
        <section className="bg-white rounded-2xl p-6 shadow-soft">
          <h3 className="text-xl font-black text-ink-900 mb-4">🔒 PIN 변경</h3>
          <ChangePinStep />
        </section>
      )}
      <section className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-black text-ink-900 mb-4">🚪 로그아웃</h3>
        <button
          onClick={handleSignOut}
          className="px-6 py-3 rounded-xl bg-coral-500 text-white font-bold"
        >
          로그아웃
        </button>
      </section>
      <section className="bg-red-50 rounded-2xl p-6 border-2 border-danger/20">
        <h3 className="text-xl font-black text-danger mb-4">⚠️ 계정 삭제</h3>
        <p className="text-ink-700 text-sm mb-4">모든 자녀 프로필과 학습 기록이 영구히 사라져요.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-6 py-3 rounded-xl bg-danger text-white font-bold hover:brightness-110 disabled:opacity-50"
        >
          {deleting ? '삭제 중…' : '계정 삭제하기'}
        </button>
      </section>
    </div>
  );
}
