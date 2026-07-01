import { useState } from 'react';
import { apiPost } from '@/lib/axios';

interface ReferralCodeResponse {
  code: string;
}

const SHARE_TITLE = '탱고북 초대';
const SHARE_TEXT = '탱고북에서 세계명작 동화를 함께 봐요! 가입하면 7일 무료 🎁';

/**
 * 친구 초대 버튼. 초대 코드를 받아 초대 링크(`/invite/CODE`)를 만들고,
 * 모바일이면 네이티브 공유 시트(카카오톡 포함), 아니면 클립보드 복사.
 * 복사 실패 시엔 링크를 화면에 노출해 수동 복사 가능(무반응 방지).
 */
export function InviteButton({ className }: { className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const flash = (s: 'copied' | 'error') => {
    setState(s);
    setTimeout(() => setState('idle'), 2500);
  };

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setFallbackUrl(null);
    try {
      const data = await apiPost<ReferralCodeResponse>('/payments/referral/code', {});
      const url = `${window.location.origin}/invite/${data.code}`;

      // 1) 모바일 네이티브 공유 (카카오톡·메시지 등) — 있으면 우선
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
          return; // 공유 시트 열림 → 성공/취소 모두 조용히 종료
        } catch (err) {
          // 사용자가 취소(AbortError)한 경우는 그냥 종료
          if (err instanceof DOMException && err.name === 'AbortError') return;
          // 그 외엔 클립보드로 폴백
        }
      }

      // 2) 클립보드 복사
      try {
        await navigator.clipboard.writeText(url);
        flash('copied');
      } catch {
        // 3) 복사도 막힘 → 링크를 노출해 수동 복사 (무반응 금지)
        setFallbackUrl(url);
        flash('error');
      }
    } catch {
      flash('error');
    } finally {
      setLoading(false);
    }
  };

  const label =
    state === 'copied'
      ? '링크 복사됨 ✓'
      : state === 'error'
        ? '아래 링크를 복사해 주세요'
        : loading
          ? '준비 중…'
          : '친구 초대하고 +7일 받기';

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleClick} disabled={loading} className={className}>
        {label}
      </button>
      {fallbackUrl && (
        <input
          readOnly
          value={fallbackUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border-2 border-ink-100 bg-white px-3 py-2 text-xs text-ink-700"
          aria-label="초대 링크"
        />
      )}
    </div>
  );
}
