"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { DoorOpen } from "lucide-react";
import { TILE, INTERNAL_W, INTERNAL_H, MOVE_COOLDOWN } from "../engine/constants";
import PlayerSprite from "../components/sprites/PlayerSprite";
import ControlBar from "../components/ui/ControlBar";
import {
  MAP, MAP_COLS, MAP_ROWS, SHOPS, SHOP_TILES, START_POS,
  DECORATIONS, PALETTE,
} from "../data/village";

// ============================================================
//  WALKABILITY
// ============================================================
function isWalkable(col, row) {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
  const t = MAP[row][col];
  return t === 1 || t === 5;
}
function canWalk(col, row) {
  if (SHOP_TILES.has(`${col},${row}`)) return false;
  return isWalkable(col, row);
}

// ============================================================
//  BUILDING TILE — determines visual variant based on neighbors
// ============================================================
function getBuildingStyle(r, c) {
  const south = r < MAP_ROWS - 1 ? MAP[r + 1][c] : 0;
  const north = r > 0 ? MAP[r - 1][c] : 0;
  const isFacade = south === 1 || south === 5; // faces south onto a lane
  const isBase = north === 1 || north === 5;   // lane to the north
  const hash = (r * 7 + c * 13) % 5;
  return { isFacade, isBase, hash };
}

// ============================================================
//  SHOPFRONT — awning, signboard, shutter
// ============================================================
function ShopFront({ shop, isNear }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;

  // Position relative to the door tile
  const left = shop.col * TILE;
  const top = shop.row * TILE;

  // Awning dimensions — extends above the door
  const awningW = TILE + 8;
  const awningH = 10;
  const awningLeft = left - 4;
  const awningTop = top - awningH - 2;

  // Signboard — above awning
  const signW = awningW + 4;
  const signH = 12;
  const signLeft = left - 6;
  const signTop = awningTop - signH - 1;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {/* Signboard */}
      <div style={{
        position: "absolute", left: signLeft, top: signTop,
        width: signW, height: signH,
        background: shop.sign,
        border: `1px solid ${active ? shop.awning : "rgba(0,0,0,0.3)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 3.5, color: shop.signText,
        letterSpacing: "0.3px",
        boxShadow: active
          ? `0 0 8px ${shop.awning}44, 0 2px 4px rgba(0,0,0,0.5)`
          : "0 2px 4px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.3s, border-color 0.3s",
        zIndex: (shop.row - 1) * 10 + 8,
        pointerEvents: "auto",
        cursor: "default",
      }}>
        {shop.label}
      </div>

      {/* Awning — striped canvas */}
      <div style={{
        position: "absolute", left: awningLeft, top: awningTop,
        width: awningW, height: awningH,
        background: `repeating-linear-gradient(90deg, ${shop.awning}, ${shop.awning} 4px, ${shop.awningDark} 4px, ${shop.awningDark} 8px)`,
        borderRadius: "0 0 2px 2px",
        boxShadow: "0 2px 3px rgba(0,0,0,0.4)",
        zIndex: (shop.row - 1) * 10 + 7,
      }} />

      {/* Shutter door — horizontal metallic stripes */}
      <div style={{
        position: "absolute", left: left + 2, top: top + 2,
        width: TILE - 4, height: TILE - 4,
        background: `repeating-linear-gradient(0deg, #8a8a8a, #8a8a8a 2px, #a0a0a0 2px, #a0a0a0 4px)`,
        border: `1px solid ${active ? shop.awning : "#606060"}`,
        boxShadow: active
          ? `inset 0 0 4px rgba(0,0,0,0.3), 0 0 6px ${shop.awning}33`
          : "inset 0 0 4px rgba(0,0,0,0.3)",
        transition: "border-color 0.3s, box-shadow 0.3s",
        zIndex: shop.row * 10 + 2,
        pointerEvents: "auto",
        cursor: "default",
      }}>
        {/* Door handle */}
        <div style={{
          position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 6, background: "#505050", borderRadius: 1,
        }} />
      </div>

      {/* Proximity glow ring */}
      {active && (
        <div style={{
          position: "absolute", left: left - 3, top: top - 3,
          width: TILE + 6, height: TILE + 6,
          border: `2px solid ${shop.awning}`,
          borderRadius: 3,
          boxShadow: `0 0 10px ${shop.awning}55`,
          zIndex: shop.row * 10 + 3,
          pointerEvents: "none",
          animation: "shopGlow 1.5s ease-in-out infinite",
        }} />
      )}
    </div>
  );
}

