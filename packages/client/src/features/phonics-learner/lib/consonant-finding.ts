import { getAllKoreanUnits } from './korean-phonics-units';

/** Vowel lessons introduce silent ㅇ; later consonant chapters add only their taught letters. */
export function learnedFindingConsonants(unitId: string): string[] {
  const learned = new Set<string>(['ㅇ']);
  for (const unit of getAllKoreanUnits()) {
    if (!unit.isReview && ['hangul1', 'hangul3'].includes(unit.levelKey))
      for (const letter of unit.phonemes) if (/^[ㄱ-ㅎ]$/.test(letter)) learned.add(letter);
    if (unit.id === unitId) return [...learned];
  }
  return [];
}

export function consonantFindingBoard(unitId: string, target: string, rand = Math.random) {
  const allowed = learnedFindingConsonants(unitId);
  if (!allowed.includes(target)) return [];
  const others = allowed.filter((letter) => letter !== target);
  const board = Array<string>(4).fill(target);
  if (others.length)
    for (let i = 0; i < 8; i++) board.push(others[Math.floor(rand() * others.length)]);
  for (let i = board.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [board[i], board[j]] = [board[j], board[i]];
  }
  return board;
}
