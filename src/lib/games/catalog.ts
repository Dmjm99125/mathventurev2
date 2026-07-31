const GAME_COUNT_BY_TOPIC = {
  colors: 7,
  shapes: 9,
  sequencing: 10,
  addition: 12,
  subtraction: 10,
  numbers: 9,
  measurement: 7,
  comparison: 11,
  clock: 7,
} as const;

export type TeacherTopicId = keyof typeof GAME_COUNT_BY_TOPIC;

export type GameCatalogEntry = {
  topicId: TeacherTopicId;
  gameId: string;
  gameOrder: number;
  title: string;
  maxScore: number;
};

export const GAME_CATALOG: readonly GameCatalogEntry[] = (
  Object.entries(GAME_COUNT_BY_TOPIC) as [TeacherTopicId, number][]
).flatMap(([topicId, count]) =>
  Array.from({ length: count }, (_, gameOrder) => ({
    topicId,
    gameId: `${topicId}:${gameOrder}`,
    gameOrder,
    title: `${topicId}-${gameOrder + 1}`,
    maxScore: 1,
  })),
);

export function getGameCatalogEntry(topicId: string, gameOrder: number): GameCatalogEntry | null {
  return GAME_CATALOG.find((entry) => entry.topicId === topicId && entry.gameOrder === gameOrder) ?? null;
}
