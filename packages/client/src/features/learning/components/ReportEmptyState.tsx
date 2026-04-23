interface Props {
  emoji?: string;
  message: string;
  className?: string;
}

export function ReportEmptyState({ emoji = '📚', message, className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-ink-500 ${className}`}>
      <div className="mb-3 text-5xl" aria-hidden>
        {emoji}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
