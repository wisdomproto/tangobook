interface Props {
  loaded: number;
  total: number;
  failed?: number;
  visible: boolean;
  label?: string;
  /** 기본 fullscreen absolute overlay. false면 inline 카드 */
  absolute?: boolean;
}

export function AssetLoadingOverlay({
  loaded,
  total,
  failed = 0,
  visible,
  label = '미리보기 준비 중',
  absolute = true,
}: Props) {
  if (!visible || total === 0) return null;
  const pct = Math.round(((loaded + failed) / total) * 100);

  const body = (
    <>
      <div className="text-sm font-semibold text-white/90">{label}</div>
      <div className="mt-1 text-4xl font-black tabular-nums text-white">
        {loaded + failed}
        <span className="text-xl text-white/60"> / {total}</span>
      </div>
      <div className="mt-3 h-2 w-64 max-w-[70vw] overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full bg-coral-400 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-white/70 tabular-nums">{pct}%</div>
      {failed > 0 && (
        <div className="mt-1 text-[11px] text-red-300">{failed}개 로드 실패 (무시하고 진행)</div>
      )}
    </>
  );

  if (!absolute) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-ink-900/90 p-6 text-white">
        {body}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      {body}
    </div>
  );
}
