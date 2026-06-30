import { useState } from 'react';
import { apiPost } from '@/lib/axios';

interface ReferralCodeResponse {
  code: string;
}

/**
 * Reusable invite button. Fetches the caller's referral code, builds the
 * invite URL, and copies it to the clipboard.
 * Usage: drop it anywhere in parent settings or a banner.
 */
export function InviteButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await apiPost<ReferralCodeResponse>('/payments/referral/code', {});
      const inviteUrl = `${window.location.origin}/?ref=${data.code}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Silently ignore — clipboard may be denied in some contexts
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {copied ? '복사됨 ✓' : '친구 초대하고 +7일 받기'}
    </button>
  );
}
