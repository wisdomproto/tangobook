import { useEffect, useMemo, useState } from 'react';
import { ColoringPlayer } from '@/features/games/components/players/ColoringPlayer';

/**
 * 색칠공부 데모 — 파일럿 도안 19장(한글 파닉스 단어 카드) 검증용.
 *
 * 도안·정답본은 `packages/client/public/coloring/` 에 그대로 두고 매니페스트로 읽는다.
 * 파일럿을 판단한 뒤 R2 업로드(`generate-coloring-lineart.mjs --apply`)와 파닉스 단원 배선을 한다.
 */
/** 매니페스트에 저장된 모양 — 플레이어가 받는 `ColoringItem` 과 다르다. */
interface ManifestItem {
  unitId: string;
  word: string;
  lineartUrl: string;
  /** 파일럿 18장에만 있다. 새로 붙이는 도안은 정답본을 따로 만들지 않는다. */
  answerUrl?: string | null;
  originalUrl?: string | null;
  ttsUrl?: string | null;
}

/**
 * 🔴 `items` 를 **memo 해서** 넘긴다. JSX 안에서 `slice().map()` 으로 만들면 매 렌더 새 배열이라
 *    플레이어의 `items[idx]` 도 매번 새 객체가 되고, 그쪽 불러오기 effect 가 매 렌더 돌면서
 *    방금 칠한 그림을 흰 종이로 밀어 버린다. 플레이어도 deps 를 URL 로 바꿔 막아 뒀지만,
 *    호출부가 안정된 배열을 주는 게 원칙이다.
 */
function Session({
  items,
  start,
  onBack,
}: {
  items: ManifestItem[];
  start: number;
  onBack: () => void;
}) {
  const ordered = useMemo(
    () =>
      [...items.slice(start), ...items.slice(0, start)].map((it) => ({
        ...it,
        storybookId: it.unitId,
        // 🔴 **있으면 정답본, 없으면 원본 삽화.** 칸 나누기는 도안 픽셀만 보므로 두 번째 그림은
        //    색 출처일 뿐이고 둘 다 된다. 파일럿 18장은 정답본이 이미 검증돼 있어 그대로 쓰고,
        //    새 도안은 원본에서 읽는다 — 정답본을 또 만들 이유가 없다.
        colorSourceUrl: it.answerUrl ?? it.originalUrl ?? '',
      })),
    [items, start]
  );
  return <ColoringPlayer items={ordered} onBack={onBack} />;
}

export default function ColoringDemoPage() {
  const [items, setItems] = useState<ManifestItem[] | null>(null);
  const [start, setStart] = useState<number | null>(null);

  useEffect(() => {
    fetch('/coloring/manifest.json')
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (!items) return <div className="p-8 text-ink-500">불러오는 중…</div>;
  if (items.length === 0) return <div className="p-8 text-danger">도안이 없습니다.</div>;

  if (start !== null) {
    return <Session items={items} start={start} onBack={() => setStart(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-black font-display text-ink-900 mb-2 break-keep">
        색칠공부 파일럿
      </h1>
      <p className="text-ink-500 mb-6 break-keep">
        도안 {items.length}장 · 색을 고르면 그 색으로 칠할 칸이 반짝입니다.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {items.map((it, i) => (
          <button
            key={`${it.unitId}-${it.word}`}
            onClick={() => setStart(i)}
            className="rounded-2xl overflow-hidden bg-white border-4 border-peach-200 shadow-soft hover:shadow-pop transition"
          >
            <img src={it.lineartUrl} alt={it.word} className="block w-full aspect-square" />
            <span className="block py-2 text-lg font-black text-ink-900 break-keep">{it.word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
