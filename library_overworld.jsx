"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Library, BookOpen, Clock, CheckCircle, XCircle, ArrowRight, Newspaper } from "lucide-react";
import ControlBar from "./ControlBar";

const getShelfIcon = (id, size=10) => {
  switch (id) {
    case "all": return <Library size={size} />;
    case "currently-reading": return <BookOpen size={size} />;
    case "want-to-read": return <Clock size={size} />;
    case "read": return <CheckCircle size={size} />;
    case "did-not-finish": return <XCircle size={size} />;
    default: return <Library size={size} />;
  }
};

// ============================================================
//  TILE MAP - L-shaped library
//  Legend:  0 = void (black), 1 = floor, 2 = wall-top, 3 = rug
//  Shelves, decorations, and player sit ON floor tiles.
// ============================================================
const TILE = 32; // px per tile
const MAP_COLS = 20;
const MAP_ROWS = 18;

// prettier-ignore
const MAP = [
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
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 16
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // 17
];

function isWalkable(col, row) {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
  const t = MAP[row][col];
  return t === 1 || t === 3;
}

// ---- Shelf data - positions in tile coords (col, row) ----
const SHELF_LAYOUT = [
  { id: "all", col: 2, row: 2, tourCol: 2, tourRow: 3, line: "This is the whole collection, all together." },
  { id: "currently-reading", col: 2, row: 7, tourCol: 3, tourRow: 7, line: "This one is open right now, a book in progress." },
  { id: "want-to-read", col: 11, row: 2, tourCol: 11, tourRow: 3, line: "Over here, these are waiting their turn." },
  { id: "read", col: 17, row: 9, tourCol: 17, tourRow: 10, line: "The finished shelf. Those that made it all the way through." },
  { id: "did-not-finish", col: 9, row: 14, tourCol: 10, tourRow: 14, line: "And here, those that didn't stick around. No shame in that." },
];

// Mark shelf and solid decoration tiles as blocked (non-walkable)
const SHELF_TILES = new Set(SHELF_LAYOUT.map((s) => `${s.col},${s.row}`));
const DECOR_TILES = new Set(["10,3", "5,7", "3,8"]); // ReadingDesk, Globe, Chair
function canWalk(col, row) {
  const coord = `${col},${row}`;
  if (SHELF_TILES.has(coord) || DECOR_TILES.has(coord)) return false;
  return isWalkable(col, row);
}

const TYPE_COLORS = {
  normal: { primary: "#a8a878", dark: "#8a8a58", light: "#c8c898", bg: "#d8d8b0" },
  psychic: { primary: "#f85888", dark: "#c03060", light: "#ff90b0", bg: "#ffc0d0" },
  fire: { primary: "#f08030", dark: "#c05818", light: "#f8a860", bg: "#f8d0a0" },
  grass: { primary: "#78c850", dark: "#48a018", light: "#a0e070", bg: "#c8f0a0" },
  poison: { primary: "#a040a0", dark: "#702070", light: "#c870c8", bg: "#e0a0e0" },
};

const BOOK_SPINE_PALETTES = {
  normal: ["#8b4513", "#a0522d", "#d2691e", "#cd853f", "#deb887", "#6b3a1f", "#c4a882", "#947254"],
  psychic: ["#8b008b", "#9932cc", "#ba55d3", "#da70d6", "#c71585", "#db7093", "#a0486e", "#7a3060"],
  fire: ["#b22222", "#dc143c", "#ff4500", "#ff6347", "#cd5c5c", "#e25822", "#cc4422", "#993311"],
  grass: ["#006400", "#228b22", "#2e8b57", "#3cb371", "#556b2f", "#6b8e23", "#4a7c3f", "#2d5a1e"],
  poison: ["#4b0082", "#6a0dad", "#7b68ee", "#9370db", "#800080", "#663399", "#5a2d82", "#8b3a8b"],
};

const INTERNAL_W = 384;
const INTERNAL_H = 288;
const MOVE_COOLDOWN = 140; // ms between grid moves
const TOUR_MOVE_MS = 220;
const TOUR_PAUSE_MS = 2200;

// ============================================================
//  Player Sprite
// ============================================================
function PlayerSprite({ direction, stepping }) {
  const frame = stepping ? 1 : 0;
  const skin = "#fcd8b4", skinShade = "#e8b888";
  const hair = "#3a1c08", hairLight = "#5a3018";
  const shirt = "#e04040", shirtShade = "#b83030";
  const pants = "#2850a0";
  const shoe = "#282828", eye = "#181818", white = "#ffffff";
  const px = (x, y, w, h, color) => <rect key={`${x}-${y}-${color}`} x={x} y={y} width={w} height={h} fill={color} />;

  const renderDown = () => {
    const legL = frame === 1 ? 1 : 0, legR = frame === 1 ? -1 : 0;
    return (<>
      {px(4,0,8,2,hair)}{px(3,1,10,1,hair)}{px(3,2,10,2,hair)}
      {px(4,4,8,5,skin)}{px(3,4,1,4,skin)}{px(12,4,1,4,skin)}
      {px(5,5,2,2,white)}{px(9,5,2,2,white)}{px(6,6,1,1,eye)}{px(10,6,1,1,eye)}
      {px(7,8,2,1,skinShade)}
      {px(3,9,10,4,shirt)}{px(2,10,1,3,shirt)}{px(13,10,1,3,shirt)}{px(4,9,8,1,shirtShade)}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {px(4,13,3,2,pants)}{px(9,13,3,2,pants)}{px(7,13,2,1,"#183878")}
      {px(4,15+legL,3,1,shoe)}{px(9,15+legR,3,1,shoe)}
    </>);
  };
  const renderUp = () => {
    const legL = frame === 1 ? 1 : 0, legR = frame === 1 ? -1 : 0;
    return (<>
      {px(4,0,8,2,hair)}{px(3,1,10,1,hair)}{px(3,2,10,6,hair)}{px(4,7,8,2,hairLight)}
      {px(3,9,10,4,shirt)}{px(2,10,1,3,shirt)}{px(13,10,1,3,shirt)}{px(7,9,2,4,shirtShade)}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {px(4,13,3,2,pants)}{px(9,13,3,2,pants)}{px(7,13,2,1,"#183878")}
      {px(4,15+legL,3,1,shoe)}{px(9,15+legR,3,1,shoe)}
    </>);
  };
  const renderSide = (flip) => {
    const lo = frame === 1 ? 1 : 0;
    return (
      <g transform={flip ? "translate(16,0) scale(-1,1)" : undefined}>
        {px(5,0,7,2,hair)}{px(4,1,9,1,hair)}{px(4,2,9,2,hair)}{px(3,3,2,3,hair)}
        {px(5,4,7,5,skin)}{px(4,5,1,3,skin)}{px(12,5,1,3,skin)}
        {px(10,5,2,2,white)}{px(11,6,1,1,eye)}{px(10,8,2,1,skinShade)}
        {px(4,9,9,4,shirt)}{px(3,10,1,3,shirt)}{px(5,9,2,1,shirtShade)}
        {px(12,10,2,3,skin)}
        {px(5,13,3,2,pants)}{px(9,13,3,2,pants)}
        {px(5,15,3,1+lo,shoe)}{px(9,15,3,1,shoe)}
      </g>
    );
  };
  return (
    <svg width={TILE} height={TILE+2} viewBox="0 0 16 17" style={{ imageRendering: "pixelated", overflow: "visible" }}>
      <ellipse cx="8" cy="16.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.3)" />
      {direction === "down" && renderDown()}
      {direction === "up" && renderUp()}
      {direction === "left" && renderSide(true)}
      {direction === "right" && renderSide(false)}
    </svg>
  );
}

