import { Outlet, useParams } from 'react-router-dom';
import { BookListSidebar } from '@/features/book-v2/components/BookListSidebar';
import { EmptyState } from '@/components/EmptyState';

/**
 * 저작자용 레이아웃 — 좌측 책 리스트 사이드바 + 우측 편집기 (Outlet).
 *
 * 라우트 구조:
 *  - /editor          → 사이드바만 + EmptyState
 *  - /editor/:bid     → 사이드바 + EditorPageV2
 */
export default function AuthorLayout() {
  return (
    <div className="flex min-h-screen bg-cream-50">
      <BookListSidebar />
      <div className="flex-1 min-w-0 overflow-x-auto">
        <Outlet />
      </div>
    </div>
  );
}

/** /editor index — 책 미선택 시 안내 */
export function AuthorEmptyPage() {
  const { bid } = useParams();
  if (bid) return null; // /editor/:bid 일 땐 EditorPageV2가 처리
  return (
    <div className="h-screen flex items-center justify-center p-8">
      <EmptyState
        icon={<span className="text-6xl">📚</span>}
        title="책을 선택하세요"
        description="좌측 사이드바에서 책을 클릭하거나 + 새 책 만들기"
      />
    </div>
  );
}
