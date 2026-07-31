const MIN_TARGET_X = 160;
const CASTLE_FOOTPRINT = 72;
const BOARD_EDGE_PADDING = 16;

export function clampRainbowBridgeTargetX(targetX: number, boardWidth: number) {
  const safeBoardWidth = Number.isFinite(boardWidth) && boardWidth > 0 ? boardWidth : 320;
  const maxTargetX = Math.max(MIN_TARGET_X, Math.floor(safeBoardWidth - CASTLE_FOOTPRINT - BOARD_EDGE_PADDING));

  return Math.min(Math.max(targetX, MIN_TARGET_X), maxTargetX);
}

export function getRainbowBridgeTargetX(boardWidth: number, randomValue = Math.random()) {
  const maxTargetX = clampRainbowBridgeTargetX(Number.POSITIVE_INFINITY, boardWidth);
  const span = maxTargetX - MIN_TARGET_X;

  if (span <= 0) {
    return MIN_TARGET_X;
  }

  const normalizedRandom = Math.min(Math.max(randomValue, 0), 0.999999);
  return MIN_TARGET_X + Math.floor(normalizedRandom * (span + 1));
}