// ============================================================
//  Pixel Shelf - high-quality retro pixel art bookshelf
// ============================================================
function PixelShelf({ shelf, isNear, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;
  const colors = TYPE_COLORS[shelf.type];
  const spines = BOOK_SPINE_PALETTES[shelf.type];
  
  // Pack books linearly into the 3 rows
  const rows = [[], [], []];
  let curX = [2, 2, 2];
  
  shelf.books.slice(0, 18).forEach((b, i) => {
    const r = Math.floor(i / 6);
    if (curX[r] >= 13) return; // Full row
    
    // Pseudo-randomize based on title
    const len = b.title.length;
    const bh = 4 + (len % 3); // 4, 5, or 6 px high
    const bw = (len % 2 === 0) ? 2 : 1;
    if (curX[r] + bw > 14) return; // Doesn't fit
    
    const by = (r === 0 ? 7 : r === 1 ? 14 : 21) - bh;
    const color = spines[i % spines.length];
    
    rows[r].push(
      <g key={i}>
        <rect x={curX[r]} y={by} width={bw} height={bh} fill={color} />
        {bw > 1 && <rect x={curX[r]} y={by} width="1" height={bh} fill="rgba(255,255,255,0.2)" />}
        {bw > 1 && <rect x={curX[r]+bw-1} y={by} width="1" height={bh} fill="rgba(0,0,0,0.25)" />}
        <rect x={curX[r]} y={by} width={bw} height="1" fill="rgba(255,255,255,0.4)" />
      </g>
    );
    curX[r] += bw + ((len % 3 === 0) ? 1 : 0); // Occasional 1px gap
  });

  const renderDecor = () => {
    switch (shelf.type) {
      case "grass": return (
        <g>
          <rect x="3" y="-3" width="4" height="3" fill="#a25b44" />
          <rect x="2" y="-6" width="6" height="3" fill="#5a8a3a" />
          <rect x="4" y="-8" width="2" height="2" fill="#6a9a4a" />
          <rect x="7" y="-7" width="2" height="2" fill="#6a9a4a" />
        </g>
      );
      case "fire": return (
        <g>
          <rect x="10" y="-3" width="2" height="3" fill="#e8e0c0" />
          <rect x="10" y="-4" width="1" height="1" fill="#888" />
          <rect x="11" y="-5" width="1" height="2" fill="#ff4500" />
          <rect x="11" y="-6" width="1" height="1" fill="#ffda00" />
        </g>
      );
      case "psychic": return (
        <g>
          <rect x="5" y="-1" width="6" height="1" fill="#743f39" />
          <rect x="6" y="-5" width="4" height="4" rx="2" fill="#ba55d3" />
          <rect x="7" y="-4" width="1" height="1" fill="#fff" opacity="0.6" />
        </g>
      );
      case "poison": return (
        <g>
          <rect x="11" y="-3" width="3" height="3" rx="1" fill="#4b0082" />
          <rect x="12" y="-5" width="1" height="2" fill="#8b3a8b" />
          <rect x="12" y="-6" width="1" height="1" fill="#a25b44" />
          <rect x="11" y="-2" width="1" height="1" fill="#fff" opacity="0.4" />
        </g>
      );
      case "normal": default: return (
        <g>
          <rect x="6" y="-4" width="4" height="4" fill="#a25b44" />
          <rect x="7" y="-3" width="2" height="2" fill="#e8e0c0" />
          <rect x="8" y="-3" width="1" height="1" fill="#2c1b18" />
        </g>
      );
    }
  };

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      position: "absolute",
      left: shelf.col * TILE,
      top: shelf.row * TILE - 16,
      width: TILE, height: TILE + 16,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      cursor: "pointer",
      filter: active ? `brightness(1.1) drop-shadow(0 0 6px ${colors.primary}88)` : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
      transition: "filter 0.15s",
      zIndex: shelf.row * 10,
    }}>
      <svg width="32" height="56" viewBox="0 -4 16 28" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        
        {/* Decor on top */}
        {renderDecor()}

        {/* Bookshelf Frame */}
        <rect x="2" y="2" width="12" height="20" fill="#2c1b18" />
        <path d="M0,0 h16 v24 h-16 Z M2,2 v20 h12 v-20 Z" fill="#743f39" fillRule="evenodd" />
        
        {/* Frame Highlights */}
        <rect x="0" y="0" width="15" height="1" fill="#a25b44" />
        <rect x="0" y="0" width="1" height="23" fill="#a25b44" />
        <rect x="2" y="7" width="12" height="1" fill="#a25b44" />
        <rect x="2" y="14" width="12" height="1" fill="#a25b44" />
        <rect x="2" y="21" width="12" height="1" fill="#a25b44" />
        
        {/* Frame Shadows */}
        <rect x="15" y="1" width="1" height="23" fill="#502621" />
        <rect x="1" y="23" width="15" height="1" fill="#502621" />
        <rect x="2" y="8" width="12" height="1" fill="#502621" />
        <rect x="2" y="15" width="12" height="1" fill="#502621" />
        <rect x="2" y="22" width="12" height="1" fill="#502621" />

        {/* Render Books */}
        {rows.map((row, r) => <g key={r}>{row}</g>)}

      </svg>
    </div>
  );
}

