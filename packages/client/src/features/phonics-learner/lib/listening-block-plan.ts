import type { ActivityPlan } from './korean-phonics-units';
const cache = new WeakMap<ActivityPlan, ActivityPlan>();
/** Only chapters which already offer blocks gain an optional listening practice; keys stay stable. */
export function withListeningBlockPractice(plan: ActivityPlan): ActivityPlan {
  const cached = cache.get(plan);
  if (cached) return cached;
  const block = plan.activities.find(
    (a) => a.kind === 'game-korean-block' || a.kind === 'game-english-block'
  );
  if (!block) return plan;
  const expanded: ActivityPlan = {
    activities: [
      ...plan.activities,
      {
        ...block,
        key: `${block.key}-listen`,
        order: Math.max(...plan.activities.map((a) => a.order)) + 1,
        section: 'play',
        title: '듣고 블록 놀이',
        titleKey: 'activity.listenBlockPlay',
        listeningPractice: true,
        required: false,
      },
    ],
  };
  cache.set(plan, expanded);
  return expanded;
}
