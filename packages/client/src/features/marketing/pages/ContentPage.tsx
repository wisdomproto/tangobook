import { ContentListPanel } from '../components/project/ContentListPanel';

/**
 * Content generation page.
 * Left: ContentListPanel (create / list / reorder / delete contents).
 * Right: placeholder — per-content channel editors are Phase 1.
 */
export function ContentPage() {
  return (
    <div className="flex h-full">
      <ContentListPanel />

      {/* Right pane — channel editors are Phase 1, placeholder for now */}
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        콘텐츠를 선택하세요
      </div>
    </div>
  );
}
