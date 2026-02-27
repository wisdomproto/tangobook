interface ImageHistoryProps {
  history?: string[];
  onRestore: (idx: number) => void;
}

export function ImageHistory({ history, onRestore }: ImageHistoryProps) {
  if (!history?.length) return null;
  return (
    <div>
      <p className="text-[10px] text-slate-400 mb-1">히스토리 ({history.length})</p>
      <div className="flex gap-1 flex-wrap">
        {history.map((url, i) => (
          <button
            key={i}
            onClick={() => onRestore(i)}
            className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 overflow-hidden hover:ring-2 hover:ring-violet-400 transition"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
