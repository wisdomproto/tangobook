import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { warmAudioUrl } from '@/features/games/hooks/useGamePrefetch';
import { ActivityShell } from '../components/ActivityShell';
import { useActivitySound } from '../hooks/useActivitySound';
import { useEntryGuide, ENTRY_GUIDE } from '../hooks/useEntryGuide';
import { toneNumberOf, type CombineGroup } from '../lib/chinese-phonics-units';

interface Props {
  unitId: string;
  /** 이 단원의 성모 묶음 — 성모 하나가 모음 줄들을 안는다(`getCombineGroups`). */
  groups: ReadonlyArray<CombineGroup>;
  /** 음절 → 원어민 녹음 URL(`mod_chinese` 직행). 호스트가 진입 전에 전부 resolve 해 넘긴다. */
  ttsBySound: Record<string, string>;
  onMarkComplete: () => void;
  onBack: () => void;
}

/**
 * 🔊 병음조합(拼读) 배우기 — **성모를 고르면 그 성모의 4성 줄들**이 화면에 깔린다.
 *
 * 🔴 왜 새 컴포넌트인가(2026-08-10 사용자 "블렌딩 어디갔어?"): 예전엔 `WordListenChooseActivity` 에
 *    **성모 글자 카드**(b p m f)만 깔고 4성 음절은 소리로만 났다 — 화면에 병음조합이 하나도 안 보였다.
 *    격자 컴포넌트로는 못 고친다: 줄마다 성조 수가 다르고(pā pá pà = 3 · né nè = 2) 고정 열 격자에
 *    쏟으면 성조 묶음이 줄을 넘어 쪼개진다. 그래서 **줄(모음)** 을 그리는 화면이 필요하다.
 * 🔴 2단은 **탭 + 줄**이지 별도 선택 화면이 아니다 — 성모를 고르는 단계를 살리되(72줄을 한 화면에 못 깐다),
 *    들어오자마자 첫 성모의 음절이 보여야 "블렌딩이 보인다"는 요구가 충족된다.
 * 🔴 소리는 **라이브러리 mp3 직행**(`ttsBySound` 의 directUrl) — concat 왕복 0. 진입 시 그 URL 들을
 *    순서대로 데운다(텍스트 warm 은 concat 경로라 이 화면 재생과 캐시가 안 맞는다).
 *
 * 한 성모의 음절을 다 누르면 띵동 → 다음 성모로, 전부 누르면 칭찬 → 완료(그 뒤엔 자유놀이).
 */
