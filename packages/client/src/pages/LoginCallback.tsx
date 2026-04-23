import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function LoginCallback() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  useEffect(() => {
    const pinReset = sp.get('pinReset') === '1';
    const t = setTimeout(() => {
      navigate(pinReset ? '/login?pinReset=1' : '/login', { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [navigate, sp]);
  return (
    <div className="min-h-screen flex items-center justify-center text-ink-900">
      로그인 처리 중…
    </div>
  );
}
