"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowLeft, Newspaper, FileText, Clock, Hash, X, ExternalLink, Phone, Briefcase, MessageCircle } from "lucide-react";

import { TILE, INTERNAL_W, INTERNAL_H, MOVE_COOLDOWN } from '../engine/constants';
import PlayerSprite from '../components/sprites/PlayerSprite';
import ControlBar from '../components/ui/ControlBar';
import ExitDoor from '../components/sprites/ExitDoor';
import { BLOG_POSTS } from '../data/posts';

// ============================================================
//  DYNAMIC NEWSROOM LAYOUT GENERATOR
// ============================================================
function generateNewsroomLayout(posts) {
  const count = posts.length;

  const roomWidth = 14; 
  // Room grows vertically: 2 rows per post + base room
  const baseHeight = 8;
  const extraRows = Math.max(0, (count - 1) * 2);
  const totalRows = baseHeight + extraRows;
  const totalCols = roomWidth;

  // Build tile map
  const map = Array.from({ length: totalRows }, () => Array(totalCols).fill(0));

  // Top wall (row 1)
  for (let c = 1; c < totalCols - 1; c++) map[1][c] = 2; // Standard office wall
  // Left wall gets a giant corkboard texture
  for (let r = 2; r < totalRows - 1; r++) map[r][1] = 4; // Corkboard wall
  
  // Floor
  for (let r = 2; r < totalRows - 1; r++)
    for (let c = 2; c < totalCols - 1; c++) map[r][c] = 1;
  // Desks/drafting area (carpet)
  for (let r = 3; r < totalRows - 2; r++)
    for (let c = 4; c < totalCols - 3; c++)
      if (map[r][c] === 1) map[r][c] = 3;

  // Place articles on the corkboard wall — newest at top (row 2), each 2 rows apart
  const articles = posts.map((post, i) => ({
    id: post.id,
    col: 1, // On the left wall
    row: 2 + i * 2,
    label: post.title.length > 22 ? post.title.slice(0, 20) + "…" : post.title,
    post,
  }));

  // Printing press tiles
  const pressTiles = new Set(["7,2", "8,2", "9,2", "10,2"]);
  const articleTiles = new Set(articles.map(r => `${r.col},${r.row}`));
  
  // Desk Telephone (Tip Line) location
  const phonePos = { col: 12, row: 4 };
  const phoneTiles = new Set([`${phonePos.col},${phonePos.row}`]);

  const startPos = { col: Math.floor(totalCols / 2), row: Math.min(4, totalRows - 3) };

  return { map, totalCols, totalRows, articles, articleTiles, pressTiles, phoneTiles, phonePos, startPos };
}

function isLayoutWalkable(layout, col, row) {
  if (row < 0 || row >= layout.totalRows || col < 0 || col >= layout.totalCols) return false;
  const t = layout.map[row][col];
  return t === 1 || t === 3;
}
function canLayoutWalk(layout, col, row) {
  const coord = `${col},${row}`;
  if (layout.articleTiles.has(coord) || layout.pressTiles.has(coord) || layout.phoneTiles.has(coord)) return false;
  return isLayoutWalkable(layout, col, row);
}

// ============================================================
//  PIXEL ARTICLE — pinned to the corkboard
// ============================================================
function PixelArticle({ article, isNear, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: article.col * TILE,
        top: article.row * TILE - 8,
        width: TILE, height: TILE + 8,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        cursor: "pointer",
        filter: active
          ? "brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.8))"
          : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
        transition: "filter 0.15s",
        zIndex: article.row * 10,
      }}
    >
      <svg width="32" height="40" viewBox="0 0 16 20" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        {/* Paper */}
        <rect x="3" y="6" width="10" height="12" fill="#eef7f2" />
        <rect x="2" y="7" width="12" height="10" fill="#eef7f2" />
        {/* Header/Photo */}
        <rect x="4" y="8" width="8" height="3" fill="#889098" />
        {/* Text lines */}
        <rect x="4" y="12" width="8" height="1" fill="#222" />
        <rect x="4" y="14" width="8" height="1" fill="#222" />
        <rect x="4" y="16" width="6" height="1" fill="#222" />
        {/* Pin */}
        <circle cx="8" cy="5.5" r="1.5" fill="#c03030" />
      </svg>
    </div>
  );
}

