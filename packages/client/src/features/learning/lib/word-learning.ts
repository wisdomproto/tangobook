import { KOREAN_PHONICS_CURRICULUM, ENGLISH_PHONICS_CURRICULUM } from '@tangobook/shared';
import type { Lang, LearningEvent, LearningEventMetadata } from '@tangobook/shared';

type Skill = NonNullable<LearningEventMetadata['skill']> | 'legacy';
export interface WordLearning {
  key: string;
  word: string;
  lang: Lang;
  exposures: number;
  practices: number;
  firstAt: string;
  lastAt: string;
  days: Set<string>;
  events: LearningEvent[];
  skills: Partial<Record<Skill, { attempts: number; correct: number; wrong: number }>>;
  phonicsPractices: number;
}

export function normalizeWord(word: string, lang: Lang): string {
  const normalized = word.trim().normalize('NFC');
  return lang === 'en' ? normalized.toLowerCase() : normalized;
}

/** Preserve explicit language; only infer unambiguous legacy Korean/Latin labels. */
export function eventLanguage(event: LearningEvent): Lang | null {
  if (event.metadata?.lang) return event.metadata.lang;
  if (event.word && /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(event.word)) return 'ko';
  if (event.word && /^[a-zA-Z\s'-]+$/.test(event.word) && !event.metadata?.korean) return 'en';
  return null;
}

export function localDateKey(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Historical results do not acquire first-attempt evidence retrospectively. */
export function resultSkill(event: LearningEvent): Skill {
  return event.metadata?.skill ?? 'legacy';
}

export function summarizeWords(events: LearningEvent[], lang: Lang): WordLearning[] {
  const words = new Map<string, WordLearning>();
  const seen = new Set<string>();
  for (const event of events) {
    if (event.id && seen.has(event.id)) continue;
    if (event.id) seen.add(event.id);
    if (
      !event.word ||
      eventLanguage(event) !== lang ||
      !Number.isFinite(Date.parse(event.created_at))
    )
      continue;
    const exposure = event.event_type === 'word_exposed';
    const practice = event.event_type === 'word_correct' || event.event_type === 'word_wrong';
    const spoken = event.event_type === 'word_spoken';
    if (!exposure && !practice && !spoken) continue;
    const key = normalizeWord(event.word, lang);
    if (!key) continue;
    const word = words.get(key) ?? {
      key,
      word: event.word.trim(),
      lang,
      exposures: 0,
      practices: 0,
      firstAt: event.created_at,
      lastAt: event.created_at,
      days: new Set<string>(),
      events: [],
      skills: {},
      phonicsPractices: 0,
    };
    if (exposure) word.exposures++;
    if (practice) {
      word.practices++;
      const skill = resultSkill(event);
      const score = word.skills[skill] ?? { attempts: 0, correct: 0, wrong: 0 };
      score.attempts++;
      if (event.event_type === 'word_correct') score.correct++;
      else score.wrong++;
      word.skills[skill] = score;
      if (event.metadata?.source === 'phonics') word.phonicsPractices++;
    }
    if (Date.parse(event.created_at) < Date.parse(word.firstAt)) word.firstAt = event.created_at;
    if (Date.parse(event.created_at) > Date.parse(word.lastAt)) word.lastAt = event.created_at;
    word.days.add(localDateKey(event.created_at));
    word.events.push(event);
    words.set(key, word);
  }
  return [...words.values()].sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt));
}

export interface PhonicsTarget {
  id: string;
  title: string;
  lang: 'ko' | 'en';
}
export function phonicsTargets(word: string, lang: Lang): PhonicsTarget[] {
  if (lang !== 'ko' && lang !== 'en') return [];
  const curriculum = lang === 'ko' ? KOREAN_PHONICS_CURRICULUM : ENGLISH_PHONICS_CURRICULUM;
  const key = normalizeWord(word, lang);
  return curriculum.flatMap((level) =>
    level.units
      .filter((unit) => unit.sampleWords.some((sample) => normalizeWord(sample, lang) === key))
      .map((unit) => ({ id: unit.id, title: unit.title, lang }))
  );
}

/** Today and the previous six local calendar days, without a UTC/KST fixed boundary. */
export function periodStart(period: 'today' | 'week', now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'week') start.setDate(start.getDate() - 6);
  return start;
}
