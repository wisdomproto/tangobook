import type { MasteryState } from '../lib/mastery';

/**
 * 「안 봄 / 봄 / 연습 중 / 익힘」이 무슨 뜻인지 **표 위에서 한 번** 설명한다.
 *
 * 🔴 색만 있고 뜻이 없으면 부모는 회색과 연한 코랄의 차이를 스스로 추론해야 한다 —
 *    그건 데이터 담당자의 일이지 부모의 일이 아니다(사용자 지적).
 * 🔴 **"한동안 안 하면 다시 내려간다"를 같이 말한다** — 이걸 모르면 지난주 「익힘」이 이번 주
 *    「연습 중」으로 보일 때 "애가 까먹었다"로 읽는다. 실제로는 시간이 지난 것뿐이다.
 */
const ITEMS: Array<{ key: MasteryState; cls: string; label: string; desc: string }> = [
  { key: 'unknown', cls: 'bg-ink-200', label: '안 봄', desc: '아직 안 나왔어요' },
  { key: 'seen', cls: 'bg-coral-200', label: '봄', desc: '만났지만 몇 번 안 했어요' },
  { key: 'practiced', cls: 'bg-coral-400', label: '연습 중', desc: '여러 번 해보는 중이에요' },
  { key: 'mastered', cls: 'bg-success', label: '익힘', desc: '자주 맞히고 있어요' },
];

export function MasteryLegendCard() {
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
      <h4 className="mb-2 text-sm font-bold text-ink-900">표 보는 법</h4>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {ITEMS.map((i) => (
          <li key={i.key} className="flex items-center gap-2 text-xs">
            <span className={`inline-block h-3 w-3 shrink-0 rounded-sm ${i.cls}`} />
            <span className="font-black text-ink-800">{i.label}</span>
            <span className="text-ink-500 break-keep">{i.desc}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11px] text-ink-400 break-keep">
        글자 공부뿐 아니라 <b className="font-bold text-ink-500">단어를 배우면서 만난 글자</b>도
        함께 세요. 「고기」를 배웠다면 <b className="font-bold text-ink-500">고·기</b> 칸이 「봄」이
        돼요. 그 글자만 따로 맞혀봐야 「연습 중」 위로 올라가요.
      </p>
      <p className="mt-1.5 text-[11px] text-ink-400 break-keep">
        한동안 안 하면 단계가 조금씩 내려가요. 까먹은 게 아니라 다시 볼 때가 됐다는 뜻이에요.
      </p>
    </div>
  );
}
