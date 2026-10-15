import type { ActivityPlan } from './korean-phonics-units';

export const WORD_LEARNING_KEY = 'word-learning';
const cache = new WeakMap<ActivityPlan, ActivityPlan>();

/** One connected lesson; legacy individual routes remain available, without duplicate menu entries. */
export function withConnectedWordLearning(plan: ActivityPlan): ActivityPlan {
  if (!plan.activities.some((a) => a.kind === 'game-word-writing')) return plan;
  const cached = cache.get(plan);
  if (cached) return cached;
  const learn = plan.activities.filter((a) => a.section === 'learn');
  const play = plan.activities.filter((a) => a.section === 'play');
  const connected: ActivityPlan = {
    ...plan,
    activities: [
      ...learn,
      {
        key: WORD_LEARNING_KEY,
        kind: 'word-learning' as const,
        section: 'learn' as const,
        title: '낱말 배우기',
        titleKey: 'wordJourney.title',
        emoji: '📖',
        // Existing required keys keep their historical meaning. The guided path includes this lesson.
        required: false,
        order: 0,
      },
      ...play.map((a) =>
        a.kind === 'game-connect-dots' ? { ...a, section: 'learn' as const } : a
      ),
    ].map((a, order) => ({ ...a, order: order + 1 })),
  };
  cache.set(plan, connected);
  return connected;
}
