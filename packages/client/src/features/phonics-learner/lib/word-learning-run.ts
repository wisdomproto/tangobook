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