// ============================================================
//  PRINTING PRESS — top wall decor
// ============================================================
function PrintingPress({ col }) {
  return (
    <div style={{
      position: "absolute",
      left: col * TILE, top: 2 * TILE - 16,
      width: 4 * TILE, height: TILE + 16,
      zIndex: 25,
    }}>
      <svg width={4 * TILE} height={TILE + 16} viewBox="0 0 64 48" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        {/* Main machine body */}
        <rect x="0" y="20" width="64" height="20" rx="2" fill="#586068" />
        <rect x="0" y="24" width="64" height="12" fill="#404850" />
        {/* Large rollers */}
        <circle cx="16" cy="16" r="8" fill="#2a3036" />
        <circle cx="16" cy="16" r="6" fill="#181a1c" />
        <circle cx="48" cy="16" r="8" fill="#2a3036" />
        <circle cx="48" cy="16" r="6" fill="#181a1c" />
        <rect x="12" y="16" width="40" height="4" fill="#eef7f2" /> {/* paper feeding through */}
        {/* Control panel */}
        <rect x="24" y="28" width="16" height="8" rx="1" fill="#2a3036" />
        <rect x="26" y="30" width="3" height="2" fill="#40a040" />
        <rect x="30" y="30" width="3" height="2" fill="#c03030" />
        <rect x="34" y="30" width="4" height="2" fill="#e8c888" />
        {/* Base legs */}
        <rect x="4" y="40" width="8" height="6" fill="#2a3036" />
        <rect x="52" y="40" width="8" height="6" fill="#2a3036" />
      </svg>
    </div>
  );
}

// ============================================================
//  DESK TELEPHONE (Tip Line) — interactable
// ============================================================
function TipLinePhone({ col, row, isNear, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: col * TILE,
        top: row * TILE - 4,
        width: TILE, height: TILE,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        cursor: "pointer",
        filter: active
          ? "brightness(1.2) drop-shadow(0 0 8px rgba(0,180,255,0.6))"
          : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
        transition: "filter 0.15s",
        zIndex: row * 10,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 16 16" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        {/* Small desk/table for the phone */}
        <rect x="2" y="8" width="12" height="4" fill="#8b4513" />
        <rect x="4" y="12" width="2" height="4" fill="#5a2d0a" />
        <rect x="10" y="12" width="2" height="4" fill="#5a2d0a" />
        {/* Phone base */}
        <rect x="4" y="4" width="8" height="4" rx="1" fill="#c03030" />
        <rect x="5" y="4" width="6" height="3" fill="#a02020" />
        {/* Rotary dial / buttons */}
        <circle cx="8" cy="6" r="1.5" fill="#eef7f2" />
        {/* Handset */}
        <rect x="3" y="1" width="10" height="2" rx="1" fill="#c03030" />
        <rect x="2" y="1" width="3" height="3" rx="1" fill="#a02020" />
        <rect x="11" y="1" width="3" height="3" rx="1" fill="#a02020" />
      </svg>
    </div>
  );
}