export function PinyinToneRowsActivity({
  unitId,
  groups,
  ttsBySound,
  onMarkComplete,
  onBack,
}: Props) {
  const { t } = useTranslation('phonics');
  const { say, rest, chime, playCorrectSequence, praiseVisible, playAudio } = useActivitySound({
    unitId,
    language: 'zh',
    prefix: 'zh-combine',
  });
  // 진입 안내 — 화면의 "눌러서 들어봐!" 에 맞는 음성(탐색형 화면 공용 자산).
  useEntryGuide(ENTRY_GUIDE.listenExplore, playAudio);

  const [tabIdx, setTabIdx] = useState(0);
  /** 눌러 들어본 음절 — 음절 문자열이 유일 키다(성모·모음이 달라도 안 겹친다). */
  const [pressed, setPressed] = useState<ReadonlySet<string>>(() => new Set());
  /**
   * 🔴 누른 칸은 **ref 로 센다** — state 스냅샷으로 새 Set 을 만들면 한 프레임 안에 두 칸을 누를 때
   *    (아이가 톡톡 두 번) 두 핸들러가 같은 옛 `pressed` 를 읽어 **하나가 사라진다**(실측: 3연타 → 1개만
   *    기록). 그러면 그 성모가 영영 완료되지 않아 다음 탭으로 안 넘어간다. 「글자 사냥」이 같은 함정을
   *    이미 ref 로 풀었다(모듈 CLAUDE.md).
   */
  const pressedRef = useRef<Set<string>>(new Set());
  const doneRef = useRef(false);

  const group = groups[Math.min(tabIdx, groups.length - 1)];

  /**
   * 🔴 재생 URL 을 그대로 데운다 — `usePhonicsTtsWarm` 은 텍스트를 concat 경로로 resolve 하므로
   *    이 화면이 실제로 트는 라이브러리 mp3 와 캐시 키가 다르다(데워도 첫 탭이 늦다).
   *    순서 = 표 순서(먼저 누를 것이 먼저 준비된다). 병렬로 쏘면 첫 음절이 250여 건 뒤에 줄을 선다.
   */
  const warmKey = useMemo(
    () =>
      groups
        .flatMap((g) => g.syllables)
        .map((s) => ttsBySound[s])
        .filter(Boolean)
        .join('|'),
    [groups, ttsBySound]
  );
  useEffect(() => {
    if (!warmKey) return;
    let alive = true;
    void (async () => {
      for (const url of warmKey.split('|')) {
        if (!alive) return;
        try {
          await warmAudioUrl(url);
        } catch {
          /* 한 건 실패가 나머지를 막지 않는다 */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [warmKey]);

  const groupDone = useCallback(
    (g: CombineGroup, set: ReadonlySet<string>) => g.syllables.every((s) => set.has(s)),
    []
  );

  const handleTap = useCallback(
    (syl: string) => {
      const url = ttsBySound[syl];
      if (pressedRef.current.has(syl)) {
        // 이미 들어본 음절 — 자유놀이(다시 듣기만, 완료가 다시 발동하지 않는다).
        void say(syl, undefined, url);
        return;
      }
      // 🔴 ref 를 먼저 갱신한다 — 같은 프레임의 두 번째 탭도 이 Set 을 보고 자기 칸을 더한다.
      pressedRef.current.add(syl);
      const next = new Set(pressedRef.current);
      setPressed(next);

      const finishedGroup = groupDone(group, next);
      const finishedAll = groups.every((g) => groupDone(g, next));
      // 🔴 소리 → 쉼 → (띵동|칭찬) 순서. `onEnded` 체인이라 음절 길이를 가정하지 않는다.
      // 🔴 3번째 인자(directUrl)를 빠뜨리면 라이브러리 mp3 를 두고 concat 을 탄다(왕복 + 없으면 무음).
      void say(
        syl,
        () => {
          if (finishedAll && !doneRef.current) {
            doneRef.current = true;
            rest(() => playCorrectSequence({ language: 'ko', onDone: onMarkComplete }));
            return;
          }
          if (finishedGroup) {
            // 다음 성모로 — 남은 것 중 앞에서부터(건너뛰며 골랐을 수 있다).
            const nextIdx = groups.findIndex((g) => !groupDone(g, next));
            rest(() => chime(() => nextIdx >= 0 && setTabIdx(nextIdx)));
          }
        },
        url
      );
    },
    // 🔴 `pressed`(state)는 deps 에 없다 — 판정은 `pressedRef` 로 한다(연타 유실 방지).
    [ttsBySound, group, groups, groupDone, say, rest, chime, playCorrectSequence, onMarkComplete]
  );

  if (!group) return null;

  /**
   * 🔴 칸 크기는 **줄 수로 나눈다** — 성모마다 모음 줄이 2~5개다(f 는 2줄, n·l 은 5줄). 고정값을 두면
   *    5줄 성모에서 아래 줄이 화면 밖으로 나간다(전체화면 활동의 `min(vw, vh)` 규칙과 같은 취지).
   */
  const rowCount = group.rows.length;
  /**
   * 🔴 칸은 **4열 고정**(성조 1~4) + 왼쪽 라벨 1칸이라 가로 예산은 `100/5.2 ≒ 19vw` 가 상한이다.
   *    세로는 줄 수로 나눈다(f=2줄 · n·l=5줄). `28/rowCount` 는 탭 줄·안내 문구 chrome 을 뺀 몫 —
   *    예전 `40/rowCount` 는 chrome 을 안 빼서 812×375 가로모드에서 마지막 줄이 화면 밖으로 나갔다.
   */
  const cell = `min(17vw, ${(46 / rowCount).toFixed(1)}vh)`;
  /**
   * 🔴 글자는 **칸 폭 × 최장 음절 길이**에서 파생한다 — 3글자 음절(zhā·chī)이 칸을 8~9px 넘던 것과,
   *    2줄 성모(154px 칸에 46px 글자)와 5줄(61px 칸에 30px)의 편차를 같은 규칙으로 없앤다.
   *    0.62 = 굵은 병음 글립 폭 여유(성조부호 포함).
   */
  /**
   * 🔴 글자 크기는 **그 칸 음절의 길이**로 — 성모 그룹 최장(`maxLen`)으로 잡으면 `nǚ`(3) 때문에 2글자
   *    칸(`nú`)까지 작아지고, 반대로 두면 3글자가 칸을 넘는다(실측: 43px 칸에 34.7px → 전 칸 넘침).
   *    0.78 = 굵은 병음 글립 폭 + 테두리(5px×2)·패딩 여유(1024×768 실측).
   */
  const fontFor = (syl: string) => `calc(${cell} / ${(Math.max(2, syl.length) * 1.05).toFixed(2)})`;

  const dots = (
    <div className="flex items-center gap-1.5">
      {groups.map((g, i) => (
        <span
          key={g.c}
          className={`w-3 h-3 rounded-full ${
            groupDone(g, pressed)
              ? 'bg-mint-400'
              : i === tabIdx
                ? 'bg-coral-400 ring-2 ring-coral-200'
                : 'bg-white/70 ring-2 ring-white'
          }`}
        />
      ))}
    </div>
  );

  return (
    <ActivityShell onBack={onBack} headerRight={dots}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 sm:gap-5">
        {/* 성모 탭 — 고르는 단계를 살리되 화면을 나누지 않는다(고른 성모의 줄이 바로 아래). */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {groups.map((g, i) => {
            const done = groupDone(g, pressed);
            const active = i === tabIdx;
            return (
              <button
                key={g.c}
                onClick={() => setTabIdx(i)}
                aria-pressed={active}
                className={[
                  'relative rounded-2xl border-[4px] px-4 sm:px-6 py-1.5 sm:py-2 font-black shadow-soft transition',
                  'text-2xl sm:text-4xl',
                  active
                    ? 'bg-coral-500 border-coral-600 text-white scale-105'
                    : done
                      ? 'bg-mint-100 border-mint-400 text-mint-600'
                      : 'bg-white border-white text-ink-500 hover:shadow-pop active:scale-[0.97]',
                ].join(' ')}
              >
                {g.c}
                {done && !active && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-mint-500 text-white text-xs font-black shadow-pop ring-2 ring-white">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-lg sm:text-2xl font-black text-ink-700">{t('common.tapToListen')}</p>

        {/* 줄 = 성모 + 모음, 칸 = **성조 1~4 고정 열**. `[b][a] → bā bá bǎ bà`
            🔴 없는 성조(pǎ·mū)는 **빈 칸으로 남긴다** — 가운데 정렬이면 3성 없는 줄에서 4성이 3성 자리에
               앉아, 이 레벨이 새로 가르치는 **성조 축이 눈으로 안 읽힌다**(실측: nè 가 nǎ 열 아래). */}
        <div className="flex flex-col gap-2 sm:gap-3">
          {group.rows.map((row) => {
            const byTone = new Map(row.syl.map((s) => [toneNumberOf(s), s]));
            return (
              <div key={row.v} className="flex items-center justify-center gap-2 sm:gap-3">
                <span
                  className="font-black text-coral-600 tabular-nums shrink-0 text-right"
                  style={{ fontSize: fontFor('aa'), minWidth: `calc(${cell} * 0.7)` }}
                >
                  {group.c}
                  <span className="text-ink-400">+</span>
                  {row.v}
                </span>
                {[1, 2, 3, 4].map((n) => {
                  const syl = byTone.get(n);
                  if (!syl)
                    return <span key={n} aria-hidden style={{ width: cell, height: cell }} />;
                  return (
                    <motion.button
                      key={n}
                      onClick={() => handleTap(syl)}
                      whileTap={{ scale: 0.94 }}
                      aria-label={syl}
                      className={[
                        'relative rounded-2xl border-[5px] font-black shadow-soft transition flex items-center justify-center px-1 leading-none overflow-hidden',
                        pressed.has(syl)
                          ? 'bg-mint-100 border-mint-500 text-mint-600'
                          : 'bg-white border-white text-ink-800 hover:shadow-pop',
                      ].join(' ')}
                      style={{ width: cell, height: cell, fontSize: fontFor(syl) }}
                    >
                      {syl}
                      {pressed.has(syl) && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-mint-500 text-white text-xs font-black shadow-pop ring-2 ring-white">
                          ✓
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
