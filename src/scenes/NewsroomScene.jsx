"use client";
import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import { useCameraLerp } from '../hooks/useCameraLerp.js';
import { getSharedAudioCtx } from '../engine/sfx.js';
import { ArrowLeft, Newspaper, FileText, Clock, Hash, X, ExternalLink, Phone, Briefcase, MessageCircle } from "lucide-react";

import { TILE } from '../engine/constants';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { playTileStep } from '../engine/sfx';
import PlayerSprite from '../components/sprites/PlayerSprite';
import ControlBar from '../components/ui/ControlBar';
import ExitDoor from '../components/sprites/ExitDoor';
import SaadSprite from '../components/sprites/SaadSprite';
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
  
  return { map, totalCols, totalRows, articles, articleTiles, pressTiles, startPos: { col: 5, row: 5 } };
}

function isLayoutWalkable(layout, col, row) {
  if (row < 0 || row >= layout.totalRows || col < 0 || col >= layout.totalCols) return false;
  const t = layout.map[row][col];
  return t === 1 || t === 3;
}
function canLayoutWalk(layout, col, row) {
  if (col === 5 && row === 3) return false;
  const coord = `${col},${row}`;
  if (layout.articleTiles.has(coord) || layout.pressTiles.has(coord)) return false;
  return isLayoutWalkable(layout, col, row);
}

