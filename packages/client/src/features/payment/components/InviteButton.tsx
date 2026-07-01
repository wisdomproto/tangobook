import { useState } from 'react';
import { apiPost } from '@/lib/axios';

interface ReferralCodeResponse {
  code: string;
}

/**
 * 친구 초대 버튼 — 공유창(share sheet) 대신 **내 초대 코드**를 받아 화면에 표시 + 복사.
 * 친구는 회원 가입 후 설정의 "받은 코드 입력"에 이 코드를 넣어 +7일을 받는다.
 */
export function InviteButton({ className }: { className?: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      const data = await apiPost<ReferralCodeResponse>('/payments/referral/code', {});
      setCode(data.code);
      try {
        await navigator.clipboard.writeText(data.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // 복사 실패해도 코드는 화면에 노출되니 수동 복사 가능
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? '코드 받는 중…' : code ? '내 초대 코드 보기' : '친구 초대 코드 받기'}
      </button>
      {error && (
        <p className="text-danger text-xs font-bold">코드를 받지 못했어요. 다시 시도해 주세요.</p>
      )}
      {code && (
        <div className="flex items-center gap-2 rounded-xl bg-peach-50 px-3 py-2">
          <span className="text-xs font-bold text-ink-500 shrink-0">내 코드</span>
          <span
            className="flex-1 select-all font-black tracking-widest text-ink-900"
            onClick={(e) => {
              const r = document.createRange();
              r.selectNodeContents(e.currentTarget);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(r);
            }}
          >
            {code}
          </span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(code).then(
                () => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                },
                () => {}
              );
            }}
            className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-black text-coral-600 shadow-soft"
          >
            {copied ? '복사됨 ✓' : '복사'}
          </button>
        </div>
      )}
    </div>
  );
}
