import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-peach-50 px-4 text-center">
      <div className="text-5xl" aria-hidden>
        😢
      </div>
      <h1 className="font-display text-2xl font-black text-ink-900 break-keep">
        결제에 실패했어요
      </h1>
      {message && <p className="text-sm text-slate-600 break-keep">{message}</p>}
      {code && <p className="text-xs text-slate-400">오류 코드: {code}</p>}
      <Link
        to="/subscribe"
        className="mt-4 inline-block rounded-full bg-coral-500 px-6 py-3 font-black text-white shadow-pop hover:bg-coral-600"
      >
        다시 시도
      </Link>
      <Link to="/library" className="text-sm text-slate-400 underline hover:text-slate-600">
        라이브러리로 돌아가기
      </Link>
    </div>
  );
}
