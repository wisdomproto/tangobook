import { useEffect } from 'react';

const STORAGE_KEY = 'tb_ref';

/**
 * Reads `?ref=CODE` from the URL on mount and stores it in localStorage.
 * Call this once high in the app (e.g. in App root or AuthContext).
 * The redeem trigger in AuthContext will consume it after the user logs in.
 */
export function useReferralCapture(): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ref');
    if (code) {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, []);
}
