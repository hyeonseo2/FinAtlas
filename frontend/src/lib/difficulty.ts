export function toDisplayDifficulty(rawScore: number): number {
  const n = Number.isFinite(rawScore) ? Math.round(Number(rawScore)) : 0;
  return Math.max(0, 100 - n);
}

export function toDisplayDifficultyInput(displayScore: number): number {
  const n = Number.isFinite(displayScore) ? Math.round(Number(displayScore)) : 100;
  return Math.max(0, Math.min(100, n));
}

export function toRawDifficulty(displayScore: number): number {
  return Math.max(0, 100 - toDisplayDifficultyInput(displayScore));
}

export function difficultyLabel(level: number): string {
  if (level <= 20) return "매우 쉬움";
  if (level <= 40) return "쉬움";
  if (level <= 60) return "보통";
  if (level <= 80) return "어려움";
  return "매우 어려움";
}
