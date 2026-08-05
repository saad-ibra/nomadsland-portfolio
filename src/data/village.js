/**
 * Village Hub — Island-Style Overworld
 *
 * Map Legend:
 *   . = Grass (walkable)
 *   p = Dirt path (walkable)
 *   f = Flowers (walkable)
 *   T = Standard Forest Tree (solid)
 *   P = Pine Tree (solid)
 *   O = Oak Tree (solid)
 *   H = House / Building structure (solid)
 *   ~ = Water (solid)
 *   C = Cliff face (solid)
 *   S = Stone Stairs (walkable)
 *   B = Wooden Bridge / Dock (walkable)
 */

export const MAP_COLS = 36;
export const MAP_ROWS = 32;

const layout = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~TTTTTTTTTTTTT~~~~~~PPPPPPPPPPPPPP~~",
  "~T...f.......T~~~~~~P......f.....P~~",
  "~T...HHHHH...T~~~~~~P...HHHHH....P~~",
  "~T...HHHHH...T~~~~~~P...HHHHH....P~~",
  "~T...HHHHH...T~~~~~~P...HHHHH....P~~",
  "~T.....p.....T~~~~~~P.....p......P~~",
  "~T.....p.....T~~~~~~P.....p......P~~",
  "~T.....pppppppBBBBBBppppppp......P~~",
  "~T...f.p.....T~~~~~~P.........f..P~~",
  "~TTTT..p...TTT~~~~~~PPPPPPPPPPPPPP~~",
  "~~~~T..p.....TTTT~~~~~~~~~~~~~~~~~~~",
  "~~~~T..p...HHHHHT~~~OOOOOOOOOOOOOO~~",
  "~TTTT..p...HHHHHT~~~O............O~~",
  "~T.....p...HHHHHT~~~O...HHHHH....O~~",
  "~T.....ppppppp..T~~~O...HHHHH....O~~",
  "~T.....p........T~~~O...HHHHH....O~~",
  "~T.....pppppppppBBBBppppppp...f..O~~",
  "~T.....p.....T..T~~~O.....p......O~~",
  "~TTTTTTpTTTTTT..T~~~O.....p......O~~",
  "~CCCCCCSCCCCCC..T~~~O.....p......O~~",
  "~C.....p.....C..T~~~O.....p......O~~",
  "~C..f..p.....CTTT~~~OOOOOOpOOOOOOO~~",
  "~C...HHHHH...C~~~~~~~~~~~~p~~~~~~~~~",
  "~C...HHHHH...C~~~~~~~~~~~~p~~~~~~~~~",
  "~C...HHHHH...C~~~~~~~~~~~~DDDD~~~~~~",
  "~C...........C~~~~~~~~~~~~DDDD~~~~~~",
  "~C...........C~~~~~~~~~~~~DDDD~~~~~~",
  "~CCCCCCCCCCCCC~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
];

const charToType = {
  '.': 0,  // grass
  'p': 1,  // path
  'T': 2,  // tree
  'H': 3,  // house
  '~': 4,  // water
  'P': 5,  // pine tree
  'f': 6,  // flowers
  'O': 7,  // oak tree
  'C': 8,  // cliff
  'S': 9,  // stairs
  'B': 10, // bridge
  'D': 11, // dock
};

export const MAP = layout.map(row => row.split('').map(char => charToType[char] ?? (char === 'D' ? 11 : 4)));

/**
 * Shop Definitions — each door sits at the bottom-center tile of the 5×3 H block
 */
export const SHOPS = [
  {
    id: "newsroom", col: 7, row: 5,
    label: "THE PRESS", scene: "newsroom",
  },
  {
    id: "library", col: 13, row: 14,
    label: "LIBRARY", scene: "library",
  },
  {
    id: "musicroom", col: 26, row: 5,
    label: "MUSIC ROOM", scene: "musicroom",
  },
  {
    id: "lab", col: 26, row: 16,
    label: "THE LAB", scene: "lab",
  },
  {
    id: "nomadshome", col: 7, row: 25,
    label: "NOMADSHOME", scene: "nomadshome",
  },
  {
    id: "dock", col: 28, row: 27,
    label: "THE DOCK", scene: null,
  },
];

export const SHOP_TILES = new Set(SHOPS.filter(s => s.id !== "dock").map(s => `${s.col},${s.row}`));

// Player spawns just below Nomadshome door
export const START_POS = { col: 7, row: 26 };

export const PALETTE = {
  grass:   ["#68c058", "#60b850", "#70c860"],
  path:    ["#e8c880", "#e0c078"],
  tree:    ["#307840", "#286838", "#388848"],
  flowers: ["#f8d8e8", "#f0e060"],
  water:   ["#2a75a9", "#2568a0", "#3080b0"],
  pine:    ["#1a5c2a", "#0d3a1f", "#1e6830"],
  oak:     ["#2d6a36", "#1f5a28", "#38783e"],
  cliff:   ["#5a4033", "#4a3525", "#6a4a3a"],
  stairs:  ["#9a9a9a", "#888888"],
  bridge:  ["#8b5a2b", "#7a4e24"],
};
