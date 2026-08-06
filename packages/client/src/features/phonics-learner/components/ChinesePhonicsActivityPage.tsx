import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getChineseActivityPlan,
  getChineseUnit,
  getChineseUnitCards,
  isToneUnit,
} from '../lib/chinese-phonics-units';
import type { ActivityDef } from '../lib/korean-phonics-units';
import { markActivityCompleted } from '../lib/progress-store';
import { resolveChinesePinyinAudio } from '../lib/pinyin-audio';
import { WordListenChooseActivity } from '../activities/WordListenChooseActivity';
import { useLogEvent } from '@/features/learning/hooks/useLogEvent';

/**
 * /library/phonics/chinese/:unitId/:activityKey — 병음 활동 호스트.
 *
 * L1 은 유닛마다 「듣고 고르기」 하나뿐 → `WordListenChooseActivity` 재사용(글자만 보기, 그림 없음).
 * 🔴 발음은 진입 시 **한 번에 resolve**(= 프리워밍) — `resolveChinesePinyinAudio` 가 zh 런타임 TTS
 *    (`/api/tts/vocab-unit`, Google cmn-CN + R2 캐시)로 대표 한자를 읽어 URL 을 준다. 각 카드가
 *    `ttsUrl` 로 그 URL 을 들고 있어 탭 시 왕복 0(첫 마운트에서만 생성). 안내·칭찬은 한국어(`language`).
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
  const cards = useMemo(() => getChineseUnitCards(unitId), [unitId]);

  // 진입 시 카드 발음을 전부 resolve(프리워밍) → ttsUrl 로 넘긴다. resolve 전엔 로딩.
  const [items, setItems] = useState<
    { id: string; label: string; sound: string; ttsUrl?: string }[] | null
  >(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const resolved = await Promise.all(
        cards.map(async (c) => {
          const ttsUrl = await resolveChinesePinyinAudio(c.pinyin);
          return { id: c.pinyin, label: c.label, sound: c.label, ...(ttsUrl ? { ttsUrl } : {}) };
        })
      );
      if (alive) setItems(resolved);
    })();
    return () => {
      alive = false;
    };
  }, [cards]);

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

  if (!items) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-cream-50 to-peach-100 text-center">
        <div className="text-6xl">{activity.emoji}</div>
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900">{activity.title}</h2>
        <p className="text-base font-bold text-ink-500">불러오는 중…</p>
      </div>
    );
  }

  // 성조 유닛 = 4장(2×2) / 단운모 = 3장(한 줄). 보기 수 = 카드 수(마지막 카드가 빠지지 않게).
  const columns = isToneUnit(unitId) ? 2 : Math.min(items.length, 3);
  return (
    <WordListenChooseActivity
      unitId={unitId}
      // 🔴 안내·칭찬은 한국어(아이가 알아듣는 말) — `language` 는 그 용도. 병음 발음은 카드 `ttsUrl` 이 든다.
      language="korean"
      items={items}
      choices={items.length}
      columns={columns}
      exploreFirst
      onMarkComplete={handleMarkComplete}
      onBack={backToUnit}
    />
  );
}
