/**
 * Village Hub — South Indian Market Neighborhood
 *
 * Map Legend:
 *   0 = void (warm sky / distant city beyond map)
 *   1 = lane (walkable dusty concrete path)
 *   2 = building (non-walkable rooftop / facade block)
 *   5 = courtyard (walkable, darker paved texture)
 *
 * The layout is designed to feel organic: narrow winding lanes
 * packed between dense building clusters. No single central hub —
 * the player discovers shops gradually while wandering.
 */

export const MAP_COLS = 24;
export const MAP_ROWS = 18;

// prettier-ignore
export const MAP = [
//  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 0
  [ 0, 2, 2, 2, 2, 0, 2, 2, 2, 2, 0, 0, 0, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0], // 1
  [ 0, 2, 2, 2, 2, 0, 2, 2, 2, 2, 0, 0, 0, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0], // 2
  [ 0, 2, 2, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2, 2, 0], // 3  ← upper east-west lane
  [ 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 2, 2, 2, 2, 0], // 4  ← dead-end alley (cols 14-15)
  [ 0, 2, 2, 2, 2, 0, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0], // 5
  [ 0, 2, 2, 2, 2, 0, 2, 2, 2, 0, 0, 1, 0, 0, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0], // 6
  [ 0, 2, 2, 2, 2, 0, 0, 2, 0, 0, 1, 1, 0, 0, 2, 2, 2, 0, 0, 0, 0, 2, 2, 0], // 7
  [ 0, 2, 2, 2, 2, 1, 1, 1, 1, 1, 5, 5, 5, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 0], // 8  ← main east-west lane + courtyard
  [ 0, 0, 2, 2, 0, 0, 1, 2, 2, 0, 5, 5, 5, 0, 2, 2, 0, 0, 1, 2, 2, 2, 0, 0], // 9  ← south side alley
  [ 0, 0, 2, 2, 0, 0, 1, 2, 2, 0, 0, 1, 0, 0, 2, 2, 0, 0, 1, 2, 2, 2, 0, 0], // 10
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0], // 11
  [ 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0], // 12
  [ 0, 0, 2, 2, 0, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 0, 0, 0], // 13 ← fork lane (Library ← → Music Room)
  [ 0, 0, 0, 0, 0, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 0, 0, 0], // 14
  [ 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 0, 0, 0], // 15
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 16
  [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 17
];

/**
 * Shop definitions.
 * Each shop door sits on a building tile (non-walkable).
 * The player triggers entry by standing on the adjacent lane tile and pressing Space.
 *
 * `facing` is the direction the door faces — determines where the player stands to interact.
 */
export const SHOPS = [
  {
    id: "newsroom", col: 14, row: 2,
    label: "THE PRESS", scene: "newsroom",
    awning: "#c8a030", awningDark: "#a08020",
    sign: "#3a2810", signText: "#f0e8d0",
    facing: "south", // player at (14, 3)
  },
  {
    id: "nomadshome", col: 4, row: 8,
    label: "NOMADSHOME", scene: "nomadshome",
    awning: "#b85a3a", awningDark: "#904828",
    sign: "#2a1510", signText: "#f8e8d8",
    facing: "east", // player at (5, 8)
  },
  {
    id: "lab", col: 19, row: 10,
    label: "THE LAB", scene: "lab",
    awning: "#4a8a50", awningDark: "#387040",
    sign: "#1a2e1a", signText: "#d0f0d0",
    facing: "west", // player at (18, 10)
  },
  {
    id: "library", col: 7, row: 14,
    label: "LIBRARY", scene: "library",
    awning: "#2a7068", awningDark: "#1a5850",
    sign: "#0a2824", signText: "#c8e8e0",
    facing: "east", // player at (8, 14)
  },
  {
    id: "musicroom", col: 18, row: 14,
    label: "MUSIC ROOM", scene: "musicroom",
    awning: "#8a2848", awningDark: "#6a1838",
    sign: "#2a0818", signText: "#f0c8d8",
    facing: "west", // player at (17, 14)
  },
];

export const SHOP_TILES = new Set(SHOPS.map(s => `${s.col},${s.row}`));

/** Player spawns in the courtyard — central, with all lanes reachable. */
export const START_POS = { col: 11, row: 9 };

/**
 * Decorative elements positioned in world coordinates.
 * Rendered as pixel-art SVG overlays.
 */
export const DECORATIONS = {
  rickshaw: { col: 13, row: 8 },  // parked at courtyard edge
  // Electrical wire endpoints (pairs of building corners)
  wires: [
    { x1: 2, y1: 2, x2: 6, y2: 2 },    // upper-left buildings
    { x1: 13, y1: 1, x2: 18, y2: 1 },   // across Newsroom block
    { x1: 7, y1: 6, x2: 7, y2: 9 },     // vertical wire
    { x1: 19, y1: 5, x2: 22, y2: 5 },   // east buildings
  ],
};

/**
 * Palette constants for the tile renderer.
 */
export const PALETTE = {
  lane:      ["#d4c4a8", "#ccc098"],
  courtyard: ["#b8a888", "#b0a080"],
  building:  ["#c09060", "#b88050", "#c8a068", "#a87848", "#b89060"],
  rooftop:   ["#a87848", "#986838", "#b08050"],
  facade:    "#c09060",
  void:      "#d0c8b0",
  window:    "#4a3020",
  windowLit: "#e8c860",
};
