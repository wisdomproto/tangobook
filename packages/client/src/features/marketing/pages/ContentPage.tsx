import { ContentListPanel } from '../components/project/ContentListPanel';
import { ContentTabs } from '../components/content/ContentTabs';
import { useUIStore } from '../store/ui-store';

/**
 * Content generation page.
 * Left: ContentListPanel (create / list / reorder / delete contents).
 * Right: ContentTabs with per-channel editors.
 */
export function ContentPage() {
  const selectedContentId = useUIStore((s) => s.selectedContentId);

  return (
    <div className="flex h-full">
      <ContentListPanel />

      <div className="flex-1 min-w-0">
        {selectedContentId ? (
          <ContentTabs />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            콘텐츠를 선택하세요
          </div>
        )}
      </div>
    </div>
  );
}
