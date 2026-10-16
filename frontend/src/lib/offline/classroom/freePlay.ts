import type { OfflineRepository } from './repository.ts';

export type FreePlayScore = {
  gameId: string;
  score: number;
  maxScore: number;
  completedAt?: string;
};

function makeId(idFactory?: () => string): string {
  return idFactory?.() ?? crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

export async function recordFreePlayStart(
  repository: OfflineRepository,
  actorId: string,
  gameId: string,
  idFactory?: () => string,
) {
  const sessionId = makeId(idFactory);
  const startedAt = now();
  await repository.applyMutation({
    actorId,
    type: 'freePlay.start',
    entityId: sessionId,
    payload: { id: sessionId, profile_id: actorId, game_id: gameId, started_at: startedAt },
    dependencies: [],
  });
  return { sessionId, startedAt, syncState: 'pending' as const };
}

export async function recordFreePlayCheckpoint(
  repository: OfflineRepository,
  actorId: string,
  input: FreePlayScore & { sessionId: string },
) {
  await repository.applyMutation({
    actorId,
    type: 'freePlay.checkpoint',
    entityId: input.sessionId,
    payload: { ...input, profile_id: actorId, game_id: input.gameId },
    dependencies: (await repository.getOutbox())
      .filter((operation) => operation.entityId === input.sessionId)
      .map((operation) => operation.operationId),
  });
  return { sessionId: input.sessionId, syncState: 'pending' as const };
}

export async function recordFreePlayCompletion(
  repository: OfflineRepository,
  actorId: string,
  input: FreePlayScore & { sessionId?: string },
  idFactory?: () => string,
) {
  const existing = (await repository.readCollection('freePlayProgress')).find((row) => {
    return (row.profile_id ?? row.profileId) === actorId && (row.game_id ?? row.gameId) === input.gameId;
  });
  const sessionId = input.sessionId ?? makeId(idFactory);
  const completedAt = input.completedAt ?? now();
  const progressId = typeof existing?.id === 'string' ? existing.id : makeId(idFactory);
  const bestScore = Math.max(Number(existing?.best_score ?? existing?.bestScore ?? 0), input.score);
  const bestMaxScore = Math.max(Number(existing?.best_max_score ?? existing?.bestMaxScore ?? 0), input.maxScore);
  const playCount = Number(existing?.play_count ?? existing?.playCount ?? 0) + 1;
  const dependencies = (await repository.getOutbox())
    .filter((operation) => operation.entityId === sessionId)
    .map((operation) => operation.operationId);

  if (!input.sessionId && dependencies.length === 0) {
    await repository.applyMutation({
      actorId,
      type: 'freePlay.start',
      entityId: sessionId,
      payload: { id: sessionId, profile_id: actorId, game_id: input.gameId, started_at: completedAt },
      dependencies: [],
    });
  }
  await repository.applyMutation({
    actorId,
    type: 'freePlay.complete',
    entityId: progressId,
    payload: {
      id: progressId,
      profile_id: actorId,
      game_id: input.gameId,
      sessionId,
      score: input.score,
      maxScore: input.maxScore,
      best_score: bestScore,
      best_max_score: bestMaxScore,
      play_count: playCount,
      last_played_at: completedAt,
      completedAt,
    },
    dependencies: [
      ...dependencies,
      ...(await repository.getOutbox())
        .filter((operation) => operation.entityId === sessionId)
        .map((operation) => operation.operationId),
    ],
  });
  return { sessionId, progressId, syncState: 'pending' as const };
}
