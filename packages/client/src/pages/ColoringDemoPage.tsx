import { useEffect, useMemo, useState } from 'react';
import { ColoringPlayer } from '@/features/games/components/players/ColoringPlayer';

/**
 * 색칠공부 — 작업판(`/coloring-plan.html`)에 붙인 도안 전체를 논다.
 *
 * 목록은 `public/coloring/manifest.json`(굽기 = `build-coloring-manifest.mjs`).
 * 🔴 **한 화면에 2,387장을 깔지 않는다.** 도안 한 장이 200KB 라 격자에 다 걸면 480MB 를 받는다.
 *    갈래 → 단원·책 → 그 안의 도안, 세 단계로 들어가 **연 것만** 그린다.
 */
interface ManifestItem {
  key: string;
  group: string;
  section: string;
  unitId: string;
  word: string;
  language?: 'korean' | 'english' | 'zh';
  lineartUrl: string;
  /** 파일럿에만 있던 정답본. 지금은 원본 삽화에서 색을 읽는다. */
  answerUrl?: string | null;
  originalUrl?: string | null;
  ttsUrl?: string | null;
}

/**
 * 🔴 `items` 를 **memo 해서** 넘긴다. JSX 안에서 `slice().map()` 으로 만들면 매 렌더 새 배열이라
 *    플레이어의 `items[idx]` 도 매번 새 객체가 되고, 그쪽 불러오기 effect 가 매 렌더 돌면서
 *    방금 칠한 그림을 흰 종이로 밀어 버린다.
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
        //    색 출처일 뿐이고 둘 다 된다.
        colorSourceUrl: it.answerUrl ?? it.originalUrl ?? '',
      })),
    [items, start]
  );
  return <ColoringPlayer items={ordered} onBack={onBack} />;
}

interface Section {
  label: string;
  items: ManifestItem[];
}

function groupSheets(items: ManifestItem[]): { label: string; sections: Section[] }[] {
  const groups = new Map<string, Map<string, ManifestItem[]>>();
  for (const it of items) {
    let sections = groups.get(it.group);
    if (!sections) groups.set(it.group, (sections = new Map()));
    const list = sections.get(it.section);
    if (list) list.push(it);
    else sections.set(it.section, [it]);
  }
  return [...groups].map(([label, sections]) => ({
    label,
    sections: [...sections].map(([l, items]) => ({ label: l, items })),
  }));
}

const CARD =
  'rounded-2xl bg-white border-4 border-peach-200 shadow-soft hover:shadow-pop transition';

export default function ColoringDemoPage() {
  const [items, setItems] = useState<ManifestItem[] | null>(null);
  const [group, setGroup] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [start, setStart] = useState<number | null>(null);

  useEffect(() => {
    // 🔴 `public/` 는 7일 캐시라 목록을 고쳐도 일주일 동안 안 간다.
    //    `no-cache` = 매번 물어보되 안 바뀌었으면 304 — 바이트는 안 쓰고 최신은 보장한다.
    fetch('/coloring/manifest.json', { cache: 'no-cache' })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const groups = useMemo(() => (items ? groupSheets(items) : []), [items]);
  const open = groups.find((g) => g.label === group);
  const sheets = open?.sections.find((s) => s.label === section);

  if (!items) return <div className="p-8 text-ink-500">불러오는 중…</div>;
  if (items.length === 0) return <div className="p-8 text-danger">도안이 없습니다.</div>;

  if (sheets && start !== null) {
    return <Session items={sheets.items} start={start} onBack={() => setStart(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 p-4 sm:p-8">
      <h1 className="text-3xl sm:text-4xl font-black font-display text-ink-900 mb-2 break-keep">
        색칠공부
      </h1>
      <p className="text-ink-500 mb-6 break-keep">
        도안 {items.length.toLocaleString()}장 · 색을 고르면 그 색으로 칠할 칸이 반짝입니다.
      </p>

      {(group || section) && (
        <button
          onClick={() => (section ? setSection(null) : setGroup(null))}
          className="mb-5 min-h-[44px] rounded-full bg-white px-5 font-black text-ink-700 shadow-soft"
        >
          ← {section ? group : '갈래'}
        </button>
      )}

      {!open && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {groups.map((g) => (
            <button
              key={g.label}
              onClick={() => setGroup(g.label)}
              className={`${CARD} min-h-[88px] px-4 py-5 text-left`}
            >
              <span className="block text-xl font-black text-ink-900 break-keep">{g.label}</span>
              <span className="mt-1 block text-ink-500">
                {g.sections.reduce((n, s) => n + s.items.length, 0)}장 · {g.sections.length}묶음
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !sheets && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {open.sections.map((s) => (
            <button
              key={s.label}
              onClick={() => setSection(s.label)}
              className={`${CARD} min-h-[64px] px-4 py-4 text-left`}
            >
              <span className="block text-lg font-black text-ink-900 break-keep">{s.label}</span>
              <span className="mt-1 block text-ink-500">{s.items.length}장</span>
            </button>
          ))}
        </div>
      )}

      {sheets && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 sm:gap-4">
          {sheets.items.map((it, i) => (
            <button key={it.key} onClick={() => setStart(i)} className={`${CARD} overflow-hidden`}>
              <img
                src={it.lineartUrl}
                alt={it.word}
                loading="lazy"
                className="block w-full aspect-square"
              />
              <span className="block py-2 text-lg font-black text-ink-900 break-keep">
                {it.word}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
