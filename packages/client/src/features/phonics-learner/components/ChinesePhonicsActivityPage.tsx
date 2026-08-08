import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getChineseActivityPlan,
  getChineseListenCards,
  getChineseToneChoiceCards,
  getChineseUnit,
  getChineseUnitCards,
  isBlendUnit,
  isToneUnit,
  type PinyinCard,
} from '../lib/chinese-phonics-units';
import type { ActivityDef, ReviewCard } from '../lib/korean-phonics-units';
import { markActivityCompleted } from '../lib/progress-store';
import { getChineseSyllableUrl } from '@/features/games/hooks/usePhonicsMap';
import { WordListenChooseActivity } from '../activities/WordListenChooseActivity';
import { VowelWriteActivity } from '../activities/VowelWriteActivity';
import { LetterHuntActivity } from '../activities/LetterHuntActivity';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';

/**
 * /library/phonics/chinese/:unitId/:activityKey — 병음 활동 호스트.
 *
 * 활동은 전부 기존 컴포넌트 재사용(새 컴포넌트 0):
 *  - `word-listen-choose` = 듣고 배우기 / 성조 듣고 고르기(성조 유닛)
 *  - `vowel-write` = 병음 따라쓰기(LetterFillCanvas 라틴)
 *  - `letter-hunt` = 글자 사냥(병음 모양 변별)
 *
 * 🔴 발음 = 원어민 녹음(`mod_chinese`) 직행. `getChineseSyllableUrl(sound)` 로 URL 을 미리 뽑아
 *    `ttsUrl` 로 넘긴다(word-listen·write). 글자 사냥은 컴포넌트가 `resolveTtsUrl(zh)` 로 직접 읽는다.
 * 🔴 안내·칭찬은 한국어(아이가 알아듣는 말) — 병음은 소리(카드)로만 등장한다.
 */
