/**
 * A* Pathfinding for grid-based 4-directional tile movement.
 *
 * @param {number} startCol - Starting tile column
 * @param {number} startRow - Starting tile row
 * @param {number} goalCol  - Target tile column
 * @param {number} goalRow  - Target tile row
 * @param {function} canWalk - (col, row) => boolean — scene's walkability check
 * @param {number} maxCols  - Total columns in the map
 * @param {number} maxRows  - Total rows in the map
 * @returns {Array<{col: number, row: number}>} Waypoints from start to goal (excluding start), or [] if unreachable
 */
export function findPath(startCol, startRow, goalCol, goalRow, canWalk, maxCols, maxRows) {
  // Trivial cases
  if (startCol === goalCol && startRow === goalRow) return [];
  if (!canWalk(goalCol, goalRow)) return [];

  const MAX_NODES = 2000;
  const DIRS = [
    { dc: 0, dr: -1 },  // up
    { dc: 0, dr: 1 },   // down
    { dc: -1, dr: 0 },  // left
    { dc: 1, dr: 0 },   // right
  ];

  // Manhattan distance heuristic
  const h = (c, r) => Math.abs(c - goalCol) + Math.abs(r - goalRow);

  // Open set — simple array; fine for grids under ~2000 nodes
  const open = [{ col: startCol, row: startRow, g: 0, f: h(startCol, startRow), parent: null }];
  const closed = new Set();
  const bestG = new Map();
  bestG.set(`${startCol},${startRow}`, 0);

  let explored = 0;

  while (open.length > 0 && explored < MAX_NODES) {
    // Pick node with lowest f
    let bi = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bi].f || (open[i].f === open[bi].f && open[i].g > open[bi].g)) bi = i;
    }
    const cur = open.splice(bi, 1)[0];
    const ck = `${cur.col},${cur.row}`;

    // Goal reached — reconstruct path
    if (cur.col === goalCol && cur.row === goalRow) {
      const path = [];
      let n = cur;
      while (n.parent) {
        path.unshift({ col: n.col, row: n.row });
        n = n.parent;
      }
      return path;
    }

    closed.add(ck);
    explored++;

    for (const { dc, dr } of DIRS) {
      const nc = cur.col + dc;
      const nr = cur.row + dr;
      if (nc < 0 || nc >= maxCols || nr < 0 || nr >= maxRows) continue;

      const nk = `${nc},${nr}`;
      if (closed.has(nk)) continue;
      if (!canWalk(nc, nr)) continue;

      const ng = cur.g + 1;
      if (bestG.has(nk) && ng >= bestG.get(nk)) continue;

      bestG.set(nk, ng);
      open.push({ col: nc, row: nr, g: ng, f: ng + h(nc, nr), parent: cur });
    }
  }

  return []; // No path found
}
