import { useState, type FormEvent } from 'react';
import { gateLogin } from '../../api/gate';

/**
 * 마케팅 진입 게이트 — 비밀번호(8054)만 입력.
 * 성공 시 소유자 세션이 설정되어 상위 가드(MarketingLayout)가 통과시키고 이 컴포넌트는 언마운트된다.
 */
export function MarketingGate() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await gateLogin(code.trim());
      // 성공 시 gateLogin 내부에서 /marketing 으로 하드 내비게이션 → 언마운트
    } catch (e) {
      // 401 = 비번 오답 / 그 외(네트워크·502 등) = 서버 일시 오류이므로 구분해서 안내
      const msg = e instanceof Error ? e.message : '';
      setError(
        msg.includes('401')
          ? '비밀번호가 올바르지 않습니다.'
          : `로그인 오류 — 잠시 후 다시 시도해 주세요. (${msg || '네트워크 오류'})`
      );
      setLoading(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="w-full max-w-xs rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-xl font-bold text-gray-800">마케팅 스튜디오</h1>
        <p className="mb-6 text-sm text-gray-500">비밀번호를 입력하세요</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-widest focus:border-gray-500 focus:outline-none"
          placeholder="••••"
          aria-label="비밀번호"
        />
        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full rounded-lg bg-gray-800 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? '확인 중…' : '입장'}
        </button>
      </form>
    </div>
  );
}