export default function ChinesePhonicsActivityPage() {
  const { unitId = '', activityKey = '' } = useParams<{ unitId: string; activityKey: string }>();
  const navigate = useNavigate();
  const unit = getChineseUnit(unitId);
  const plan = getChineseActivityPlan(unitId);
  const activity: ActivityDef | undefined = useMemo(
    () => plan.activities.find((a) => a.key === activityKey),
    [plan, activityKey]
  );

  /**
   * 이 활동이 쓰는 카드 — 활동 종류로 갈린다:
   *  - 성조 고르기 = 성조 부호 보기(`getChineseToneChoiceCards`)
   *  - 듣고 배우기 = 4성 카드(성조 유닛) / 낱 모음+4성 순서(`getChineseListenCards`)
   *  - 따라쓰기·글자 사냥 = 낱 모음 글자 하나(`getChineseUnitCards`)
   */
  const cards: PinyinCard[] = useMemo(() => {
    if (activityKey === 'tone-choose') return getChineseToneChoiceCards(unitId);
    if (activity?.kind === 'word-listen-choose') return getChineseListenCards(unitId);
    return getChineseUnitCards(unitId);
  }, [unitId, activityKey, activity?.kind]);

  // 진입 시 카드 발음을 전부 resolve(프리워밍) → sound→URL 맵. 4성 순서(`sounds`)까지 포함. resolve 전엔 로딩.
  // 🔴 글자 사냥은 여기서 안 데운다 — `resolveTtsUrl(zh)` 가 방해꾼까지 런타임에 읽는다.
  const needsPreresolve = activity?.kind !== 'letter-hunt';
  const soundsToResolve = useMemo(
    () => Array.from(new Set(cards.flatMap((c) => (c.sounds?.length ? c.sounds : [c.sound])))),
    [cards]
  );
  const [ttsBySound, setTtsBySound] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (!needsPreresolve) {
      setTtsBySound({});
      return;
    }
    let alive = true;
    setTtsBySound(null);
    void (async () => {
      const entries = await Promise.all(
        soundsToResolve.map(async (s) => [s, await getChineseSyllableUrl(s)] as const)
      );
      if (alive) {
        setTtsBySound(Object.fromEntries(entries.filter(([, url]) => url) as [string, string][]));
      }
    })();
    return () => {
      alive = false;
    };
  }, [soundsToResolve, needsPreresolve]);

  const backToUnit = useCallback(
    () => navigate(`/library/phonics/chinese/${unitId}`),
    [navigate, unitId]
  );

  // 활동 완료 → 학습 이벤트(부모 리포트 파닉스 진행). 한/영과 같은 형태(page_read + lang).
  const logEvent = useLogEvent();
  const handleMarkComplete = useCallback(() => {
    markActivityCompleted('chinese', unitId, activityKey);
    if (unitId) {
      logEvent({
        type: 'page_read',
        storybookId: unitId,
        metadata: { source: 'phonics', unitId, lang: 'zh' },
      });
    }
  }, [unitId, activityKey, logEvent]);

  if (!unit || !activity) {
    return (
      <div className="px-6 py-6 max-w-[800px] mx-auto">
        <p className="text-base font-bold text-ink-700">알 수 없는 활동입니다.</p>
        <Link
          to={`/library/phonics/chinese/${unitId}`}
          className="inline-block mt-3 text-coral-600 font-black underline"
        >
          ← 단원으로
        </Link>
      </div>
    );
  }

  // 글자 사냥 — 병음 낱 글자를 ReviewCard 로 (letter=보이는 글자, sound=성조 발음).
  if (activity.kind === 'letter-hunt') {
    const huntCards: ReviewCard[] = cards.map((c) => ({
      unitId,
      letter: c.label,
      syllable: c.label,
      sound: c.sound,
      matchPosition: 'cho',
    }));
    return (
      <LetterHuntActivity
        unitId={unitId}
        cards={huntCards}
        language="zh"
        onComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  if (!ttsBySound) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-peach-100 text-center">
        <div className="text-6xl">{activity.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{activity.title}</h2>
        <p className="text-base font-bold text-ink-500">불러오는 중…</p>
      </div>
    );
  }

  // 병음 따라쓰기 — 쓰는 글자는 낱 모음(label), 읽는 소리는 tone-1 녹음(ttsUrl).
  if (activity.kind === 'vowel-write') {
    return (
      <VowelWriteActivity
        unitId={unitId}
        language="zh"
        vowels={cards.map((c) => ({
          vowel: c.label,
          syllable: c.label,
          ttsUrl: ttsBySound[c.sound],
        }))}
        onComplete={handleMarkComplete}
        onBack={backToUnit}
      />
    );
  }

  // 듣고 배우기 / 성조 듣고 고르기 — 성조 유닛 4장(2×2) / 단운모 3장(한 줄).
  // 🔴 단운모 카드는 `sounds`(4성)를 순서로 재생 — 미리 resolve 한 URL 을 `soundUrls` 로 넘긴다.
  const items = cards.map((c) => {
    const seq = (c.sounds ?? []).map((s) => ttsBySound[s]).filter(Boolean);
    return {
      id: c.label,
      label: c.label,
      sound: c.sound,
      ...(ttsBySound[c.sound] ? { ttsUrl: ttsBySound[c.sound] } : {}),
      ...(seq.length > 1 ? { soundUrls: seq } : {}),
    };
  });
  // 성조·병음조합 = 2×2 격자(4장). 그 외(단운모·성모)는 장수로.
  const columns = isToneUnit(unitId) || isBlendUnit(unitId) ? 2 : Math.min(items.length, 3);
  return (
    <WordListenChooseActivity
      unitId={unitId}
      // 🔴 콘텐츠 소리 = 병음(`zh`) → warm·폴백이 라이브러리 직행(korean 이면 concat 400).
      //    안내·칭찬은 여전히 한국어 — 칭찬은 `en` 만 가르고 `zh` 는 `ko` 로 매핑된다.
      language="zh"
      items={items}
      choices={items.length}
      columns={columns}
      // 🔴 「배우기」(listen-choose)만 탐색 먼저 — 병음조합 배우기는 눌러 블렌드를 듣고, 성조/병음조합
      //    「고르기」(tone-choose·listen-quiz)는 되짚는 자리라 바로 퀴즈.
      exploreFirst={activityKey === 'listen-choose'}
      onMarkComplete={handleMarkComplete}
      onBack={backToUnit}
    />
  );
}
