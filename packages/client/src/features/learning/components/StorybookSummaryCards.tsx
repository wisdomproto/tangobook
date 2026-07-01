interface Props {
  booksThisWeek: number;
  minutes: number;
  streak: number;
}

function SummaryCard({ value, label, unit }: { value: number; label: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-coral-500">{value}</div>
      <div className="break-keep text-xs text-ink-500">
        {label}
        {unit && <span className="ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

export function StorybookSummaryCards({ booksThisWeek, minutes, streak }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <SummaryCard value={booksThisWeek} label="이번 주" unit="권" />
      <SummaryCard value={minutes} label="약" unit="분" />
      <SummaryCard value={streak} label="연속" unit="일" />
    </div>
  );
}
