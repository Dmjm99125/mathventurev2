import { GAME_CATALOG } from "./game-catalog.ts";

type ResultLike = {
  gameId: string;
  score: number;
  maxScore: number;
};

type TimedResultLike = {
  completedAt: string;
  score: number;
  maxScore: number;
};

function toPct(score: number, maxScore: number): number {
  return Math.round((score / maxScore) * 100);
}

export function isPassingPct(score: number, maxScore: number, passThreshold = 0.75): boolean {
  return maxScore > 0 && score / maxScore >= passThreshold;
}

export function calculateDetailedCompletionPct(
  input: ResultLike[],
  totalGameCount = GAME_CATALOG.length,
): number | null {
  if (!input.length || totalGameCount <= 0) return null;

  const passedIds = new Set(
    input.filter((result) => isPassingPct(result.score, result.maxScore)).map((result) => result.gameId),
  );

  return Math.round((passedIds.size / totalGameCount) * 100);
}

export function calculateDetailedLastPlayedPct(input: TimedResultLike[]): number | null {
  if (!input.length) return null;

  const latest = [...input].sort((left, right) => left.completedAt.localeCompare(right.completedAt)).at(-1);

  if (!latest || latest.maxScore <= 0) return null;

  return toPct(latest.score, latest.maxScore);
}
