"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Library, BookOpen, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import ControlBar from "../components/ui/ControlBar";
import PlayerSprite from "../components/sprites/PlayerSprite";
import ExitDoor from "../components/sprites/ExitDoor";
import { TILE } from '../engine/constants';
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { playWoodStep } from "../engine/sfx";
import { MAP, MAP_COLS, MAP_ROWS, SHELF_LAYOUT, SHELF_TILES, DECOR_TILES, TOUR_MOVE_MS, TOUR_PAUSE_MS, TYPE_COLORS, BOOK_SPINE_PALETTES, START_POS, EXIT_DOOR_COL, EXIT_DOOR_ROW } from "../data/library";

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

function isWalkable(col, row) {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
  const t = MAP[row][col];
  return t === 1 || t === 3;
}

function canWalk(col, row) {
  const coord = `${col},${row}`;
  if (SHELF_TILES.has(coord) || DECOR_TILES.has(coord)) return false;
  return isWalkable(col, row);
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
function useTypewriter(text, skip, speed = 28) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    if (skip) {
      setShown(text);
      return;
    }
    let i = 0;
    const id = setInterval(() => { 
      i++; 
      setShown(text.slice(0, i)); 
      if (i >= text.length) clearInterval(id); 
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, skip]);

  useEffect(() => {
    if (skip && text) setShown(text);
  }, [skip, text]);

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
export default function LibraryScene({ isLandscape, onBackToVillage , speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume  }) {
  const [nearShelf, setNearShelf] = useState(null);
  const [openShelf, setOpenShelf] = useState(null);

  const [phase, setPhase] = useState("intro");
        
  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const [tourIndex, setTourIndex] = useState(-1);
  const [arrived, setArrived] = useState(true);
  const [scale, setScale] = useState(1);
  const [internalW, setInternalW] = useState(384);
  const [internalH, setInternalH] = useState(288);
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
  const [skipTyping, setSkipTyping] = useState(false);
  const dialogueText = useTypewriter(phase !== "free" ? currentLine : "", skipTyping);

  useEffect(() => { setSkipTyping(false); }, [currentLine, phase]);

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

  const { pos, setPos, facing, stepping } = usePlayerMovement({
    initialPos: START_POS,
    canWalk: (c, r) => {
      if (c === EXIT_DOOR_COL && r === EXIT_DOOR_ROW) { onBackToVillage(); return false; }
      return canWalk(c, r);
    },
    speedMultiplier,
    isActive: phase === "free" && !openShelf,
    onMove: (c, r) => { checkNear(c, r); playWoodStep(); return false; },
    onAction: () => { if (nearShelf) setOpenShelf(nearShelf); },
    onCancel: () => setOpenShelf(null)
  });

  // ---- Responsive Scaling ----
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
      const availableHeight = window.innerHeight - consoleHeight;
      const baseW = 384;
      const baseH = 288;
      const newScale = Math.max(1, Math.floor(Math.min(window.innerWidth / baseW, availableHeight / baseH)));
      setInternalW(Math.floor(window.innerWidth / newScale));
      setInternalH(Math.floor(availableHeight / newScale));
      setScale(newScale);
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
    window.addEventListener("touchstart", resumeAudio);
    window.addEventListener("pointerdown", resumeAudio);
    const down = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      // Allow movement keys to exit intro/tour mode
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        if (phase === "intro" || phase === "touring") {
          e.preventDefault();
          clearTimeout(arriveTimeoutRef.current);
          clearInterval(tourTimerRef.current);
          setPhase("free");
          return;
        }
      }

      if (phase === "intro") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (dialogueText.length < introLine.length) {
            setSkipTyping(true);
            return;
          }
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
        if (e.key !== "Escape" && dialogueText.length < currentLine.length) {
          setSkipTyping(true);
          return;
        }
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
      window.removeEventListener("touchstart", resumeAudio);
      window.removeEventListener("pointerdown", resumeAudio);
    };
  }, [nearShelf, phase]);


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

    if (pos.col === tc && pos.row === tr) {
      setArrived(true);
      setStepping(false);
      if (target.id === "did-not-finish") {
        setFacing("up");
      } else {
        setFacing("up"); // default facing when reading shelf
      }
      checkNear(pos.col, pos.row);
      return;
    }

    const timer = setTimeout(() => {
      // Simple greedy step toward target
      const dc = Math.sign(tc - pos.col);
      const dr = Math.sign(tr - pos.row);
      
      let nc = pos.col, nr = pos.row;
      let moved = false;
      let newFacing = facing;

      // Try horizontal first, then vertical
      if (dc !== 0 && canWalk(pos.col + dc, pos.row)) {
        nc += dc;
        newFacing = dc > 0 ? "right" : "left";
        moved = true;
      } else if (dr !== 0 && canWalk(pos.col, pos.row + dr)) {
        nr += dr;
        newFacing = dr > 0 ? "down" : "up";
        moved = true;
      }

      if (moved) {
        setFacing(newFacing);
        setStepping(s => !s);
        setPos({ col: nc, row: nr });
        checkNear(nc, nr);
      } else {
        setArrived(true);
      }
    }, TOUR_MOVE_MS / speedMultiplier);

    return () => clearTimeout(timer);
  }, [phase, tourIndex, arrived, pos, speedMultiplier]);

  const activeShelf = shelves.find((s) => s.id === nearShelf);
  const modalShelf = shelves.find((s) => s.id === openShelf);
  const highlightedShelfId = phase === "touring" && tourIndex >= 0 && tourIndex < SHELF_LAYOUT.length
    ? SHELF_LAYOUT[tourIndex].id : nearShelf;

  // ---- Camera: center on player ----
  const rawCamX = pos.col * TILE + TILE / 2 - internalW / 2;
  const rawCamY = pos.row * TILE + TILE / 2 - internalH / 2;
  const camX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - internalW), rawCamX));
  const camY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - internalH), rawCamY));
  
  const transitionTime = (0.14 / speedMultiplier).toFixed(2);

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#05050a", overflow: "hidden", margin: 0, padding: 0,
      fontFamily: "'Press Start 2P', monospace", color: "#f4e8d0", userSelect: "none",
      
      boxSizing: "border-box", height: "100dvh", width: "100dvw", }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
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
          position: "relative", width: internalW, height: internalH,
          overflow: "hidden", background: "#000",
          boxShadow: "inset 0 0 8px rgba(0,0,0,0.8)",
          imageRendering: "pixelated",
        }}>
          {/* World container - moves opposite to camera */}
          <div style={{
            position: "absolute",
            width: MAP_COLS * TILE, height: MAP_ROWS * TILE,
            left: -camX, top: -camY,
            
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

            {/* Exit Door */}
            <ExitDoor col={EXIT_DOOR_COL} row={EXIT_DOOR_ROW} />

            {/* Player - always at grid position */}
             <div style={{
              position: "absolute",
              left: pos.col * TILE, top: pos.row * TILE,
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
              
            }}>
              <PlayerSprite direction={facing} stepping={stepping} costume="casual" />
            </div>

            {/* Vignette on world */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)",
            }} />
          </div>

          <button onClick={onBackToVillage} style={{
            position: "absolute", top: 8, left: 8,
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            background: "#1a2b1a", color: "#eef7f2", border: "2px solid #eef7f2",
            padding: "4px 8px", cursor: "pointer", borderRadius: 2, zIndex: 500,
            boxShadow: "0 2px 0 #060e08",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={6} strokeWidth={3} /> VILLAGE
            </div>
          </button>

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
      </div>

      {/* ── CONTROL BAR ── */}
      <ControlBar
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
