export type WordLearningStage = 'meet' | 'block' | 'write' | 'color';
export function wordLearningStages(unitId: string): WordLearningStage[] {
  return ['meet', ...(!unitId.startsWith('en-b1') ? ['block' as const] : []), 'write', 'color'];
}

export function wordLearningStage(value: string | null): WordLearningStage | undefined {
  return value && ['meet', 'block', 'write', 'color'].includes(value)
    ? (value as WordLearningStage)
    : undefined;
}
export interface WordLearningRun {
  version: 1;
  id: string;
  words: string[];
  index: number;
  stage: WordLearningStage;
  inputMode?: 'screen' | 'camera';
}

export function wordLearningStorageKey(lang: string, unitId: string) {
  let profile = 'guest';
  try {
    profile = localStorage.getItem('tangobook:activeProfileId') || 'guest';
  } catch {
    /* unavailable */
  }
  return `phonics-word-learning:v1:${profile}:${lang}:${unitId}`;
}

export function saveWordLearningRun(key: string, run: WordLearningRun) {
  try {
    localStorage.setItem(key, JSON.stringify(run));
  } catch {
    /* session still works in memory */
  }
}

export interface WordStageProgress {
  total: number;
  counts: Record<WordLearningStage, number>;
}

function stageProgressKey(lang: string, unitId: string) {
  return `${wordLearningStorageKey(lang, unitId)}:completed-stages`;
}

/** Display evidence only. This never marks the parent lesson or unlocks a chapter. */
export function recordWordStageCompleted(
  lang: string,
  unitId: string,
  word: string,
  stage: WordLearningStage
) {
  try {
    const key = stageProgressKey(lang, unitId);
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}');
    const entries = Array.isArray(saved?.[stage])
      ? saved[stage].filter((v: unknown) => typeof v === 'string')
      : [];
    localStorage.setItem(
      key,
      JSON.stringify({ ...saved, [stage]: [...new Set([...entries, word])] })
    );
  } catch {
    // The learning run still works when local storage is unavailable.
  }
}

/** Recover real earlier stages from the saved cursor, plus successful individual practice. */
export function readWordStageProgress(lang: string, unitId: string): WordStageProgress {
  const result: WordStageProgress = { total: 0, counts: { meet: 0, block: 0, write: 0, color: 0 } };
  try {
    const run = JSON.parse(localStorage.getItem(wordLearningStorageKey(lang, unitId)) ?? 'null');
    const stages = wordLearningStages(unitId);
    if (
      run?.version !== 1 ||
      !Array.isArray(run.words) ||
      !run.words.length ||
      !run.words.every((word: unknown) => typeof word === 'string' && word.length > 0) ||
      new Set(run.words).size !== run.words.length ||
      !Number.isInteger(run.index) ||
      run.index < 0 ||
      run.index > run.words.length ||
      !stages.includes(run.stage)
    )
      return result;
    result.total = run.words.length;
    let saved: Record<string, unknown> = {};
    try {
      saved = JSON.parse(localStorage.getItem(stageProgressKey(lang, unitId)) ?? '{}') ?? {};
    } catch {
      /* A corrupt practice ledger does not discard a valid sequential cursor. */
    }
    stages.forEach((stage, i) => {
      const before = run.index + (i < stages.indexOf(run.stage) ? 1 : 0);
      const words = new Set<string>(run.words.slice(0, Math.min(before, run.words.length)));
      if (Array.isArray(saved[stage])) {
        for (const word of saved[stage] as unknown[]) {
          if (typeof word === 'string' && run.words.includes(word)) words.add(word);
        }
      }
      result.counts[stage] = words.size;
    });
  } catch {
    /* No display progress is invented for a missing/corrupt run. */
  }
  return result;
}

/** One shuffled deck, no replacement. Every stage uses the very same current word. */
export function loadWordLearningRun(key: string, targets: readonly string[]): WordLearningRun {
  const words = [...new Set(targets.map((word) => word.trim()).filter(Boolean))];
  try {
    const run = JSON.parse(localStorage.getItem(key) ?? 'null') as WordLearningRun | null;
    if (
      run?.version === 1 &&
      typeof run.id === 'string' &&
      Array.isArray(run.words) &&
      run.words.length === words.length &&
      new Set(run.words).size === words.length &&
      run.words.every((word) => words.includes(word)) &&
      Number.isInteger(run.index) &&
      run.index >= 0 &&
      run.index < words.length &&
      ['meet', 'block', 'write', 'color'].includes(run.stage) &&
      (run.inputMode === undefined || run.inputMode === 'screen' || run.inputMode === 'camera')
    )
      return run;
  } catch {
    /* corrupt or unavailable storage never invents completed practice */
  }
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  const run: WordLearningRun = {
    version: 1,
    id: crypto.randomUUID(),
    words,
    index: 0,
    stage: 'meet',
  };
  saveWordLearningRun(key, run);
  return run;
}

export function advanceWordLearning(
  run: WordLearningRun,
  stages: readonly WordLearningStage[]
): WordLearningRun {
  const position = stages.indexOf(run.stage);
  if (position < 0) return run;
  const next = stages[position + 1];
  return next ? { ...run, stage: next } : { ...run, index: run.index + 1, stage: 'meet' };
}