// ============================================================
//  AUTO-RICKSHAW — pixel art decoration
// ============================================================
function AutoRickshaw({ col, row }) {
  const left = col * TILE + 4;
  const top = row * TILE + 6;
  return (
    <svg
      style={{ position: "absolute", left, top, zIndex: row * 10 + 1, pointerEvents: "none" }}
      width="28" height="22" viewBox="0 0 28 22"
    >
      {/* Body */}
      <rect x="4" y="4" width="20" height="12" rx="2" fill="#e8c830" />
      <rect x="4" y="4" width="20" height="3" rx="1" fill="#d4b020" />
      {/* Canvas roof */}
      <rect x="2" y="1" width="18" height="5" rx="1" fill="#2a6828" />
      <rect x="3" y="2" width="16" height="3" fill="#3a8838" />
      {/* Windshield */}
      <rect x="20" y="5" width="4" height="6" rx="1" fill="#88c8e0" />
      <rect x="21" y="6" width="2" height="4" fill="#a8e0f0" opacity="0.6" />
      {/* Wheels */}
      <circle cx="8" cy="18" r="3" fill="#282828" />
      <circle cx="8" cy="18" r="1.5" fill="#404040" />
      <circle cx="20" cy="18" r="3" fill="#282828" />
      <circle cx="20" cy="18" r="1.5" fill="#404040" />
      {/* Handlebar */}
      <rect x="22" y="3" width="3" height="2" rx="1" fill="#606060" />
      <rect x="24" y="1" width="2" height="4" rx="1" fill="#505050" />
    </svg>
  );
}

// ============================================================
//  ELECTRICAL WIRES — catenary curves between buildings
// ============================================================
function ElectricalWires({ wires }) {
  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, width: MAP_COLS * TILE, height: MAP_ROWS * TILE, pointerEvents: "none", zIndex: 200 }}
      viewBox={`0 0 ${MAP_COLS * TILE} ${MAP_ROWS * TILE}`}
    >
      {wires.map((w, i) => {
        const x1 = w.x1 * TILE + TILE / 2;
        const y1 = w.y1 * TILE + 4;
        const x2 = w.x2 * TILE + TILE / 2;
        const y2 = w.y2 * TILE + 4;
        const mx = (x1 + x2) / 2;
        const my = Math.max(y1, y2) + 8; // sag
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="0.8"
            opacity="0.5"
          />
        );
      })}
    </svg>
  );
}

// ============================================================
//  BACKGROUND SILHOUETTES — distant buildings beyond the map
// ============================================================
function BackgroundSilhouettes() {
  // Render muted building shapes at the void edges
  const blocks = [
    // Top edge silhouettes
    { x: 0, y: -20, w: 80, h: 30, color: "#b8a888" },
    { x: 100, y: -15, w: 60, h: 25, color: "#a89878" },
    { x: 200, y: -25, w: 90, h: 35, color: "#b0a080" },
    { x: 340, y: -18, w: 70, h: 28, color: "#a89070" },
    { x: 460, y: -22, w: 100, h: 32, color: "#b8a888" },
    { x: 600, y: -20, w: 80, h: 30, color: "#a89878" },
    // Right edge
    { x: MAP_COLS * TILE, y: 40, w: 50, h: 60, color: "#a89070" },
    { x: MAP_COLS * TILE + 10, y: 120, w: 40, h: 50, color: "#b0a080" },
    { x: MAP_COLS * TILE, y: 220, w: 60, h: 70, color: "#a89878" },
    // Bottom edge
    { x: 60, y: MAP_ROWS * TILE - 8, w: 70, h: 30, color: "#b0a080" },
    { x: 200, y: MAP_ROWS * TILE - 5, w: 90, h: 25, color: "#a89878" },
    { x: 380, y: MAP_ROWS * TILE - 10, w: 80, h: 30, color: "#b8a888" },
    { x: 530, y: MAP_ROWS * TILE - 6, w: 60, h: 26, color: "#a89070" },
    // Left edge
    { x: -40, y: 60, w: 50, h: 55, color: "#a89878" },
    { x: -30, y: 180, w: 45, h: 50, color: "#b0a080" },
    { x: -35, y: 320, w: 55, h: 65, color: "#a89070" },
    // Small dome silhouette — civic landmark hint
    { x: 550, y: -30, w: 30, h: 20, color: "#a08868", borderRadius: "50% 50% 0 0" },
  ];

  return (
    <>
      {blocks.map((b, i) => (
        <div key={i} style={{
          position: "absolute", left: b.x, top: b.y,
          width: b.w, height: b.h,
          background: b.color,
          borderRadius: b.borderRadius || 0,
          opacity: 0.6,
          pointerEvents: "none",
        }} />
      ))}
    </>
  );
}

