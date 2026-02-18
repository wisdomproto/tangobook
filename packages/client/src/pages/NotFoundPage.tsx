import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-gray-500 mb-8">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="text-amber-600 hover:underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
