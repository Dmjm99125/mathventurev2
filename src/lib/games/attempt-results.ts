import { getGameCatalogEntry } from "./catalog.ts";

export type AttemptGameResultInput = {
  topicId: string;
  gameId: string;
  gameOrder: number;
  score: number;
  maxScore: number;
  completedAt?: string;
};

export function buildAttemptGameResult(
  topicId: string,
  gameOrder: number,
  score: number,
  maxScore: number,
): AttemptGameResultInput {
  const entry = getGameCatalogEntry(topicId, gameOrder);
  if (!entry) {
    throw new Error(`Unknown game catalog entry for ${topicId}:${gameOrder}`);
  }

  return {
    topicId: entry.topicId,
    gameId: entry.gameId,
    gameOrder: entry.gameOrder,
    score,
    maxScore,
  };
}

export function appendAttemptGameResult(
  current: AttemptGameResultInput[],
  next: AttemptGameResultInput,
): AttemptGameResultInput[] {
  return [...current.filter((row) => row.gameId !== next.gameId), next];
}