// ============================================================
//  MAIN VILLAGE SCENE
// ============================================================
export default function VillageScene({
  onGoToLibrary, onGoToLab, onGoToNewsroom,
  onGoToNomadshome, onGoToMusicRoom,
}) {
  const [pos, setPos]             = useState(() => START_POS);
  const [facing, setFacing]       = useState("down");
  const [stepping, setStepping]   = useState(false);
  const [nearShop, setNearShop]   = useState(null);
  const [phase, setPhase]         = useState("intro");
  const [scale, setScale]         = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(() =>
    parseFloat(localStorage.getItem("speedMultiplier") || "1")
  );
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicMuted, setMusicMuted]     = useState(() =>
    JSON.parse(localStorage.getItem("musicMuted") || "false")
  );
  const [musicVolume, setMusicVolume]   = useState(() =>
    parseFloat(localStorage.getItem("musicVolume") || "0.1")
  );

  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const musicRef     = useRef({ audioCtx: null, interval: null });
  const containerRef = useRef(null);
  const keysRef      = useRef({});
  const lastMoveRef  = useRef(0);

  // Scene-transition callback map
  const sceneCallbacks = {
    library:    onGoToLibrary,
    lab:        onGoToLab,
    newsroom:   onGoToNewsroom,
    nomadshome: onGoToNomadshome,
    musicroom:  onGoToMusicRoom,
  };

  // ---- Synth engine: warm ambient bazaar ----
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx)
        musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      // Pentatonic scale — warm, modal feel
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A
      const t = ctx.currentTime;

      // Drone — low sustained hum
      if (idx % 16 === 0) {
        const drone = ctx.createOscillator();
        const dG = ctx.createGain();
        drone.type = "triangle";
        drone.frequency.setValueAtTime(130.81, t); // C3
        dG.gain.setValueAtTime(vol * 0.12, t);
        dG.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
        drone.connect(dG); dG.connect(ctx.destination);
        drone.start(t); drone.stop(t + 2);
      }

      // Melody — sparse, meditative notes
      if (idx % 4 === 0) {
        const mel = ctx.createOscillator();
        const mG = ctx.createGain();
        mel.type = "triangle";
        const note = scale[(idx / 4 + Math.floor(idx / 16)) % scale.length];
        mel.frequency.setValueAtTime(note, t);
        mG.gain.setValueAtTime(vol * 0.08, t);
        mG.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        mel.connect(mG); mG.connect(ctx.destination);
        mel.start(t); mel.stop(t + 0.7);
      }

      // Tabla-like hit — short noise burst every 8th step
      if (idx % 8 === 0) {
        const bufSize = ctx.sampleRate * 0.05;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        const src = ctx.createBufferSource();
        const nG = ctx.createGain();
        src.buffer = buf;
        nG.gain.setValueAtTime(vol * 0.15, t);
        nG.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.connect(nG); nG.connect(ctx.destination);
        src.start(t);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(320 / speedMultiplier);
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
    for (const s of SHOPS) {
      const dc = Math.abs(s.col - col);
      const dr = Math.abs(s.row - row);
      if ((dc === 1 && dr === 0) || (dc === 0 && dr === 1)) {
        setNearShop(s.id);
        return;
      }
    }
    setNearShop(null);
  }, []);

  // ---- Keyboard ----
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

      if (phase === "intro" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setPhase("free");
        return;
      }

      if (phase !== "free") return;

      if ((e.key === " " || e.key === "Enter") && nearShop) {
        e.preventDefault();
        const shop = SHOPS.find(s => s.id === nearShop);
        if (shop && sceneCallbacks[shop.scene]) {
          sceneCallbacks[shop.scene]();
        }
      }
      if (e.key === "Escape") setNearShop(null);
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
  }, [nearShop, phase]);

  // ---- Movement loop ----
  useEffect(() => {
    if (phase !== "free") return;
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastMoveRef.current < MOVE_COOLDOWN / speedMultiplier) return;
      const k = keysRef.current;
      let dc = 0, dr = 0, nf = facing;
      if      (k.w || k.arrowup)    { dr = -1; nf = "up"; }
      else if (k.s || k.arrowdown)  { dr =  1; nf = "down"; }
      else if (k.a || k.arrowleft)  { dc = -1; nf = "left"; }
      else if (k.d || k.arrowright) { dc =  1; nf = "right"; }
      if (dc !== 0 || dr !== 0) {
        setFacing(nf);
        const tc = pos.col + dc;
        const tr = pos.row + dr;
        if (canWalk(tc, tr)) {
          setPos({ col: tc, row: tr });
          setStepping(true);
          lastMoveRef.current = now;
          checkNear(tc, tr);
          setTimeout(() => setStepping(false), 90);
        }
      }
    }, 30);
    return () => clearInterval(id);
  }, [pos, facing, phase, speedMultiplier, checkNear]);

  // ---- Camera (clamped) ----
  const rawCamX = pos.col * TILE + TILE / 2 - INTERNAL_W / 2;
  const rawCamY = pos.row * TILE + TILE / 2 - INTERNAL_H / 2;
  const camX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - INTERNAL_W), rawCamX));
  const camY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - INTERNAL_H), rawCamY));
  const tt = (0.14 / speedMultiplier).toFixed(2);

  const activeShop = SHOPS.find(s => s.id === nearShop);

  // ---- Render ----
  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: PALETTE.void, overflow: "hidden",
      fontFamily: "'Press Start 2P', monospace", userSelect: "none",
    }}>
      <style>{`
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes shopGlow { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: `scale(${scale})`, transformOrigin: "center",
        imageRendering: "pixelated",
      }}>

        {/* ── GAME VIEWPORT ── */}
        <div style={{
          position: "relative", width: INTERNAL_W, height: INTERNAL_H,
          overflow: "hidden", background: PALETTE.void,
          boxShadow: "0 0 0 4px #8a7060, 0 8px 32px rgba(0,0,0,0.5)",
          imageRendering: "pixelated",
        }}>

          {/* Scrolling world */}
          <div style={{
            position: "absolute",
            width: MAP_COLS * TILE, height: MAP_ROWS * TILE,
            left: -camX, top: -camY,
            transition: `left ${tt}s linear, top ${tt}s linear`,
          }}>

            {/* Background silhouettes */}
            <BackgroundSilhouettes />

            {/* Tile layer */}
            {MAP.map((row, r) => row.map((tile, c) => {
              if (tile === 0) return null;

              let bg, bx = "none", extra = null;

              if (tile === 1) {
                // Lane — dusty concrete
                bg = PALETTE.lane[(r + c) % 2];
                bx = "inset 0 0 0 1px rgba(0,0,0,0.06)";
                // Subtle crack marks on some tiles
                if ((r * 3 + c * 7) % 11 === 0) {
                  extra = (
                    <div style={{
                      position: "absolute", left: 4, top: 12,
                      width: 8, height: 1, background: "rgba(0,0,0,0.08)",
                      transform: "rotate(15deg)",
                    }} />
                  );
                }
              } else if (tile === 5) {
                // Courtyard — darker paved
                bg = PALETTE.courtyard[(r + c) % 2];
                bx = "inset 0 0 0 1px rgba(0,0,0,0.1)";
              } else if (tile === 2) {
                // Building
                const { isFacade, hash } = getBuildingStyle(r, c);
                if (isFacade) {
                  // Facade facing south — wall with windows
                  bg = PALETTE.building[hash];
                  bx = "inset 0 -4px 0 rgba(0,0,0,0.2), inset 0 0 0 1px rgba(0,0,0,0.1)";
                  // Window
                  const hasWindow = (r + c) % 3 !== 0;
                  const isLit = (r * 5 + c * 11) % 7 === 0;
                  if (hasWindow) {
                    extra = (
                      <div style={{
                        position: "absolute",
                        left: TILE / 2 - 4, top: 4,
                        width: 8, height: 6,
                        background: isLit ? PALETTE.windowLit : PALETTE.window,
                        border: "1px solid rgba(0,0,0,0.3)",
                        boxShadow: isLit ? `0 0 6px ${PALETTE.windowLit}44` : "none",
                      }} />
                    );
                  }
                } else {
                  // Rooftop
                  bg = PALETTE.rooftop[hash % 3];
                  bx = "inset 0 0 0 1px rgba(0,0,0,0.08)";
                  // Subtle roof texture
                  if (hash % 2 === 0) {
                    extra = (
                      <div style={{
                        position: "absolute", inset: 3,
                        border: "1px solid rgba(0,0,0,0.06)",
                      }} />
                    );
                  }
                }
              }

              return (
                <div key={`${r}-${c}`} style={{
                  position: "absolute", left: c * TILE, top: r * TILE,
                  width: TILE, height: TILE, background: bg, boxShadow: bx,
                }}>
                  {extra}
                </div>
              );
            }))}

            {/* Shopfronts */}
            {SHOPS.map(shop => (
              <ShopFront key={shop.id} shop={shop} isNear={nearShop === shop.id} />
            ))}

            {/* Auto-rickshaw */}
            <AutoRickshaw col={DECORATIONS.rickshaw.col} row={DECORATIONS.rickshaw.row} />

            {/* Electrical wires */}
            <ElectricalWires wires={DECORATIONS.wires} />

            {/* Player */}
            <div style={{
              position: "absolute",
              left: pos.col * TILE, top: pos.row * TILE,
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
              transition: `left ${tt}s linear, top ${tt}s linear`,
            }}>
              <PlayerSprite direction={facing} stepping={stepping} costume="village" />
            </div>

            {/* Warm ambient vignette */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(circle at 50% 40%, transparent 40%, rgba(180,150,100,0.15) 100%)",
            }} />
          </div>

          {/* Warm light overlay — outdoor feel */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200,
            background: "linear-gradient(180deg, rgba(255,220,150,0.04) 0%, rgba(200,160,80,0.06) 100%)",
          }} />

          {/* Proximity prompt */}
          {phase === "free" && activeShop && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              padding: "5px 12px",
              background: "rgba(40,28,16,0.95)", border: `2px solid ${activeShop.awning}`,
              borderRadius: 3, zIndex: 500, pointerEvents: "none",
              display: "flex", gap: 8, alignItems: "center",
              boxShadow: `0 4px 12px rgba(0,0,0,0.6), 0 0 8px ${activeShop.awning}22`,
              whiteSpace: "nowrap",
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 5.5, color: activeShop.signText }}>
                <DoorOpen size={8} />
                <span>ENTER {activeShop.label}</span>
              </div>
              <div style={{
                fontSize: 5, color: "#d4c4a8", background: "rgba(0,0,0,0.4)",
                padding: "2px 5px", borderRadius: 2,
              }}>SPACE</div>
            </div>
          )}

          {/* Intro dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", bottom: 8, left: 8, right: 8,
              padding: "18px 14px 10px",
              background: "rgba(40,28,16,0.97)", border: "2px solid #d4c4a8", borderRadius: 3,
              boxShadow: "inset 0 0 0 4px #6a4a30, 0 8px 24px rgba(0,0,0,0.6)",
              zIndex: 500,
            }}>
              <div style={{
                position: "absolute", top: -12, left: 10,
                background: "#4a3018", border: "2px solid #d4c4a8",
                padding: "2px 8px", fontSize: 7, color: "#e8d8c0", borderRadius: 2,
              }}>NOMADSLAND</div>
              <div style={{ fontSize: 8, lineHeight: 2.4, minHeight: 28, color: "#e8d8c0" }}>
                Welcome to Nomadsland. Wander the lanes — each shop has a story.
                <span style={{ animation: "dialogBlink 0.5s step-end infinite" }}>▊</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setPhase("free")}
                  style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                    background: "#6a4a30", color: "#e8d8c0", border: "none",
                    padding: "8px 14px", borderRadius: 2, cursor: "pointer",
                    boxShadow: "0 3px 0 #3a2818", display: "flex", alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 5, color: "#d4c4a8", marginRight: 8, background: "rgba(0,0,0,0.2)", padding: "2px 4px", borderRadius: 2 }}>SPACE</span>
                  EXPLORE
                </button>
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
