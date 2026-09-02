export function useCameraLerp(pos, TILE, internalW, internalH, cols, rows, speedMultiplier) {
  const targetX = pos.col * TILE + TILE / 2 - internalW / 2;
  const targetY = pos.row * TILE + TILE / 2 - internalH / 2;
  const x = Math.max(0, Math.min(Math.max(0, cols * TILE - internalW), targetX));
  const y = Math.max(0, Math.min(Math.max(0, rows * TILE - internalH), targetY));
  
  return { x, y };
}
