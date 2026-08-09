export const GROUND_PLAN = `
+-------+---------------------+-----------------+
| TOILET|   KITCHEN & UTILITY |        DINING   |
|       |                     |                 |
|       |                     |                 |
|       |                     D                 |
|       |                     |                 |
|       |                     |                 |
|       |                     |                 |
|       |                     |                 |
|       |                     |                 |
+---D---+---------------------+     +-----------|
|     _                                 |       |
|STAIR|                                 |       |
|(UP) |       DRAWING ROOM              |EXTERNA|
|     |                                 |STAIRS |     
|     |                                 |(UP)   |
|     |_                                |       |
|                                       D FOYER |
+---------------+-------+---------------+       |
|               |       D                       |
|   BEDROOM     +---D---+                       |
|  (inc. Dress) |       |                       |
|               | TOILET|                       |
|               |       |                       |
|               |       |            PARKING    |
|               |       |                       |
|               |       |                       |
+---------------+-------+============== GATE ===+
`.trim().split('\n');

export const FIRST_PLAN = `
+----+------------------+-------+---------------+
|TLT |      BEDROOM 1   |TOILET |   BEDROOM 2   |
|    |                  |       |               |
|    |                  |       |               |
|    D                  |       D               |
|____+                  +---D---+               |
|                       D       D               |
|                       |       |               |
|                       |       |               |
|                       |       |               |
+-----------------------+       +---------------+
|     _                                 |       |
|STAIR|                                 |       |
|(UP) |       DRAWING ROOM              |EXTERNA|
|     |                                 |STAIRS |     
|     |                                 |(UP)   |
|     |_                                |       |
|                                       D       |
+-----------------------+       +---------------+
|                       D       D               |
| MASTER BED            +-------+       |       |
| (inc. Dress)          |       |       |       |
|                       |TOILET |STORE  |       |
|                       |       |ROOM   |       |
|                       |       |       |       |
|                       |       |       |       |
+-----------------------+-------+-------+       |
|   BALCONY             |       |  BALCONY      |
+-----------------------+       +---------------+
`.trim().split('\n');

export const MAP_COLS = 49;
export const MAP_ROWS = Math.max(GROUND_PLAN.length, FIRST_PLAN.length);

// 0: Walkable, 1: Wall, 2: Door, 3: Gate
export const parseGrid = (plan) => {
  return Array.from({ length: MAP_ROWS }).map((_, r) => {
    const row = plan[r] || '';
    return Array.from({ length: MAP_COLS }).map((_, c) => {
      const char = row[c] || ' ';
      if (char === '+' || char === '-' || char === '|') return 1; // Wall
      if (char === 'D') return 2; // Door
      if (char === '=') return 3; // Gate
      return 0; // Walkable space or text
    });
  });
};

export const parseInside = (plan) => {
  const grid = parseGrid(plan);
  const outside = new Set();
  const q = [];
  
  // Seed the queue with all empty cells on the borders
  for(let r=0; r<MAP_ROWS; r++) {
    if (grid[r][0] === 0) q.push([r, 0]);
    if (grid[r][MAP_COLS-1] === 0) q.push([r, MAP_COLS-1]);
  }
  for(let c=0; c<MAP_COLS; c++) {
    if (grid[0][c] === 0) q.push([0, c]);
    if (grid[MAP_ROWS-1][c] === 0) q.push([MAP_ROWS-1, c]);
  }

  while(q.length) {
    const [r, c] = q.pop();
    const key = `${r},${c}`;
    if (outside.has(key)) continue;
    outside.add(key);
    
    [[r+1,c], [r-1,c], [r,c+1], [r,c-1]].forEach(([nr, nc]) => {
      if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS) {
        if (grid[nr][nc] === 0 && !outside.has(`${nr},${nc}`)) {
          q.push([nr, nc]);
        }
      }
    });
  }
  return Array.from({ length: MAP_ROWS }).map((_, r) => 
    Array.from({ length: MAP_COLS }).map((_, c) => {
      return grid[r][c] === 0 && !outside.has(`${r},${c}`);
    })
  );
};

export const GROUND_GRID = parseGrid(GROUND_PLAN);
export const FIRST_GRID = parseGrid(FIRST_PLAN);
export const GROUND_INSIDE = parseInside(GROUND_PLAN);
export const FIRST_INSIDE = parseInside(FIRST_PLAN);

export const START_POS = { col: 35, row: 22 }; // By the gate
export const NPC_POS_GROUND = { col: 22, row: 10 }; // By drawing room
