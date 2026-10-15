import { useState } from 'react';
import type { Storybook, StoryMusicSet } from '@tangobook/shared';
import type { BgmItem } from '../api/settings.api';
import { storyMusicGenre } from '@/features/viewer/lib/story-music';

const source = 'https://assets.tangobook.co.kr/background-music/three-pigs-20261015/';
export const pigMusic = [
  {
    id: 'pig-opening',
    startPage: 1,
    role: '시작',
    title: '아기 돼지 · 집을 지어요',
    url: source + 'opening.mp3',
  },
  {
    id: 'pig-tension',
    startPage: 6,
    role: '위기',
    title: '아기 돼지 · 늑대가 와요',
    url: source + 'tension.mp3',
  },
  {
    id: 'pig-climax',
    startPage: 12,
    role: '클라이맥스',
    title: '아기 돼지 · 튼튼한 벽돌집',
    url: source + 'climax.mp3',
  },
  {
    id: 'pig-resolution',
    startPage: 15,
    role: '해소',
    title: '아기 돼지 · 함께 살아요',
    url: source + 'resolution.mp3',
  },
];

export function StoryMusicCues({
  book,
  library,
  onChange,
}: {
  book: Storybook;
  library: BgmItem[];
  onChange: (patch: Pick<Storybook, 'backgroundMusicCues' | 'backgroundMusicSets'>) => void;
}) {
  const [editingSetId, setEditingSetId] = useState<string>();
  const sets = book.backgroundMusicSets ?? [];
  const editingSet = sets.find((s) => s.id === editingSetId) ?? sets[0];
  const cues = editingSet?.cues ?? book.backgroundMusicCues ?? [];
  const changeCues = (next: Storybook['backgroundMusicCues']) => {
    if (editingSet)
      onChange({
        backgroundMusicSets: sets.map((s) =>
          s.id === editingSet.id ? { ...s, cues: next ?? [] } : s
        ),
      });
    else onChange({ backgroundMusicCues: next });
  };
  const addSet = () => {
    if (book.pages.length < 3 || !unique.length) return;
    const boundaries = [1, Math.max(2, Math.ceil(book.pages.length * 0.4)), book.pages.length];
    const isPig = book.title.replace(/\s/g, '').includes('아기돼지삼형제');
    const chosen = isPig
      ? [pigMusic[0], pigMusic[2], pigMusic[3]]
      : [unique[0], unique[0], unique[0]];
    const set: StoryMusicSet = {
      id: crypto.randomUUID(),
      title: `음악 세트 ${sets.length + 1}`,
      genre: storyMusicGenre(book.category),
      cues: chosen.map((c, i) => ({
        id: crypto.randomUUID(),
        startPage: boundaries[i],
        url: c.url,
        title: c.title,
        role: ['도입', '클라이맥스', '마지막'][i],
      })),
    };
    onChange({ backgroundMusicSets: [...sets, set] });
    setEditingSetId(set.id);
  };
  const choices: Pick<BgmItem, 'id' | 'title' | 'url'>[] = [...library, ...pigMusic];
  if (book.backgroundMusicUrl)
    choices.push({
      id: 'book-default',
      title: '이 책의 기존 배경음악',
      url: book.backgroundMusicUrl,
    });
  for (const c of cues)
    if (!choices.some((x) => x.url === c.url))
      choices.push({ id: c.id, title: c.title || '지정한 음악', url: c.url });
  const unique = choices.filter((c, i) => choices.findIndex((x) => x.url === c.url) === i);
  const field =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
  const update = (index: number, patch: Partial<(typeof cues)[number]>) =>
    changeCues(cues.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-slate-100">장면별 배경음악</h4>
      <p className="text-sm text-slate-500">
        3곡 세트를 책을 열 때 한 번 뽑습니다. 읽는 동안 세트는 유지하며, 전래동화와 명작 세트는
        구분합니다.
      </p>
      <div className="flex flex-wrap gap-2">
        {sets.map((s) => (
          <button
            key={s.id}
            type="button"
            className={field}
            aria-pressed={s.id === editingSet?.id}
            onClick={() => setEditingSetId(s.id)}
          >
            {s.title}
          </button>
        ))}
        <button
          type="button"
          className={field}
          disabled={book.pages.length < 3 || !unique.length}
          onClick={addSet}
        >
          3곡 세트 추가
        </button>
        {editingSet && (
          <button
            type="button"
            className={field}
            onClick={() =>
              onChange({ backgroundMusicSets: sets.filter((s) => s.id !== editingSet.id) })
            }
          >
            이 세트 삭제
          </button>
        )}
      </div>
      {editingSet && (
        <p className="text-xs text-slate-500">
          선택한 세트: {editingSet.title} · {editingSet.genre === 'folktale' ? '전래동화' : '명작'}{' '}
          · 정확히 3구간일 때 랜덤 후보로 사용합니다.
        </p>
      )}
      <p className="text-sm text-slate-500">
        같은 구간에서는 계속 재생하고, 다음 구간에서 약 1.8초 동안 부드럽게 바뀝니다. 아래 쪽수부터
        다음 구간 전까지 적용됩니다.
      </p>
      {cues.map((cue, i) => (
        <div key={cue.id} className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-600 dark:text-slate-300">
            시작 쪽{' '}
            <input
              aria-label={`음악 구간 ${i + 1} 시작 쪽`}
              className={`${field} w-20`}
              type="number"
              min={1}
              max={Math.max(1, book.pages.length)}
              value={cue.startPage}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (
                  Number.isInteger(n) &&
                  n >= 1 &&
                  n <= book.pages.length &&
                  !cues.some((c, j) => j !== i && c.startPage === n)
                )
                  update(i, { startPage: n });
              }}
            />
          </label>
          <select
            aria-label={`음악 구간 ${i + 1} 곡`}
            className={`${field} min-w-0 flex-1`}
            value={cue.url}
            onChange={(e) => {
              const selected = unique.find((c) => c.url === e.target.value);
              update(i, { url: e.target.value, title: selected?.title });
            }}
          >
            {unique.map((c) => (
              <option key={c.url} value={c.url}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="px-2 py-2 text-sm text-red-500"
            aria-label={`음악 구간 ${i + 1} 삭제`}
            onClick={() => changeCues(cues.filter((_, j) => j !== i))}
          >
            구간 삭제
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={field}
          onClick={() => {
            const startPage = Array.from({ length: book.pages.length }, (_, i) => i + 1).find(
              (n) => !cues.some((c) => c.startPage === n)
            );
            const music = unique[0];
            if (startPage && music)
              changeCues([
                ...cues,
                { id: crypto.randomUUID(), startPage, url: music.url, title: music.title },
              ]);
          }}
          disabled={cues.length >= book.pages.length}
        >
          음악 구간 추가
        </button>
        {book.title.replace(/\s/g, '').includes('아기돼지삼형제') && (
          <button type="button" className={field} onClick={addSet}>
            아기 돼지 3곡 세트 추가
          </button>
        )}
        {!!cues.length && (
          <button
            type="button"
            className={field}
            onClick={() =>
              onChange({ backgroundMusicCues: undefined, backgroundMusicSets: undefined })
            }
          >
            기존 한 곡으로 돌아가기
          </button>
        )}
      </div>
      {!cues.length && (
        <p className="text-xs text-slate-500">
          구간을 지정하지 않으면 기존 배경음악 한 곡을 사용합니다.
        </p>
      )}
    </div>
  );
}
