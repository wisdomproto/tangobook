import type { SeoScoreDetail, SeoScoreItem } from '../utils/seo-score';

export function SeoScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-green-600 bg-green-50 dark:bg-green-900/30'
      : score >= 60
        ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30'
        : 'text-red-600 bg-red-50 dark:bg-red-900/30';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>SEO {score}점</span>
  );
}

function SeoScoreRow({ item }: { item: SeoScoreItem }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400 w-28 shrink-0">{item.label}</span>
      <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${
            item.score === item.maxScore
              ? 'bg-green-500'
              : item.score > 0
                ? 'bg-yellow-500'
                : 'bg-red-400'
          }`}
          style={{ width: `${(item.score / item.maxScore) * 100}%` }}
        />
      </div>
      <span className="text-[11px] text-slate-400 w-10 text-right">
        {item.score}/{item.maxScore}
      </span>
      {item.tip && (
        <span className="text-[10px] text-orange-500 ml-1 cursor-help" title={item.tip}>
          !
        </span>
      )}
    </div>
  );
}

export function SeoScorePanel({
  detail,
  onRecalc,
}: {
  detail: SeoScoreDetail;
  onRecalc?: () => void;
}) {
  const crankItems = detail.items.filter((i) => i.category === 'C-Rank');
  const diaItems = detail.items.filter((i) => i.category === 'D.I.A.+');
  const crankTotal = crankItems.reduce((s, i) => s + i.score, 0);
  const crankMax = crankItems.reduce((s, i) => s + i.maxScore, 0);
  const diaTotal = diaItems.reduce((s, i) => s + i.score, 0);
  const diaMax = diaItems.reduce((s, i) => s + i.maxScore, 0);

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          네이버 SEO 점수
        </h4>
        <div className="flex items-center gap-2">
          {onRecalc && (
            <button
              onClick={onRecalc}
              className="text-xs px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50"
            >
              재측정
            </button>
          )}
          <SeoScoreBadge score={detail.total} />
        </div>
      </div>

      {/* C-Rank */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
            C-Rank
          </span>
          <span className="text-[10px] text-slate-400">블로그 신뢰도·전문성</span>
          <span className="text-[11px] text-slate-500 ml-auto">
            {crankTotal}/{crankMax}
          </span>
        </div>
        {crankItems.map((item, i) => (
          <SeoScoreRow key={i} item={item} />
        ))}
      </div>

      {/* D.I.A.+ */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            D.I.A.+
          </span>
          <span className="text-[10px] text-slate-400">문서 품질·체류시간</span>
          <span className="text-[11px] text-slate-500 ml-auto">
            {diaTotal}/{diaMax}
          </span>
        </div>
        {diaItems.map((item, i) => (
          <SeoScoreRow key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