const NPC_POS = { col: 5, row: 3 };

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
//  MAIN NEWSROOM COMPONENT
// ============================================================
export default function NewsroomScene({ isLandscape, onBackToVillage, triggerTransition, isTransitioning, speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume }) {
  const layout = useMemo(() => generateNewsroomLayout(BLOG_POSTS), []);
  const layoutRef = useRef(layout);
  useEffect(() => { layoutRef.current = layout; }, [layout]);

  const renderedTiles = useMemo(() => layout.map.map((row, r) => row.map((tile, c) => {
    if (tile === 0) return null;
    let bg, bx = "none";
    if (tile === 2) {
      bg = "repeating-linear-gradient(90deg,#4a545e,#4a545e 4px,#586068 4px,#586068 8px)";
      bx = "inset 0 -3px 0 #2a3036, inset 0 -8px 8px rgba(0,0,0,0.5)";
    } else if (tile === 4) {
      bg = "repeating-linear-gradient(45deg,#8a6442,#8a6442 2px,#9a7452 2px,#9a7452 4px)";
      bx = "inset -3px 0 0 #5a3c24, inset 0 -8px 8px rgba(0,0,0,0.5)";
    } else if (tile === 3) {
      bg = "#2a3a4a";
      bx = "inset 0 0 0 1px #1a2a3a";
    } else {
      bg = (r + c) % 2 === 0 ? "#c4d0d8" : "#a4b0b8";
      bx = "inset 0 0 0 1px rgba(0,0,0,0.05)";
    }
    return (
      <div key={`${r}-${c}`} style={{
        position: "absolute", left: c * TILE, top: r * TILE,
        width: TILE + 1, height: TILE + 1, background: bg, boxShadow: bx,
      }} />
    );
  })), [layout]);

  const [nearObject, setNearObject] = useState(null); // ID of article
  const [openPost, setOpenPost]     = useState(null);
  const [phase, setPhase]           = useState("intro");
  const [scale, setScale] = useState(1);
  const [internalW, setInternalW] = useState(384);
  const [internalH, setInternalH] = useState(288);

        
  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const musicRef     = useRef({ audioCtx: null, interval: null });
  const containerRef = useRef(null);
  const postScrollRef = useRef(null);

  useEffect(() => {
    if (!openPost) return;
    const handleScroll = (e) => {
      if (!postScrollRef.current) return;
      const key = e.key.toLowerCase();
      const scrollAmt = 40;
      if (key === 'arrowdown' || key === 's') {
        postScrollRef.current.scrollTop += scrollAmt;
        e.preventDefault();
      } else if (key === 'arrowup' || key === 'w') {
        postScrollRef.current.scrollTop -= scrollAmt;
        e.preventDefault();
      } else if (key === 'arrowright' || key === 'd') {
        postScrollRef.current.scrollLeft += scrollAmt;
        e.preventDefault();
      } else if (key === 'arrowleft' || key === 'a') {
        postScrollRef.current.scrollLeft -= scrollAmt;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleScroll, { capture: true });
    return () => window.removeEventListener("keydown", handleScroll, { capture: true });
  }, [openPost]);

  const { pos, facing, stepping } = usePlayerMovement({
    initialPos: layout.startPos,
    canWalk: (c, r) => {
      if (c === 5 && r === 1) { onBackToVillage(); return false; }
      return canLayoutWalk(layoutRef.current, c, r);
    },
    speedMultiplier,
    isActive: phase === "free" && !isTransitioning && !openPost,
    onMove: (c, r) => { checkNear(c, r); playTileStep(); return false; },
    onAction: () => {
      const dc = Math.abs(NPC_POS.col - pos.col);
      const dr = Math.abs(NPC_POS.row - pos.row);
      if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
        setPhase("intro");
        return;
      }
      if (!nearObject) return;
      const rec = layoutRef.current.articles.find(a => a.id === nearObject);
      if (rec) setOpenPost(rec.post);
    },
    onCancel: () => { setOpenPost(null); }
  });

  // Also keep a ref to facing so keyboard handler can read it without triggering re-renders
  const keysRef = useRef({});

  // ---- Synth engine — driving 80s investigative synth ----
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx)
        musicRef.current.audioCtx = getSharedAudioCtx();
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
    const resize = () => {
      const isMobile = window.innerWidth < 768;
      const consoleWidth = isLandscape ? 320 : 0;
      const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
      const availableWidth = window.innerWidth - consoleWidth;
      const availableHeight = window.innerHeight - consoleHeight;
      const baseW = 256;
      const baseH = 192;
      const newScale = Math.max(1, Math.floor(Math.min(availableWidth / baseW, availableHeight / baseH)));
      setInternalW(Math.floor(availableWidth / newScale));
      setInternalH(Math.floor(availableHeight / newScale));
      setScale(newScale);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [isLandscape]);

  // ---- Proximity detection ----
  const checkNear = useCallback((col, row) => {
    for (const r of layoutRef.current.articles) {
      const dc = Math.abs(r.col - col), dr = Math.abs(r.row - row);
      if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
        setNearObject(r.id);
        return;
      }
    }
    
    setNearObject(null);
  }, []);

  // ---- Keyboard & Audio Resume ----
  useEffect(() => {
    const resume = () => {
      if (!musicRef.current.audioCtx)
        musicRef.current.audioCtx = getSharedAudioCtx();
      if (musicRef.current.audioCtx.state === "suspended")
        musicRef.current.audioCtx.resume();
    };
    window.addEventListener("keydown", resume);
    window.addEventListener("click", resume);
    window.addEventListener("touchstart", resume);
    window.addEventListener("pointerdown", resume);

    const onDown = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        if (phase === "intro") {
          e.preventDefault();
          setPhase("free");
          return;
        }
      }

      if (phase === "intro" && (e.key === " " || e.key === "Enter" || e.key === "Escape")) {
        e.preventDefault();
        setPhase("free");
        return;
      }

      if (phase !== "free") return;
      if ((e.key === " " || e.key === "Enter") && nearObject) {
        e.preventDefault();
        const rec = layoutRef.current.articles.find(r => r.id === nearObject);
        if (rec) setOpenPost(rec.post);
      }
      if (e.key === "Escape") {
        setOpenPost(null);
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
      window.removeEventListener("touchstart", resume);
      window.removeEventListener("pointerdown", resume);
    };
  }, [nearObject, phase]);


  // ---- Camera (clamped to world bounds) ----
  const cam = useCameraLerp(pos, TILE, internalW, internalH, layout.totalCols, layout.totalRows, speedMultiplier);
  const tt = (0.14 / speedMultiplier).toFixed(2);

  const activeArticle = layout.articles.find(r => r.id === nearObject);
  const introLine = `The newsroom. Every article on that corkboard is something I wrote. The red phone on the desk has my contact info.`;

  // ---- Render ----
  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#080c10", overflow: "hidden",
      fontFamily: "'Press Start 2P', monospace", userSelect: "none",  boxSizing: "border-box", height: "100dvh", width: "100dvw", }}>
      <title>Newsroom | Saad Ibra</title>
      <meta name="description" content="Read my latest thoughts and articles on software engineering, game dev, and more in the Newsroom." />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dialogSlideIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes keycapGlow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
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
          position: "relative", width: internalW, height: internalH,
          overflow: "hidden", background: "#1a1e24",
          boxShadow: "0 0 0 4px #222",
          imageRendering: "pixelated",
        }}>

          {/* Scrolling world */}
          <div style={{
            position: "absolute",
            width: layout.totalCols * TILE, height: layout.totalRows * TILE,
            left: -cam.x, top: -cam.y,
            
          }}>

            {/* Tile layer */}
            {renderedTiles}

            {/* Printing Press */}
            <PrintingPress col={7} />

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
            <ExitDoor col={5} row={1} />

            {/* NPC Saad */}
            <div style={{
              position: "absolute",
              left: 5 * TILE,
              top: 3 * TILE,
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 3 * 10,
              filter: (Math.abs(5 - pos.col) <= 1 && Math.abs(3 - pos.row) <= 1 && phase === "free") ? "drop-shadow(0 0 6px rgba(255,255,255,0.5))" : "none",
              transition: "filter 0.2s",
            }}>
              <SaadSprite direction="down" />
            </div>

            {/* Player */}
            <div style={{
              position: "absolute",
              left: pos.col * TILE, top: pos.row * TILE, transition: "left 0.14s linear, top 0.14s linear",
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
              
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
          {phase === "free" && nearObject && !openPost && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              padding: "4px 8px",
              background: "rgba(0,0,0,0.9)", border: "2px solid #fff",
              zIndex: 500, display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 6, color: "#fff" }}>
                <FileText size={8} /><span>{activeArticle?.label}</span>
              </div>
              <div style={{
                fontSize: 5, color: "#000", background: "#fff",
                padding: "2px 4px"
              }}>SPACE/A</div>
            </div>
          )}

          {/* Intro dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", top: 16, left: 8, right: 8,
              padding: "18px 14px 10px",
              background: "#fff", border: "4px solid #000", zIndex: 500,
              animation: "dialogSlideIn 0.3s ease-out"
            }}>
              <div style={{ position: "absolute", top: 3, right: 3, width: 4, height: 4, borderRight: "2px solid #000", borderTop: "2px solid #000", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 3, left: 3, width: 4, height: 4, borderLeft: "2px solid #000", borderBottom: "2px solid #000", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 3, right: 3, width: 4, height: 4, borderRight: "2px solid #000", borderBottom: "2px solid #000", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{
                position: "absolute", top: -12, left: 54,
                background: "#000", border: "2px solid #fff",
                padding: "2px 8px", fontSize: 7, color: "#fff",
              }}>SAAD IBRA</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <img src="/favicon.svg" alt="" draggable={false} style={{
                  width: 30, height: 30, minWidth: 30,
                  imageRendering: "pixelated", borderRadius: 2, marginTop: 1,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
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
                      <span style={{ fontSize: 5, color: "#000", marginRight: 8, background: "#fff", padding: "2px 4px" }}>SPACE/A</span>
                      GET TO WORK
                    </button>
                  </div>
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
                  width: 350, maxWidth: "95%", maxHeight: internalH - 20,
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
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => window.open('blogs/index.html', '_blank')} style={{
                        fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                        background: "#fff", color: "#000", border: "1px solid #000",
                        padding: "2px 5px", cursor: "pointer",
                      }}>READ IN NEWSPAPER</button>
                    <button onClick={() => setOpenPost(null)} style={{
                        fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                        background: "#000", color: "#fff", border: "none",
                        padding: "2px 5px", cursor: "pointer",
                      }}>CLOSE</button>
                  </div>
                </div>

                {/* Scrollable content (Columns) */}
                <div ref={postScrollRef} className="news-scroll" style={{
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
        

        </div>
      </div>
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
  );
}
