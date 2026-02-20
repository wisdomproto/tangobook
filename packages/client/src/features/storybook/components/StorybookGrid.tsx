import type { StorybookSummary } from '@tangobook/shared';
import { StorybookCard } from './StorybookCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';

interface StorybookGridProps {
  storybooks: StorybookSummary[];
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function StorybookGrid({ storybooks, onDelete, onCreate }: StorybookGridProps) {
  if (storybooks.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
        }
        title="아직 동화책이 없습니다"
        description="새 동화책을 만들어보세요!"
        action={<Button onClick={onCreate}>새 동화책 만들기</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {storybooks.map((sb) => (
        <StorybookCard key={sb.id} storybook={sb} onDelete={onDelete} />
      ))}
    </div>
  );
}
