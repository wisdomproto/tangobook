interface PlaceholderPageProps {
  title?: string;
}

/**
 * Generic placeholder for routes not yet implemented.
 * Real content will replace this in later chunks.
 */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-64 gap-3 text-muted-foreground">
      {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
      <p className="text-sm">준비 중</p>
    </div>
  );
}
