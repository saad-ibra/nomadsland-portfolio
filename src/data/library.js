/**
 * Library shelf layout and tile map data.
 * Defines the L-shaped library room, bookshelf positions, and decoration tiles.
 */

// L-shaped tile map
// Legend: 0 = void (black), 1 = floor, 2 = wall-top, 3 = rug
export const MAP_COLS = 20;
export const MAP_ROWS = 18;

// prettier-ignore
export const MAP = [
// 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 0
  [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0], // 1
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 2
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 3
  [0, 1, 1, 1, 3, 3, 3, 3, 3, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 4
  [0, 1, 1, 1, 3, 3, 3, 3, 3, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 5
  [0, 1, 1, 1, 3, 3, 3, 3, 3, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 6
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // 7
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0], // 8
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // 9
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // 10
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 0], // 11
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 0], // 12
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 0], // 13
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // 14
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // 15
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 16 ← door opening
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 17
];

// Shelf positions and tour data
export const SHELF_LAYOUT = [
  { id: "all", col: 2, row: 2, tourCol: 2, tourRow: 3, line: "This is the whole collection, all together." },
  { id: "currently-reading", col: 2, row: 7, tourCol: 3, tourRow: 7, line: "This one is open right now, a book in progress." },
  { id: "want-to-read", col: 11, row: 2, tourCol: 11, tourRow: 3, line: "Over here, these are waiting their turn." },
  { id: "read", col: 17, row: 9, tourCol: 17, tourRow: 10, line: "The finished shelf. Those that made it all the way through." },
  { id: "did-not-finish", col: 13, row: 14, tourCol: 14, tourRow: 14, line: "And here, those that didn't stick around. No shame in that." },
];

export const SHELF_TILES = new Set(SHELF_LAYOUT.map((s) => `${s.col},${s.row}`));
export const DECOR_TILES = new Set(["10,3", "5,7", "3,8"]); // ReadingDesk, Globe, Chair

// Tour timing
export const TOUR_MOVE_MS = 220;
export const TOUR_PAUSE_MS = 2200;

// Color palettes for book types
export const TYPE_COLORS = {
  normal: { primary: "#a8a878", dark: "#8a8a58", light: "#c8c898", bg: "#d8d8b0" },
  psychic: { primary: "#f85888", dark: "#c03060", light: "#ff90b0", bg: "#ffc0d0" },
  fire: { primary: "#f08030", dark: "#c05818", light: "#f8a860", bg: "#f8d0a0" },
  grass: { primary: "#78c850", dark: "#48a018", light: "#a0e070", bg: "#c8f0a0" },
  poison: { primary: "#a040a0", dark: "#702070", light: "#c870c8", bg: "#e0a0e0" },
};

export const BOOK_SPINE_PALETTES = {
  normal: ["#8b4513", "#a0522d", "#d2691e", "#cd853f", "#deb887", "#6b3a1f", "#c4a882", "#947254"],
  psychic: ["#8b008b", "#9932cc", "#ba55d3", "#da70d6", "#c71585", "#db7093", "#a0486e", "#7a3060"],
  fire: ["#b22222", "#dc143c", "#ff4500", "#ff6347", "#cd5c5c", "#e25822", "#cc4422", "#993311"],
  grass: ["#006400", "#228b22", "#2e8b57", "#3cb371", "#556b2f", "#6b8e23", "#4a7c3f", "#2d5a1e"],
  poison: ["#4b0082", "#6a0dad", "#7b68ee", "#9370db", "#800080", "#663399", "#5a2d82", "#8b3a8b"],
};

// Player start position — spawns just inside the door
export const START_POS = { col: 9, row: 15 };
export const EXIT_DOOR_COL = 9;
export const EXIT_DOOR_ROW = 16;
