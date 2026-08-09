const { GROUND_PLAN, FIRST_PLAN } = require('./src/data/home.js');

function findRooms(plan) {
  const R = plan.length;
  const C = 49;
  
  // Create a grid of 0 (empty/outside) and 1 (wall)
  const grid = Array.from({length: R}, (_, r) => 
    Array.from({length: C}, (_, c) => {
      const char = plan[r]?.[c] || ' ';
      if (char === '+' || char === '-' || char === '|' || char === '=' || char === 'D') return 1;
      return 0;
    })
  );
  
  // Flood fill from 0,0 to find all OUTSIDE tiles
  const outside = new Set();
  const q = [[0, 0]];
  while(q.length) {
    const [r, c] = q.pop();
    const key = `${r},${c}`;
    if (outside.has(key)) continue;
    outside.add(key);
    
    [[r+1,c], [r-1,c], [r,c+1], [r,c-1]].forEach(([nr, nc]) => {
      if (nr >= 0 && nr < R && nc >= 0 && nc < C) {
        if (grid[nr][nc] === 0 && !outside.has(`${nr},${nc}`)) {
          q.push([nr, nc]);
        }
      }
    });
  }
  
  let insideCount = 0;
  for(let r=0; r<R; r++) {
    for(let c=0; c<C; c++) {
      if (grid[r][c] === 0 && !outside.has(`${r},${c}`)) insideCount++;
    }
  }
  console.log("Inside tiles:", insideCount);
}

findRooms(GROUND_PLAN);
