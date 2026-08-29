export function scoreByPosition<T>(placed: T[], expected: T[]) {
  return placed.reduce(
    (score, item, index) => score + (item === expected[index] ? 1 : 0),
    0,
  );
}