// ============================================================
//  MAIN NEWSROOM COMPONENT
// ============================================================
export default function NewsroomScene({ onBackToVillage }) {
  const layout = useMemo(() => generateNewsroomLayout(BLOG_POSTS), []);
  const layoutRef = useRef(layout);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  const [pos, setPos]               = useState(() => layout.startPos);
  const [facing, setFacing]         = useState("left");
  const [stepping, setStepping]     = useState(false);
  const [nearObject, setNearObject] = useState(null); // ID of article or 'phone'
  const [openPost, setOpenPost]     = useState(null);
  const [openTipLine, setOpenTipLine] = useState(false);
  const [phase, setPhase]           = useState("intro");
  const [scale, setScale]           = useState(1);

  const [speedMultiplier, setSpeedMultiplier] = useState(() => parseFloat(localStorage.getItem("speedMultiplier") || "1"));
  const [musicPlaying, setMusicPlaying]       = useState(true);
  const [musicMuted, setMusicMuted]           = useState(() => JSON.parse(localStorage.getItem("musicMuted") || "false"));
  const [musicVolume, setMusicVolume]         = useState(() => parseFloat(localStorage.getItem("musicVolume") || "0.1"));

  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const musicRef     = useRef({ audioCtx: null, interval: null });
  const containerRef = useRef(null);
  const keysRef      = useRef({});
  const lastMoveRef  = useRef(0);

  // ---- Synth engine — driving 80s investigative synth ----
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx)
        musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      // Driving bassline in Am
      const baseNote = 110; // A2
      const t = ctx.currentTime;
      const si = idx % 16;

      // Pumping bass on every 8th note
      const bass = ctx.createOscillator(), bG = ctx.createGain();
      bass.type = "sawtooth";
      // Slight octave jumps for that 80s feel
      let bf = baseNote;
      if (si % 8 === 6 || si % 8 === 7) bf = baseNote * 1.5; // E3
      
      // Filter for the bass (plucky)
      const bFilter = ctx.createBiquadFilter();
      bFilter.type = "lowpass";
      bFilter.frequency.setValueAtTime(800, t);
      bFilter.frequency.exponentialRampToValueAtTime(100, t + 0.1);

      bass.frequency.setValueAtTime(bf, t);
      bG.gain.setValueAtTime(vol * 0.15, t);
      bG.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      
      bass.connect(bFilter); bFilter.connect(bG); bG.connect(ctx.destination);
      bass.start(t); bass.stop(t + 0.12);

      // Typewriter clicks / Snare on 2 and 4 (beats 4 and 12 in 16-step)
      if (si === 4 || si === 12 || si === 15) {
        const bufSize = ctx.sampleRate * 0.05;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = "highpass";
        nFilter.frequency.value = 2000;

        const nG = ctx.createGain();
        let nVol = si === 15 ? vol * 0.05 : vol * 0.12; // quieter ghost note at end
        nG.gain.setValueAtTime(nVol, t);
        nG.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        
        noise.connect(nFilter); nFilter.connect(nG); nG.connect(ctx.destination);
        noise.start(t); noise.stop(t + 0.05);
      }
      
      // Tension arpeggio (high notes)
      if (si % 4 === 2) {
        const arp = ctx.createOscillator(), aG = ctx.createGain();
        arp.type = "square";
        arp.frequency.setValueAtTime(baseNote * 4, t); // A4
        aG.gain.setValueAtTime(vol * 0.05, t);
        aG.gain.exponentialRampToValueAtTime(0.005, t + 0.2);
        arp.connect(aG); aG.connect(ctx.destination);
        arp.start(t); arp.stop(t + 0.25);
      }

    } catch (_) {}
  }, []);

  // Music loop
  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(130 / speedMultiplier); // faster tempo for urgency
    musicRef.current.interval = setInterval(() => {
      playStep(step++, musicVolume, musicMuted);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);

  // ---- Responsive scale ----
  useEffect(() => {
    const resize = () => setScale(Math.min(
      window.innerWidth / INTERNAL_W,
      window.innerHeight / (INTERNAL_H + 80)
    ));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ---- Proximity detection ----
  const checkNear = useCallback((col, row) => {
    for (const r of layoutRef.current.articles) {
      const dc = Math.abs(r.col - col), dr = Math.abs(r.row - row);
      if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
        setNearObject(r.id);
        return;
      }
    }
    const { phonePos } = layoutRef.current;
    const dc = Math.abs(phonePos.col - col), dr = Math.abs(phonePos.row - row);
    if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
      setNearObject("phone");
      return;
    }
    
    setNearObject(null);
  }, []);

  // ---- Keyboard & Audio Resume ----
  useEffect(() => {
    const resume = () => {
      if (!musicRef.current.audioCtx)
        musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (musicRef.current.audioCtx.state === "suspended")
        musicRef.current.audioCtx.resume();
    };
    window.addEventListener("keydown", resume);
    window.addEventListener("click", resume);

    const onDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;

      if (phase === "intro" && (e.key === " " || e.key === "Enter" || e.key === "Escape")) {
        e.preventDefault();
        setPhase("free");
        return;
      }

      if (phase !== "free") return;
      if ((e.key === " " || e.key === "Enter") && nearObject) {
        e.preventDefault();
        if (nearObject === "phone") {
          setOpenTipLine(true);
        } else {
          const rec = layoutRef.current.articles.find(r => r.id === nearObject);
          if (rec) setOpenPost(rec.post);
        }
      }
      if (e.key === "Escape") {
        setOpenPost(null);
        setOpenTipLine(false);
      }
    };
    const onUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("click", resume);
    };
  }, [nearObject, phase]);

  // ---- Movement loop ----
  useEffect(() => {
    if (phase !== "free" || openPost || openTipLine) return;
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastMoveRef.current < MOVE_COOLDOWN / speedMultiplier) return;
      const k = keysRef.current;
      let dc = 0, dr = 0, nf = facing;
      if      (k.w || k.arrowup)    { dr = -1; nf = "up";    }
      else if (k.s || k.arrowdown)  { dr =  1; nf = "down";  }
      else if (k.a || k.arrowleft)  { dc = -1; nf = "left";  }
      else if (k.d || k.arrowright) { dc =  1; nf = "right"; }
      if (dc !== 0 || dr !== 0) {
        setFacing(nf);
        const tc = pos.col + dc, tr = pos.row + dr;
        
        // Exit Door check
        if (tc === 3 && tr === 1) {
          onBackToVillage();
          return;
        }

        if (canLayoutWalk(layoutRef.current, tc, tr)) {
          setPos({ col: tc, row: tr });
          setStepping(true);
          lastMoveRef.current = now;
          checkNear(tc, tr);
          setTimeout(() => setStepping(false), 90);
        }
      }
    }, 30);
    return () => clearInterval(id);
  }, [pos, facing, phase, openPost, openTipLine, speedMultiplier, checkNear]);

  // ---- Camera (clamped to world bounds) ----
  const rawCamX = pos.col * TILE + TILE / 2 - INTERNAL_W / 2;
  const rawCamY = pos.row * TILE + TILE / 2 - INTERNAL_H / 2;
  const camX = Math.max(0, Math.min(Math.max(0, layout.totalCols * TILE - INTERNAL_W), rawCamX));
  const camY = Math.max(0, Math.min(Math.max(0, layout.totalRows * TILE - INTERNAL_H), rawCamY));
  const tt = (0.14 / speedMultiplier).toFixed(2);

  const activeArticle = layout.articles.find(r => r.id === nearObject);
  const introLine = `Welcome to the Editorial Office. Hot off the presses. Walk up to the bulletin board and press SPACE to read.`;

  // ---- Render ----
  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#080c10", overflow: "hidden",
      fontFamily: "'Press Start 2P', monospace", userSelect: "none",
    }}>
      <style>{`
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .news-scroll::-webkit-scrollbar { width:12px; background: #fff; border-left: 2px solid #000; }
        .news-scroll::-webkit-scrollbar-thumb { background: #000; border: 2px solid #fff; }
        
        .contact-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: #fff; color: #000; border: 2px solid #000;
          padding: 10px; text-decoration: none; font-size: 6px; font-weight: bold;
          transition: transform 0.1s;
        }
        .contact-btn:hover { background: #000; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 0 rgba(0,0,0,0.5); }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: `scale(${scale})`, transformOrigin: "center",
        imageRendering: "pixelated",
      }}>

        {/* ── GAME VIEWPORT ── */}
        <div style={{
          position: "relative", width: INTERNAL_W, height: INTERNAL_H,
          overflow: "hidden", background: "#1a1e24",
          boxShadow: "0 0 0 4px #2a3036, 0 8px 32px rgba(0,0,0,0.9)",
          imageRendering: "pixelated",
        }}>

          {/* Scrolling world */}
          <div style={{
            position: "absolute",
            width: layout.totalCols * TILE, height: layout.totalRows * TILE,
            left: -camX, top: -camY,
            transition: `left ${tt}s linear, top ${tt}s linear`,
          }}>

            {/* Tile layer */}
            {layout.map.map((row, r) => row.map((tile, c) => {
              if (tile === 0) return null;
              let bg, bx = "none";
              if (tile === 2) {
                // Top Wall (Concrete/Office)
                bg = "repeating-linear-gradient(90deg,#4a545e,#4a545e 4px,#586068 4px,#586068 8px)";
                bx = "inset 0 -3px 0 #2a3036, inset 0 -8px 8px rgba(0,0,0,0.5)";
              } else if (tile === 4) {
                // Left Wall (Corkboard)
                bg = "repeating-linear-gradient(45deg,#8a6442,#8a6442 2px,#9a7452 2px,#9a7452 4px)";
                bx = "inset -3px 0 0 #5a3c24, inset 0 -8px 8px rgba(0,0,0,0.5)";
              } else if (tile === 3) {
                // Drafting Carpet
                bg = "#2a3a4a";
                bx = "inset 0 0 0 1px #1a2a3a";
              } else {
                // Linoleum Floor
                bg = (r + c) % 2 === 0 ? "#c4d0d8" : "#a4b0b8";
                bx = "inset 0 0 0 1px rgba(0,0,0,0.05)";
              }
              return (
                <div key={`${r}-${c}`} style={{
                  position: "absolute", left: c*TILE, top: r*TILE,
                  width: TILE, height: TILE, background: bg, boxShadow: bx,
                }} />
              );
            }))}

            {/* Printing Press */}
            <PrintingPress col={7} />

            {/* Tip Line Phone */}
            <TipLinePhone 
              col={layout.phonePos.col} 
              row={layout.phonePos.row} 
              isNear={nearObject === "phone"} 
              onClick={() => {
                if (phase === "free") setOpenTipLine(true);
              }}
            />

            {/* Article objects (Bulletin Board) */}
            {layout.articles.map(r => (
              <PixelArticle
                key={r.id}
                article={r}
                isNear={nearObject === r.id}
                onClick={() => {
                  if (phase === "free") setOpenPost(r.post);
                }}
              />
            ))}

            {/* Exit Door */}
            <ExitDoor col={3} row={1} />

            {/* Player */}
            <div style={{
              position: "absolute",
              left: pos.col * TILE, top: pos.row * TILE,
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
              transition: `left ${tt}s linear, top ${tt}s linear`,
            }}>
              <PlayerSprite direction={facing} stepping={stepping} costume="newsroom" />
            </div>

            {/* Vignette */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)",
            }} />
          </div>

          {/* CRT scanlines */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200,
            background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
          }} />

          {/* ← VILLAGE */}
          <button onClick={onBackToVillage} style={{
            position: "absolute", top: 8, left: 8,
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            background: "#2a3036", color: "#eef7f2", border: "2px solid #eef7f2",
            padding: "4px 8px", cursor: "pointer", borderRadius: 2, zIndex: 500,
            boxShadow: "0 2px 0 #181a1c",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={6} strokeWidth={3} /> VILLAGE
            </div>
          </button>

          {/* Post count badge */}
          <div style={{
            position: "absolute", top: 8, right: 8,
            fontFamily: "'Press Start 2P', monospace", fontSize: 5,
            color: "#eef7f2", background: "rgba(0,0,0,0.5)",
            padding: "4px 6px", borderRadius: 2,
            zIndex: 500, display: "flex", alignItems: "center", gap: 4,
          }}>
            <Newspaper size={7} /> {BLOG_POSTS.length} ISSUE{BLOG_POSTS.length !== 1 ? "S" : ""}
          </div>

          {/* Proximity prompt */}
          {phase === "free" && nearObject && !openPost && !openTipLine && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              padding: "4px 8px",
              background: "rgba(0,0,0,0.9)", border: "2px solid #fff",
              zIndex: 500, display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 6, color: "#fff" }}>
                {nearObject === "phone" ? (
                  <><Phone size={8} /><span>TIP LINE</span></>
                ) : (
                  <><FileText size={8} /><span>{activeArticle?.label}</span></>
                )}
              </div>
              <div style={{
                fontSize: 5, color: "#000", background: "#fff",
                padding: "2px 4px"
              }}>SPACE</div>
            </div>
          )}

          {/* Intro dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", bottom: 8, left: 8, right: 8,
              padding: "18px 14px 10px",
              background: "#fff", border: "4px solid #000", zIndex: 500,
            }}>
              <div style={{
                position: "absolute", top: -12, left: 10,
                background: "#000", border: "2px solid #fff",
                padding: "2px 8px", fontSize: 7, color: "#fff",
              }}>EDITOR</div>
              <div style={{ fontSize: 8, lineHeight: 2.4, minHeight: 28, color: "#000" }}>
                {introLine}
                <span style={{ animation: "dialogBlink 0.5s step-end infinite" }}>▊</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setPhase("free")}
                  style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                    background: "#000", color: "#fff", border: "none",
                    padding: "8px 14px", cursor: "pointer",
                    boxShadow: "4px 4px 0 #888", display: "flex", alignItems: "center"
                  }}
                >
                  <span style={{ fontSize: 5, color: "#000", marginRight: 8, background: "#fff", padding: "2px 4px" }}>SPACE</span>
                  GET TO WORK
                </button>
              </div>
            </div>
          )}

          {/* ── TIP LINE OVERLAY (Rolodex style) ── */}
          {openTipLine && (
            <div
              onClick={() => setOpenTipLine(false)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: "#f4e8d0", border: "4px solid #111", borderTopWidth: "12px",
                  width: 240, maxWidth: "90%",
                  boxShadow: "8px 8px 0 rgba(0,0,0,0.5)",
                  display: "flex", flexDirection: "column", padding: "16px",
                  textAlign: "center", position: "relative"
                }}
              >
                {/* Spiral notebook rings */}
                <div style={{ position: "absolute", top: -16, left: 20, width: 8, height: 16, background: "#silver", borderRadius: 4, border: "1px solid #111" }} />
                <div style={{ position: "absolute", top: -16, left: 60, width: 8, height: 16, background: "#silver", borderRadius: 4, border: "1px solid #111" }} />
                <div style={{ position: "absolute", top: -16, right: 60, width: 8, height: 16, background: "#silver", borderRadius: 4, border: "1px solid #111" }} />
                <div style={{ position: "absolute", top: -16, right: 20, width: 8, height: 16, background: "#silver", borderRadius: 4, border: "1px solid #111" }} />

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -10 }}>
                  <button onClick={() => setOpenTipLine(false)} style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                    background: "#000", color: "#fff", border: "none",
                    padding: "4px 6px", cursor: "pointer",
                  }}><X size={8} /></button>
                </div>
                
                <Phone size={24} color="#000" style={{ margin: "0 auto 12px" }} />
                <h2 style={{ fontSize: 8, color: "#000", margin: "0 0 8px 0", lineHeight: "12px", borderBottom: "2px solid #000", paddingBottom: 8 }}>TIP LINE</h2>
                <p style={{ fontSize: 5, color: "#333", margin: "0 0 16px 0", lineHeight: "10px", fontFamily: "monospace" }}>
                  Got a lead? Send a Letter to the Editor.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <a href="mailto:hello@example.com" className="contact-btn">
                    <MessageCircle size={10} /> EMAIL DESK
                  </a>
                  <a href="https://linkedin.com/in/saad-ibra" target="_blank" rel="noopener noreferrer" className="contact-btn">
                    <Briefcase size={10} /> LINKEDIN
                  </a>
                  <a href="https://twitter.com/saadibrahimkhan" target="_blank" rel="noopener noreferrer" className="contact-btn">
                    <Hash size={10} /> TWITTER / X
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── NEWSPAPER READING MODAL ── */}
          {openPost && (
            <div
              onClick={() => setOpenPost(null)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.9)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                className="news-scroll"
                style={{
                  background: "#fff", border: "6px solid #000",
                  width: 350, maxWidth: "95%", maxHeight: INTERNAL_H - 20,
                  boxShadow: "12px 12px 0 rgba(0,0,0,0.8)",
                  overflow: "hidden", display: "flex", flexDirection: "column",
                }}
              >
                {/* Header (Newspaper style) */}
                <div style={{
                  padding: "16px 14px 10px",
                  borderBottom: "4px solid #000",
                  flexShrink: 0, textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, color: "#000", lineHeight: "14px", fontWeight: "bold", textTransform: "uppercase" }}>
                    {openPost.title}
                  </div>
                  {openPost.subtitle && (
                    <div style={{ fontSize: 6, color: "#444", marginTop: 8, fontStyle: "italic", fontFamily: "monospace" }}>
                      {openPost.subtitle}
                    </div>
                  )}
                </div>

                {/* Author & Meta */}
                <div style={{
                  padding: "6px 14px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: 5, color: "#000", background: "#f0f0f0",
                  borderBottom: "2px solid #000", flexShrink: 0,
                  fontFamily: "monospace", textTransform: "uppercase"
                }}>
                  <div style={{ fontWeight: "bold" }}>BY {openPost.author}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{openPost.date}</span>
                    <span>|</span>
                    <span>{openPost.readTime}</span>
                  </div>
                  <button onClick={() => setOpenPost(null)} style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                      background: "#000", color: "#fff", border: "none",
                      padding: "2px 5px", cursor: "pointer",
                    }}>CLOSE</button>
                </div>

                {/* Scrollable content (Columns) */}
                <div className="news-scroll" style={{
                  padding: "16px 14px",
                  overflow: "auto", flex: 1,
                  fontFamily: "monospace", // Typewriter feel
                  columnCount: 2, columnGap: "16px", columnRule: "1px solid #ccc"
                }}>
                  {openPost.content.map((para, i) => (
                    <p key={i} style={{
                      fontSize: 6, lineHeight: "11px", color: "#000",
                      margin: "0 0 12px 0", textAlign: "justify",
                    }}>
                      {i === 0 ? <span style={{ fontSize: 12, float: "left", lineHeight: "12px", paddingRight: 4, fontWeight: "bold" }}>{para.charAt(0)}</span> : null}
                      {i === 0 ? para.slice(1) : para}
                    </p>
                  ))}

                  {/* Tags */}
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12,
                    paddingTop: 12, borderTop: "2px solid #000", columnSpan: "all"
                  }}>
                    {openPost.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 5, color: "#fff", background: "#000",
                        padding: "3px 6px", textTransform: "uppercase"
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
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
