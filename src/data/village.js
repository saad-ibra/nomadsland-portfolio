/**
 * Village Hub — Pokémon-style Structured Overworld
 *
 * Map Legend:
 *   . = Grass (walkable)
 *   p = Dirt path (walkable)
 *   f = Flowers (walkable)
 *   T = Tree / Forest boundary (solid)
 *   H = House (solid)
 */

export const MAP_COLS = 36;
export const MAP_ROWS = 32;

const layout = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "TT................................TT",
  "TT..HHHHH................HHHHH....TT",
  "TT..HHHHH................HHHHH....TT",
  "TT..HHHHH................HHHHH....TT",
  "TT....p....................p......TT",
  "TT....p......TTTTTTTT......p......TT",
  "TT....pppppppppppppppppppppp......TT",
  "TT...........p......p.............TT",
  "TTT..........p..ff..p............TTT",
  "TTT...HHHHH..p.f..f.p..HHHHH.....TTT",
  "TTT...HHHHH..p..ff..p..HHHHH.....TTT",
  "TT....HHHHH..p......p..HHHHH......TT",
  "TT......p....pppppppp....p........TT",
  "TT......p.......p........p........TT",
  "TT......ppppppppp........p........TT",
  "TT..............p........p........TT",
  "TTT.............p........p.......TTT",
  "TTT..TTTTTTT....p....pppppppp....TTT",
  "TTT..TTTTTTT....p....p......p....TTT",
  "TT..............p....p..ff..p.....TT",
  "TT..............p....p.f..f.p.....TT",
  "TT..........HHHHH....p..ff..p.....TT",
  "TT..........HHHHH....p......p.....TT",
  "TT..........HHHHH....pppppppp.....TT",
  "TT............pppppppp............TT",
  "TT................................TT",
  "TT................................TT",
  "TT................................TT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
];

const charToType = {
  '.': 0, // grass
  'p': 1, // path
  'T': 2, // tree
  'H': 3, // house
  'f': 6, // flowers
};

export const MAP = layout.map(row => row.split('').map(char => charToType[char]));

/**
 * Shop Definitions
 */
export const SHOPS = [
  {
    id: "newsroom", col: 6, row: 5,
    label: "THE PRESS", scene: "newsroom",
    roof: "#d84040", wall: "#f0e8d0", door: "#8a3030", // Red roof
    facing: "south", // player stands at (6, 6) facing up
  },
  {
    id: "nomadshome", col: 14, row: 25,
    label: "NOMADSHOME", scene: "nomadshome",
    roof: "#408ad8", wall: "#e0f0f8", door: "#204a8a", // Blue roof
    facing: "south", // player stands at (14, 26)
  },
  {
    id: "lab", col: 25, row: 13,
    label: "THE LAB", scene: "lab",
    roof: "#40d860", wall: "#e8f8e0", door: "#208a30", // Green roof
    facing: "south", // player stands at (25, 14)
  },
  {
    id: "library", col: 27, row: 5,
    label: "LIBRARY", scene: "library",
    roof: "#8a40d8", wall: "#f0e0f8", door: "#4a208a", // Purple roof
    facing: "south", // player stands at (27, 6)
  },
  {
    id: "musicroom", col: 8, row: 13,
    label: "MUSIC ROOM", scene: "musicroom",
    roof: "#d88a40", wall: "#f8efe0", door: "#8a4a20", // Orange roof
    facing: "south", // player stands at (8, 14)
  },
];

export const SHOP_TILES = new Set(SHOPS.map(s => `${s.col},${s.row}`));
export const START_POS = { col: 17, row: 16 }; // Middle of the central vertical path

export const PALETTE = {
  grass: ["#68c058", "#60b850", "#70c860"],
  path:  ["#e8c880", "#e0c078"],
  tree:  ["#307840", "#286838", "#388848"],
  flowers: ["#f8d8e8", "#f0e060"],
};