// ============================================================
//  Typewriter hook
// ============================================================
function useTypewriter(text, speed = 28) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return shown;
}

// ============================================================
//  Book Cover (modal)
// ============================================================
function PixelBookCover({ book, typeColors }) {
  return (
    <a href={book.link || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", background: "rgba(0,0,0,0.25)", borderRadius: 2, border: "2px solid rgba(255,255,255,0.1)", textDecoration: "none", transition: "transform 0.1s, background 0.1s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateX(2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.25)"; e.currentTarget.style.transform = "translateX(0)"; }}>
      <div style={{
        width: 28, height: 40, flexShrink: 0, imageRendering: "auto", borderRadius: 1,
        border: "1px solid #1a1b2e",
        background: book.coverUrl ? `url(${book.coverUrl}) center/cover no-repeat` : `linear-gradient(180deg, ${typeColors.primary} 0%, ${typeColors.dark} 100%)`,
        position: "relative", boxShadow: "1px 1px 0 rgba(0,0,0,0.4)",
      }}>
        {!book.coverUrl && (<>
          <div style={{ position: "absolute", top: 2, left: 2, right: 2, height: 1, background: "rgba(255,255,255,0.4)" }} />
          <div style={{ position: "absolute", top: 5, left: 3, right: 3, height: 1, background: "rgba(255,255,255,0.25)" }} />
          <div style={{ position: "absolute", bottom: 3, left: 2, right: 2, height: 1, background: "rgba(255,255,255,0.3)" }} />
        </>)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#f4e8d0", lineHeight: 1.6, wordWrap: "break-word" }}>{book.title}</div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, opacity: 0.6, color: "#f4e8d0", marginTop: 4 }}>{book.author}</div>
      </div>
    </a>
  );
}

// ============================================================
// ============================================================
//  Decorations
// ============================================================
function PixelLantern({ col, row }) {
  return (
    <div style={{ position: "absolute", left: col*TILE+8, top: row*TILE-4, imageRendering: "pixelated", zIndex: row * 10 }}>
      <svg width="16" height="32" viewBox="0 0 8 16" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        <rect x="3" y="10" width="2" height="4" fill="#111" />
        <rect x="2" y="9" width="4" height="1" fill="#222" />
        <rect x="3" y="4" width="2" height="5" fill="#f4e8d0" />
        <rect x="3" y="4" width="1" height="5" fill="#fff" />
        <rect x="3" y="1" width="2" height="3" fill="#ff4500" />
        <rect x="4" y="2" width="1" height="2" fill="#ffd700" />
        <rect x="4" y="3" width="1" height="1" fill="#fff" />
      </svg>
      <div style={{ position: "absolute", top: -8, left: "50%", width: 64, height: 64, marginLeft: -32, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,160,0,0.25) 0%, transparent 60%)", pointerEvents: "none", animation: "lanternFlicker 0.2s ease-in-out infinite alternate" }} />
    </div>
  );
}

function WallBookcase({ col, row, flip }) {
  return (
    <div style={{ position: "absolute", left: col*TILE, top: row*TILE-8, imageRendering: "pixelated", transform: flip ? "scaleX(-1)" : undefined, zIndex: row * 10 }}>
      <svg width="32" height="40" viewBox="0 0 16 20" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        <rect x="0" y="20" width="16" height="2" fill="rgba(0,0,0,0.4)" />
        <path d="M0,20 L0,2 C0,0.8 1,0 2,0 L14,0 C15,0 16,0.8 16,2 L16,20 Z" fill="#3a2210" />
        <path d="M1,20 L1,2 C1,1.5 1.5,1 2,1 L14,1 C14.5,1 15,1.5 15,2 L15,20 Z" fill="#201008" />
        <rect x="1" y="6" width="14" height="1" fill="#4a2a18" />
        <rect x="1" y="13" width="14" height="1" fill="#4a2a18" />
        
        <rect x="2" y="3" width="2" height="3" fill="#8b2222" />
        <rect x="4" y="2" width="1" height="4" fill="#d4af37" />
        <rect x="6" y="3" width="2" height="3" fill="#225588" />
        <rect x="9" y="4" width="3" height="2" fill="#228b22" />
        <rect x="13" y="2" width="1" height="4" fill="#4b0082" />
        
        <rect x="2" y="9" width="3" height="4" fill="#a0522d" />
        <rect x="6" y="10" width="2" height="3" fill="#cd5c5c" />
        <rect x="8" y="9" width="1" height="4" fill="#d4af37" />
        <rect x="11" y="11" width="3" height="2" fill="#556b2f" />
        
        <rect x="3" y="16" width="1" height="4" fill="#4682b4" />
        <rect x="4" y="15" width="2" height="5" fill="#8b4513" />
        <rect x="7" y="17" width="3" height="3" fill="#800000" />
        <rect x="11" y="15" width="2" height="5" fill="#2f4f4f" />
        
        <rect x="2" y="3" width="1" height="3" fill="#fff" opacity="0.2"/>
        <rect x="2" y="9" width="1" height="4" fill="#fff" opacity="0.2"/>
        <rect x="4" y="15" width="1" height="5" fill="#fff" opacity="0.2"/>
      </svg>
    </div>
  );
}

function ReadingDesk({ col, row }) {
  return (
    <div style={{ position: "absolute", left: col*TILE, top: row*TILE+8, imageRendering: "pixelated", zIndex: row * 10 }}>
      <svg width="32" height="24" viewBox="0 0 16 12" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        <rect x="0" y="10" width="16" height="3" fill="rgba(0,0,0,0.3)" />
        <rect x="1" y="6" width="2" height="5" fill="#201008" />
        <rect x="13" y="6" width="2" height="5" fill="#201008" />
        <rect x="2" y="6" width="1" height="5" fill="#3a2210" />
        <rect x="14" y="6" width="1" height="5" fill="#3a2210" />
        <rect x="0" y="4" width="16" height="3" fill="#4a2a18" />
        <rect x="0" y="3" width="16" height="1" fill="#6a3a20" />
        
        <rect x="12" y="0" width="2" height="2" fill="#2e8b57" />
        <rect x="13" y="1" width="1" height="1" fill="#3cb371" />
        <rect x="12" y="2" width="2" height="1" fill="#d4a520" />
        <rect x="13" y="3" width="1" height="1" fill="#d4a520" />
        
        <rect x="3" y="2" width="6" height="2" fill="#f4e8d0" />
        <rect x="3" y="2" width="3" height="2" fill="#fff" />
        <rect x="5" y="2" width="1" height="2" fill="#dcdcdc" />
        <rect x="4" y="3" width="1" height="1" fill="#aaa" />
        <rect x="7" y="3" width="1" height="1" fill="#aaa" />
        
        <rect x="1" y="2" width="1" height="1" fill="#111" />
        <path d="M1.5,2 L0,-1" stroke="#fff" strokeWidth="0.5" fill="none" />
      </svg>
    </div>
  );
}

function PixelGlobe({ col, row }) {
  return (
    <div style={{ position: "absolute", left: col*TILE+4, top: row*TILE+8, imageRendering: "pixelated", zIndex: row * 10 }}>
      <svg width="24" height="24" viewBox="0 0 12 12" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        <ellipse cx="6" cy="12" rx="4" ry="1.5" fill="rgba(0,0,0,0.4)" />
        <rect x="4" y="10" width="4" height="2" fill="#4a2a18" />
        <rect x="5" y="8" width="2" height="2" fill="#d4a520" />
        <path d="M1,5 Q1,9 6,9 Q11,9 11,5" fill="none" stroke="#d4a520" strokeWidth="1" />
        <rect x="1" y="4" width="1" height="2" fill="#d4a520" />
        <rect x="10" y="4" width="1" height="2" fill="#d4a520" />
        <circle cx="6" cy="4" r="3.5" fill="#1e90ff" />
        <circle cx="6" cy="4" r="3.5" fill="rgba(0,0,0,0.2)" />
        <circle cx="5.5" cy="3.5" r="3" fill="#4169e1" />
        <rect x="4" y="2" width="2" height="1" fill="#32cd32" />
        <rect x="3" y="3" width="3" height="2" fill="#228b22" />
        <rect x="4" y="5" width="1" height="1" fill="#32cd32" />
        <rect x="7" y="3" width="1" height="3" fill="#228b22" />
        <rect x="8" y="2" width="1" height="2" fill="#32cd32" />
        <rect x="4" y="2" width="1" height="1" fill="#fff" opacity="0.6" />
      </svg>
    </div>
  );
}

function PixelChair({ col, row }) {
  return (
    <div style={{ position: "absolute", left: col*TILE + 6, top: row*TILE + 2, imageRendering: "pixelated", zIndex: row * 10 }}>
      <svg width="20" height="28" viewBox="0 0 10 14" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        <ellipse cx="5" cy="13" rx="3.5" ry="1" fill="rgba(0,0,0,0.3)" />
        <rect x="1.5" y="9" width="1" height="4" fill="#3a2210" />
        <rect x="7.5" y="9" width="1" height="4" fill="#3a2210" />
        <rect x="3" y="9" width="1" height="3" fill="#201008" />
        <rect x="6" y="9" width="1" height="3" fill="#201008" />
        <rect x="1" y="6" width="8" height="3" fill="#4a2a18" />
        <rect x="1" y="6" width="8" height="1" fill="#6a3a20" />
        <rect x="2" y="7" width="6" height="1.5" fill="#803030" />
        <rect x="1.5" y="1" width="1" height="5" fill="#3a2210" />
        <rect x="7.5" y="1" width="1" height="5" fill="#3a2210" />
        <rect x="2.5" y="1" width="5" height="2" fill="#4a2a18" />
        <rect x="3" y="1.5" width="4" height="1" fill="#803030" />
      </svg>
    </div>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================
export default function LibraryOverworld({ onGoToLab, onGoToNewsroom }) {
  const START = { col: 6, row: 5 };
  const [pos, setPos] = useState(START);
  const [facing, setFacing] = useState("down");
  const [stepping, setStepping] = useState(false);
  const [nearShelf, setNearShelf] = useState(null);
  const [openShelf, setOpenShelf] = useState(null);

  const [phase, setPhase] = useState("intro");
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicMuted, setMusicMuted] = useState(() => JSON.parse(localStorage.getItem("musicMuted") || "false"));
  const [musicVolume, setMusicVolume] = useState(() => parseFloat(localStorage.getItem("musicVolume") || "0.1"));
  const [speedMultiplier, setSpeedMultiplier] = useState(() => parseFloat(localStorage.getItem("speedMultiplier") || "1"));

  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const [tourIndex, setTourIndex] = useState(-1);
  const [arrived, setArrived] = useState(true);
  const [scale, setScale] = useState(1);
  const musicRef = useRef({ audioCtx: null, interval: null });

  // Web Audio Synth melody player callback
  const playStep = useCallback((stepIndex, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) {
        musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const progression = [
        [110.00, 130.81, 164.81, 196.00], // Am7
        [87.31, 130.81, 174.61, 261.63],  // Fmaj7
        [130.81, 164.81, 196.00, 246.94], // Cmaj7
        [98.00, 146.83, 196.00, 246.94]   // G7
      ];
      
      const chordIdx = Math.floor(stepIndex / 8) % progression.length;
      const stepIdx = stepIndex % 8;
      const chord = progression[chordIdx];
      const time = ctx.currentTime;
      
      // Bass on step 0 and 4
      if (stepIdx === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(chord[0], time);
        gain.gain.setValueAtTime(vol * 0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.8);
      } else if (stepIdx === 4) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(chord[1], time);
        gain.gain.setValueAtTime(vol * 0.10, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.6);
      }
      
      // Cozy 8-bit pluck arpeggio melody
      const pattern = [0, 1, 2, 3, 2, 1, 0, -1];
      const noteIdx = pattern[stepIdx];
      if (noteIdx !== -1) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        const f = chord[noteIdx] * (stepIdx > 4 ? 2 : 1.5);
        osc.frequency.setValueAtTime(f, time);
        gain.gain.setValueAtTime(vol * 0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.16);
      }
    } catch (e) {
      console.error("Audio synth error", e);
    }
  }, []);

  // Sync Audio interval
  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) {
        clearInterval(musicRef.current.interval);
        musicRef.current.interval = null;
      }
      return;
    }
    let step = 0;
    const ms = Math.round(240 / speedMultiplier);
    musicRef.current.interval = setInterval(() => {
      playStep(step, musicVolume, musicMuted);
      step++;
    }, ms);
    return () => {
      if (musicRef.current.interval) {
        clearInterval(musicRef.current.interval);
      }
    };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);
  const [shelves, setShelves] = useState(SHELF_LAYOUT.map(l => ({ ...l, label: "Loading...", count: 0, type: "normal", books: [] })));

  const containerRef = useRef(null);
  const moveTimerRef = useRef(0);
  const keysRef = useRef({});
  const lastMoveRef = useRef(0);
  const tourTimerRef = useRef(null);
  const arriveTimeoutRef = useRef(null);

  // ---- Fetch Live Goodreads Data ----
  useEffect(() => {
    async function fetchShelves() {
      try {
        const res = await fetch("/api/goodreads");
        if (!res.ok) throw new Error("API route failed or returned 404 in Vite");
        const data = await res.json();
        const merged = SHELF_LAYOUT.map(layout => {
          const apiData = data.find(d => d.id === layout.id) || { count: 0, books: [], label: layout.id, type: "normal" };
          return { ...layout, ...apiData };
        });
        setShelves(merged);
      } catch (err) {
        console.warn("Failed to fetch /api/goodreads. Falling back to static /goodreads.json for local Vite dev server.", err);
        try {
          const res = await fetch("/goodreads.json");
          const data = await res.json();
          const merged = SHELF_LAYOUT.map(layout => {
            const apiData = data.find(d => d.id === layout.id) || { count: 0, books: [], label: layout.id, type: "normal" };
            return { ...layout, ...apiData };
          });
          setShelves(merged);
        } catch (fallbackErr) {
          console.error("Fallback to /goodreads.json also failed.", fallbackErr);
        }
      }
    }
    fetchShelves();
  }, []);

  const introLine = "Welcome to my Library! I'm Saad Ibra. I've synced my Goodreads shelf here. Shall I show you around?";
  const outroLine = "That's the whole collection. Explore freely with the arrow keys or WASD.";
  const currentLine = phase === "intro" ? introLine
    : phase === "touring" ? (tourIndex >= 0 && tourIndex < SHELF_LAYOUT.length ? `[${shelves[tourIndex].label.toUpperCase()}]: ${SHELF_LAYOUT[tourIndex].line}` : outroLine)
    : "";
  const dialogueText = useTypewriter(phase !== "free" ? currentLine : "");

  const startTour = () => { setPhase("touring"); setTourIndex(0); setArrived(false); };
  const skipIntro = () => setPhase("free");
  const endTour = useCallback(() => { clearTimeout(arriveTimeoutRef.current); clearInterval(tourTimerRef.current); setPhase("free"); }, []);

  // ---- Check adjacency to shelves ----
  const checkNear = useCallback((col, row) => {
    for (const s of SHELF_LAYOUT) {
      const dc = Math.abs(s.col - col);
      const dr = Math.abs(s.row - row);
      if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
        setNearShelf(s.id);
        return;
      }
    }
    setNearShelf(null);
  }, []);

  // ---- Responsive Scaling ----
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const clientWidth = window.innerWidth;
      const clientHeight = window.innerHeight;
      const scaleX = clientWidth / INTERNAL_W;
      // Reserve 80px (unscaled) of height for the control bar to guarantee it fits
      const scaleY = clientHeight / (INTERNAL_H + 80);
      setScale(Math.min(scaleX, scaleY));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---- Keyboard & Audio Resume ----
  useEffect(() => {
    const resumeAudio = () => {
      if (!musicRef.current.audioCtx) {
        musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (musicRef.current.audioCtx.state === "suspended") {
        musicRef.current.audioCtx.resume();
      }
    };
    window.addEventListener("keydown", resumeAudio);
    window.addEventListener("click", resumeAudio);
    const down = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      if (phase === "intro") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setPhase("touring");
          setTourIndex(0);
          setArrived(false);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setPhase("free");
          return;
        }
      }
      if (phase === "touring" && (e.key === " " || e.key === "Enter" || e.key === "Escape")) {
        e.preventDefault();
        clearTimeout(arriveTimeoutRef.current);
        clearInterval(tourTimerRef.current);
        setPhase("free");
        return;
      }

      if (phase !== "free") return;
      if ((e.key === "Enter" || e.key === " ") && nearShelf) {
        e.preventDefault();
        setOpenShelf(nearShelf);
      }
      if (e.key === "Escape") setOpenShelf(null);
    };
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { 
      window.removeEventListener("keydown", down); 
      window.removeEventListener("keyup", up); 
      window.removeEventListener("keydown", resumeAudio);
      window.removeEventListener("click", resumeAudio);
    };
  }, [nearShelf, phase]);

  // ---- Grid movement tick (player input) ----
  useEffect(() => {
    if (phase !== "free" || openShelf) return;
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastMoveRef.current < (MOVE_COOLDOWN / speedMultiplier)) return;
      const k = keysRef.current;
      let dc = 0, dr = 0;
      if (k["arrowup"] || k["w"]) dr = -1;
      else if (k["arrowdown"] || k["s"]) dr = 1;
      else if (k["arrowleft"] || k["a"]) dc = -1;
      else if (k["arrowright"] || k["d"]) dc = 1;
      if (dc === 0 && dr === 0) { setStepping(false); return; }
      const dir = dr < 0 ? "up" : dr > 0 ? "down" : dc < 0 ? "left" : "right";
      setFacing(dir);
      setPos((p) => {
        const nc = p.col + dc;
        const nr = p.row + dr;
        if (canWalk(nc, nr)) {
          setStepping((s) => !s);
          lastMoveRef.current = now;
          checkNear(nc, nr);
          return { col: nc, row: nr };
        }
        return p;
      });
    }, 30);
    return () => clearInterval(id);
  }, [phase, openShelf, checkNear, speedMultiplier]);

  // ---- Tour auto-advance ----
  useEffect(() => {
    if (phase !== "touring" || !arrived) return;
    arriveTimeoutRef.current = setTimeout(() => {
      setTourIndex((i) => i + 1);
      setArrived(false);
    }, TOUR_PAUSE_MS / speedMultiplier);
    return () => clearTimeout(arriveTimeoutRef.current);
  }, [phase, arrived, speedMultiplier]);

  useEffect(() => {
    if (phase === "touring" && tourIndex >= SHELF_LAYOUT.length) {
      arriveTimeoutRef.current = setTimeout(() => setPhase("free"), TOUR_PAUSE_MS / speedMultiplier);
      return () => clearTimeout(arriveTimeoutRef.current);
    }
  }, [phase, tourIndex, speedMultiplier]);

  // ---- Tour pathfinding (BFS one-step-at-a-time) ----
  useEffect(() => {
    if (phase !== "touring" || arrived || tourIndex < 0 || tourIndex >= SHELF_LAYOUT.length) return;
    const target = SHELF_LAYOUT[tourIndex];
    const tc = target.tourCol, tr = target.tourRow;

    const moveOneStep = () => {
      setPos((p) => {
        if (p.col === tc && p.row === tr) {
          setArrived(true);
          setStepping(false);
          checkNear(p.col, p.row);
          return p;
        }
        // Simple greedy step toward target
        const dc = Math.sign(tc - p.col);
        const dr = Math.sign(tr - p.row);
        // Try horizontal first, then vertical
        if (dc !== 0 && canWalk(p.col + dc, p.row)) {
          setFacing(dc > 0 ? "right" : "left");
          setStepping((s) => !s);
          const np = { col: p.col + dc, row: p.row };
          checkNear(np.col, np.row);
          return np;
        }
        if (dr !== 0 && canWalk(p.col, p.row + dr)) {
          setFacing(dr > 0 ? "down" : "up");
          setStepping((s) => !s);
          const np = { col: p.col, row: p.row + dr };
          checkNear(np.col, np.row);
          return np;
        }
        // If blocked, try the other axis
        if (dr !== 0 && canWalk(p.col, p.row + dr)) {
          setFacing(dr > 0 ? "down" : "up");
          setStepping((s) => !s);
          return { col: p.col, row: p.row + dr };
        }
        if (dc !== 0 && canWalk(p.col + dc, p.row)) {
          setFacing(dc > 0 ? "right" : "left");
          setStepping((s) => !s);
          return { col: p.col + dc, row: p.row };
        }
        setArrived(true);
        return p;
      });
    };

    tourTimerRef.current = setInterval(moveOneStep, TOUR_MOVE_MS / speedMultiplier);
    return () => clearInterval(tourTimerRef.current);
  }, [phase, tourIndex, arrived, checkNear, speedMultiplier]);

  const activeShelf = shelves.find((s) => s.id === nearShelf);
  const modalShelf = shelves.find((s) => s.id === openShelf);
  const highlightedShelfId = phase === "touring" && tourIndex >= 0 && tourIndex < SHELF_LAYOUT.length
    ? SHELF_LAYOUT[tourIndex].id : nearShelf;

  // ---- Camera: center on player ----
  const camX = pos.col * TILE + TILE / 2 - INTERNAL_W / 2;
  const camY = pos.row * TILE + TILE / 2 - INTERNAL_H / 2;
  const transitionTime = (0.14 / speedMultiplier).toFixed(2);

  return (
    <div ref={containerRef} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#05050a", overflow: "hidden", margin: 0, padding: 0,
      fontFamily: "'Press Start 2P', monospace", color: "#f4e8d0",
      userSelect: "none",
    }}>
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden; background: #05050a; }
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes shelfPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes lanternFlicker { 0%{opacity:0.8; transform: scale(0.95)} 100%{opacity:1; transform: scale(1.05)} }
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .retro-scrollbar::-webkit-scrollbar { width: 12px; }
        .retro-scrollbar::-webkit-scrollbar-track { background: #0a0a18; border-left: 2px solid #1a1a28; }
        .retro-scrollbar::-webkit-scrollbar-thumb { background: #f4e8d0; border: 2px solid #1a1a28; border-radius: 0; }
        .retro-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
      `}</style>

      {/* Outer wrapper scales both game and UI perfectly */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: `scale(${scale})`, transformOrigin: "center",
        imageRendering: "pixelated",
      }}>
        {/* Scaled Game Container (4:3) */}
        <div style={{
          position: "relative", width: INTERNAL_W, height: INTERNAL_H,
          overflow: "hidden", background: "#000",
          boxShadow: "0 0 0 4px #1a1a28, 0 8px 32px rgba(0,0,0,0.8)",
          imageRendering: "pixelated",
        }}>
          {/* World container - moves opposite to camera */}
          <div style={{
            position: "absolute",
            width: MAP_COLS * TILE, height: MAP_ROWS * TILE,
            left: -camX, top: -camY,
            transition: `left ${transitionTime}s linear, top ${transitionTime}s linear`,
          }}>
            {/* Render tiles */}
            {MAP.map((row, r) => row.map((tile, c) => {
              if (tile === 0) return null;
              
              let bg = "none";
              let boxS = "none";
              
              if (tile === 2) {
                // Victorian striped wallpaper
                bg = "repeating-linear-gradient(90deg, #3a1c22, #3a1c22 4px, #422026 4px, #422026 8px)";
                // Wooden baseboard and shadow
                boxS = "inset 0 -3px 0 #201008, inset 0 -4px 0 #3a1a10, inset 0 -8px 8px rgba(0,0,0,0.5)";
              } else if (tile === 3) {
                // Subtle dark carpet
                bg = "#4c2828";
                boxS = "inset 0 0 0 1px #3a1a1a, inset 2px 2px 4px rgba(0,0,0,0.3)";
              } else if (tile === 1) {
                // Hardwood floor planks
                bg = (r + c) % 2 === 0 ? "#4a3320" : "#422a18";
                boxS = "inset 0 0 0 1px rgba(0,0,0,0.2)";
              }

              return (
                <div key={`${r}-${c}`} style={{
                  position: "absolute", left: c * TILE, top: r * TILE,
                  width: TILE, height: TILE, background: bg,
                  boxShadow: boxS,
                }} />
              );
            }))}

            {/* Wall trim on row=1 (wall tiles) */}
            {MAP[1] && MAP[1].map((t, c) => t === 2 ? (
              <div key={`wt${c}`} style={{ position: "absolute", left: c*TILE, top: 1*TILE+TILE-4, width: TILE, height: 4, background: "#6b4a2e" }}>
                <div style={{ height: 2, background: "#8a6a42" }} />
              </div>
            ) : null)}
            {MAP[8] && MAP[8].map((t, c) => t === 2 ? (
              <div key={`wt2${c}`} style={{ position: "absolute", left: c*TILE, top: 8*TILE+TILE-4, width: TILE, height: 4, background: "#6b4a2e" }}>
                <div style={{ height: 2, background: "#8a6a42" }} />
              </div>
            ) : null)}

            {/* Window on back wall */}
            <div style={{
              position: "absolute", left: 5*TILE, top: 1*TILE,
              width: TILE*2, height: TILE-4,
              background: "#182848", border: "2px solid #6b4a2e",
              boxShadow: "inset 0 0 12px rgba(80,120,200,0.3)",
            }}>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#6b4a2e", transform: "translateX(-50%)" }} />
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#6b4a2e", transform: "translateY(-50%)" }} />
              <div style={{ position: "absolute", left: 6, top: 4, width: 2, height: 2, background: "#fff", opacity: 0.8 }} />
              <div style={{ position: "absolute", right: 8, top: 6, width: 2, height: 2, background: "#fff", opacity: 0.6 }} />
              <div style={{ position: "absolute", right: 4, top: 14, width: 6, height: 6, borderRadius: "50%", background: "#e8e0c0", boxShadow: "0 0 4px rgba(232,224,192,0.4)" }} />
            </div>

            {/* Decorations */}
            <PixelLantern col={1} row={1} />
            <PixelLantern col={11} row={1} />
            <PixelLantern col={17} row={8} />
            <WallBookcase col={3} row={1} />
            <WallBookcase col={9} row={1} flip />
            <WallBookcase col={14} row={8} />
            <ReadingDesk col={10} row={3} />
            <PixelGlobe col={5} row={7} />
            <PixelChair col={3} row={8} />

            {/* Shelves */}
            {shelves.map((s) => (
              <PixelShelf
                key={s.id}
                shelf={s}
                isNear={highlightedShelfId === s.id}
                onClick={() => { if (phase === "free") setOpenShelf(s.id); }}
              />
            ))}

            {/* Player - always at grid position */}
             <div style={{
              position: "absolute",
              left: pos.col * TILE, top: pos.row * TILE,
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
              transition: `left ${transitionTime}s linear, top ${transitionTime}s linear`,
            }}>
              <PlayerSprite direction={facing} stepping={stepping} />
            </div>

            {/* Vignette on world */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)",
            }} />
          </div>

          {/* CRT scanlines over viewport */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 600,
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
          }} />

          {/* Lab navigation button */}
          {onGoToLab && (
            <button
              onClick={onGoToLab}
              style={{
                position: "absolute", top: 8, right: 8,
                fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                background: "#009688", color: "#fff", border: "2px solid #f4e8d0",
                padding: "4px 8px", cursor: "pointer", borderRadius: 2, zIndex: 650,
                imageRendering: "pixelated", boxShadow: "0 2px 0 #00695c",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                LAB <ArrowRight size={6} strokeWidth={3} />
              </div>
            </button>
          )}

          {/* Newsroom navigation button */}
          {onGoToNewsroom && (
            <button
              onClick={onGoToNewsroom}
              style={{
                position: "absolute", top: 8, right: onGoToLab ? 68 : 8,
                fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                background: "#2a3036", color: "#eef7f2", border: "2px solid #eef7f2",
                padding: "4px 8px", cursor: "pointer", borderRadius: 2, zIndex: 650,
                imageRendering: "pixelated", boxShadow: "0 2px 0 #181a1c",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                PRESS <Newspaper size={6} strokeWidth={3} />
              </div>
            </button>
          )}

          {/* Proximity prompt */}
          {phase === "free" && activeShelf && !openShelf && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              padding: "4px 8px",
              background: "rgba(10,10,20,0.85)", border: "2px solid #f4e8d0", borderRadius: 4,
              zIndex: 650, pointerEvents: "none", display: "flex", gap: 8, alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.6)"
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 6, color: TYPE_COLORS[activeShelf.type].light }}>
                {getShelfIcon(activeShelf.id, 8)}
                <span>{activeShelf.label.toUpperCase()}</span>
              </div>
              <div style={{
                fontSize: 5, color: "#ffbaba", background: "rgba(0,0,0,0.4)",
                padding: "2px 4px", borderRadius: 2
              }}>SPACE</div>
            </div>
          )}

          {/* Guide dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", bottom: 8, left: 8, right: 8,
              padding: "18px 14px 10px",
              background: "rgba(10,10,20,0.94)", border: "2px solid #f4e8d0", borderRadius: 2,
              boxShadow: "inset 0 0 0 2px rgba(10,10,20,0.94), inset 0 0 0 4px #888",
              zIndex: 650,
            }}>
              <div style={{ position: "absolute", top: -12, left: 10, background: "#1a1a28", border: "2px solid #f4e8d0", padding: "2px 8px", fontSize: 7, color: "#f8d878", borderRadius: 2 }}>SAAD IBRA</div>
              <div style={{ fontSize: 9, lineHeight: 2.2, minHeight: 32, color: "#f4e8d0" }}>
                {dialogueText}
                <span style={{ opacity: dialogueText.length < currentLine.length ? 1 : 0, animation: "dialogBlink 0.5s step-end infinite" }}>▊</span>
              </div>
              {phase === "intro" && dialogueText.length >= currentLine.length && (
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={startTour} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, background: "#e04040", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 2, cursor: "pointer", boxShadow: "0 3px 0 #a02020, inset 0 1px 0 rgba(255,255,255,0.2)", imageRendering: "pixelated", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 5, color: "#ffbaba", marginRight: 8, background: "rgba(0,0,0,0.2)", padding: "2px 4px", borderRadius: 2 }}>SPACE</span>
                    SHOW ME AROUND
                  </button>
                  <button onClick={skipIntro} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, background: "transparent", color: "#a8a8b8", border: "2px solid #a8a8b8", padding: "6px 12px", borderRadius: 2, cursor: "pointer", imageRendering: "pixelated", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 5, color: "#888", marginRight: 8, border: "1px solid #888", padding: "1px 3px", borderRadius: 2 }}>ESC</span>
                    I'LL EXPLORE
                  </button>
                </div>
              )}
              {phase === "touring" && (
                <button onClick={endTour} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, background: "transparent", color: "#888", border: "none", padding: "6px 0 0", cursor: "pointer", textDecoration: "underline", imageRendering: "pixelated", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 4, color: "#666", marginRight: 4, border: "1px solid #666", padding: "1px 2px", borderRadius: 2 }}>ESC</span>
                  skip tour &gt;
                </button>
              )}
              {phase === "touring" && dialogueText.length >= currentLine.length && (
                <div style={{ position: "absolute", right: 12, bottom: 8, fontSize: 10, animation: "dialogBlink 0.8s step-end infinite", color: "#f4e8d0" }}>v</div>
              )}
            </div>
          )}

          {/* Modal */}
          {modalShelf && (
            <div onClick={() => setOpenShelf(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 700, imageRendering: "pixelated" }}>
              <div className="retro-scrollbar" onClick={(e) => e.stopPropagation()} style={{ background: "#1a1a28", border: "4px solid #f4e8d0", borderRadius: 2, width: 340, maxWidth: "95%", maxHeight: "90%", overflowY: "auto", overflowX: "hidden", boxShadow: "0 0 0 2px #1a1a28, 0 0 0 6px #888, 0 10px 30px rgba(0,0,0,0.8)" }}>
                <div style={{ padding: "8px 12px", background: TYPE_COLORS[modalShelf.type].primary, borderBottom: `3px solid ${TYPE_COLORS[modalShelf.type].dark}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
                  <div style={{ fontSize: 7, color: "#fff", textShadow: `1px 1px 0 ${TYPE_COLORS[modalShelf.type].dark}`, display: "flex", alignItems: "center", gap: 6 }}>
                    {getShelfIcon(modalShelf.id, 10)} {modalShelf.label.toUpperCase()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 6, color: "#fff", opacity: 0.8, background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 2 }}>{modalShelf.count} BOOK{modalShelf.count === 1 ? "" : "S"}</div>
                    <button onClick={() => setOpenShelf(null)} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 6, background: "#d04040", color: "#fff", border: "2px solid #f4e8d0", padding: "2px 4px", borderRadius: 2, cursor: "pointer", boxShadow: "0 2px 0 #802020", imageRendering: "pixelated", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Close">X</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: 8 }}>
                  {modalShelf.books.map((b, i) => <PixelBookCover key={i} book={b} typeColors={TYPE_COLORS[modalShelf.type]} />)}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* ── CONTROL BAR ── */}
        <ControlBar
          width={INTERNAL_W}
          musicPlaying={musicPlaying}
          musicMuted={musicMuted}
          musicVolume={musicVolume}
          speedMultiplier={speedMultiplier}
          onTogglePlay={() => musicPlaying ? setMusicMuted(!musicMuted) : setMusicPlaying(true)}
          onChangeVolume={setMusicVolume}
          onChangeSpeed={setSpeedMultiplier}
        />
      </div>
    </div>
  );
}
