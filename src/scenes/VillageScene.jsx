"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { DoorOpen } from "lucide-react";
import { TILE, INTERNAL_W, INTERNAL_H, MOVE_COOLDOWN } from "../engine/constants";
import PlayerSprite from "../components/sprites/PlayerSprite";
import ControlBar from "../components/ui/ControlBar";
import {
  MAP, MAP_COLS, MAP_ROWS, SHOPS, SHOP_TILES, START_POS,
  PALETTE,
} from "../data/village";

// ============================================================
//  WALKABILITY
// ============================================================
function isWalkable(col, row) {
  if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
  const t = MAP[row][col];
  return t === 0 || t === 1 || t === 6; // grass, path, flowers
}
function canWalk(col, row) {
  if (SHOP_TILES.has(`${col},${row}`)) return false; // door collision
  return isWalkable(col, row);
}

// Deterministic hash for tile variations
function hash(r, c) {
  return (r * 7 + c * 13);
}

// ============================================================
//  POKÉMON-STYLE HOUSE
// ============================================================
function House({ shop, isNear }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;

  // The door is at (shop.col, shop.row).
  // The house is 5 tiles wide and 3 tiles high.
  // Door is bottom-center. So left edge is col - 2, top edge is row - 2.
  const left = (shop.col - 2) * TILE;
  const top = (shop.row - 2) * TILE;
  const width = TILE * 5;
  const height = TILE * 3;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left, top, width, height,
        pointerEvents: "none", zIndex: shop.row * 10 + 5,
      }}
    >
      {/* ── WALL ── */}
      <div style={{
        position: "absolute", left: 0, bottom: 0, width: "100%", height: TILE,
        background: shop.wall, border: "2px solid #302820", borderRadius: 2,
        boxShadow: "inset 0 4px 0 rgba(0,0,0,0.1)",
      }}>
        {/* Windows */}
        <div style={{ position: "absolute", left: TILE*0.75, top: 4, width: TILE*0.8, height: TILE*0.6, background: "#88c8e0", border: "2px solid #504030", borderRadius: 2 }} />
        <div style={{ position: "absolute", right: TILE*0.75, top: 4, width: TILE*0.8, height: TILE*0.6, background: "#88c8e0", border: "2px solid #504030", borderRadius: 2 }} />
      </div>

      {/* ── ROOF ── */}
      <div style={{
        position: "absolute", left: -4, top: -4, width: width + 8, height: TILE * 2 + 4,
        background: shop.roof, border: "2px solid #302820", borderRadius: 4,
        boxShadow: "0 6px 0 rgba(0,0,0,0.2), inset 0 4px 0 rgba(255,255,255,0.3)",
      }}>
        {/* Roof tiles pattern */}
        <div style={{
          position: "absolute", inset: 4,
          background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
          backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(0,0,0,0.1) 12px, rgba(0,0,0,0.1) 14px)",
        }} />
        {/* Signboard on Roof */}
        <div style={{
          position: "absolute", left: "50%", bottom: 4, transform: "translateX(-50%)",
          background: "#f8e8d8", border: "2px solid #504030", borderRadius: 2,
          padding: "2px 6px", fontFamily: "'Press Start 2P', monospace", fontSize: 4, color: "#302820",
          boxShadow: "0 2px 0 rgba(0,0,0,0.2)", pointerEvents: "auto",
        }}>
          {shop.label}
        </div>
      </div>

      {/* ── DOOR ── */}
      <div style={{
        position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
        width: TILE - 8, height: TILE - 4, background: shop.door,
        border: "2px solid #302820", borderBottom: "none", borderRadius: "4px 4px 0 0",
        boxShadow: active ? `inset 0 0 8px rgba(255,255,255,0.6)` : "inset 0 0 4px rgba(0,0,0,0.3)",
        transition: "box-shadow 0.2s", pointerEvents: "auto", cursor: "pointer",
      }}>
        {/* Door knob */}
        <div style={{ position: "absolute", right: 2, top: "50%", width: 3, height: 3, background: "#e8c860", borderRadius: "50%" }} />
      </div>

      {/* Hover/Proximity Glow */}
      {active && (
        <div style={{
          position: "absolute", left: "50%", bottom: -4, transform: "translateX(-50%)",
          width: TILE, height: TILE, border: `2px solid #fff`, borderRadius: 4,
          boxShadow: `0 0 12px #fff`, zIndex: -1, animation: "glowPulse 1s ease-in-out infinite alternate"
        }} />
      )}
    </div>
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
  const [speedMultiplier, setSpeedMultiplier] = useState(() => parseFloat(localStorage.getItem("speedMultiplier") || "1"));
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicMuted, setMusicMuted]     = useState(() => JSON.parse(localStorage.getItem("musicMuted") || "false"));
  const [musicVolume, setMusicVolume]   = useState(() => parseFloat(localStorage.getItem("musicVolume") || "0.1"));

  const [cam, setCam] = useState({ x: START_POS.col * TILE - INTERNAL_W/2, y: START_POS.row * TILE - INTERNAL_H/2 });

  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const musicRef     = useRef({ audioCtx: null, interval: null });
  const containerRef = useRef(null);
  const keysRef      = useRef({});
  const lastMoveRef  = useRef(0);
  const rafRef       = useRef();

  const sceneCallbacks = {
    library: onGoToLibrary, lab: onGoToLab, newsroom: onGoToNewsroom,
    nomadshome: onGoToNomadshome, musicroom: onGoToMusicRoom,
  };

  // ---- Synth engine: Upbeat 8-bit / Chiptune (Pokémon style) ----
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      // Cheerful major scale melody
      const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major
      const t = ctx.currentTime;

      // Bassline (Square wave)
      if (idx % 4 === 0 || idx % 4 === 2) {
        const bass = ctx.createOscillator();
        const bG = ctx.createGain();
        bass.type = "square";
        const root = idx % 32 < 16 ? 130.81 : 174.61; // C3 -> F3
        bass.frequency.setValueAtTime(root, t);
        
        bG.gain.setValueAtTime(vol * 0.1, t);
        bG.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        bass.connect(bG); bG.connect(ctx.destination);
        bass.start(t); bass.stop(t + 0.2);
      }

      // Arpeggiated Melody (Square wave)
      if (idx % 2 === 0) {
        const mel = ctx.createOscillator();
        const mG = ctx.createGain();
        mel.type = "square";
        const noteIdx = (idx / 2 + Math.floor(idx / 16)) % scale.length;
        mel.frequency.setValueAtTime(scale[noteIdx] * 1.5, t);
        
        mG.gain.setValueAtTime(vol * 0.06, t);
        mG.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        mel.connect(mG); mG.connect(ctx.destination);
        mel.start(t); mel.stop(t + 0.15);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(180 / speedMultiplier); // faster, upbeat tempo
    musicRef.current.interval = setInterval(() => {
      playStep(step++, musicVolume, musicMuted);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / INTERNAL_W, window.innerHeight / (INTERNAL_H + 80)));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

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

  useEffect(() => {
    const resume = () => {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (musicRef.current.audioCtx.state === "suspended") musicRef.current.audioCtx.resume();
    };
    window.addEventListener("keydown", resume);
    window.addEventListener("click", resume);

    const onDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (phase === "intro" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault(); setPhase("free"); return;
      }
      if (phase !== "free") return;
      if ((e.key === " " || e.key === "Enter") && nearShop) {
        e.preventDefault();
        const shop = SHOPS.find(s => s.id === nearShop);
        if (shop && sceneCallbacks[shop.scene]) sceneCallbacks[shop.scene]();
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

  // Movement loop
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

  // Smooth Camera Lerp
  useEffect(() => {
    let lastTime = performance.now();
    const updateCam = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      const targetX = pos.col * TILE + TILE / 2 - INTERNAL_W / 2;
      const targetY = pos.row * TILE + TILE / 2 - INTERNAL_H / 2;
      
      const clampedTX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - INTERNAL_W), targetX));
      const clampedTY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - INTERNAL_H), targetY));

      setCam(prev => {
        const lerpFactor = 1.0 - Math.pow(0.001, dt * speedMultiplier);
        return {
          x: prev.x + (clampedTX - prev.x) * lerpFactor,
          y: prev.y + (clampedTY - prev.y) * lerpFactor
        };
      });
      rafRef.current = requestAnimationFrame(updateCam);
    };
    rafRef.current = requestAnimationFrame(updateCam);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pos, speedMultiplier]);

  // Virtualization
  const startCol = Math.max(0, Math.floor(cam.x / TILE) - 2);
  const endCol = Math.min(MAP_COLS, Math.floor((cam.x + INTERNAL_W) / TILE) + 3);
  const startRow = Math.max(0, Math.floor(cam.y / TILE) - 2);
  const endRow = Math.min(MAP_ROWS, Math.floor((cam.y + INTERNAL_H) / TILE) + 3);

  const activeShop = SHOPS.find(s => s.id === nearShop);

  // Render Virtualized Grid
  const visibleTiles = [];
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const tile = MAP[r][c];
      
      const h = hash(r, c);
      let bg = PALETTE.grass[h % PALETTE.grass.length]; // default grass base
      let content = null;

      if (tile === 0 || tile === 6) { // Grass / Flowers
        // Add subtle grass blades
        if (h % 3 === 0) {
          content = <div style={{ position: "absolute", left: 8, top: 8, width: 2, height: 4, background: "#50a840", borderRadius: 1 }} />;
        }
        if (tile === 6) { // Flowers
          const flowerColors = PALETTE.flowers;
          content = (
            <>
              <div style={{ position: "absolute", left: 4, top: 4, width: 4, height: 4, background: flowerColors[h % 2], borderRadius: "50%" }} />
              <div style={{ position: "absolute", right: 6, bottom: 6, width: 5, height: 5, background: flowerColors[(h+1) % 2], borderRadius: "50%" }} />
              <div style={{ position: "absolute", left: 12, top: 14, width: 3, height: 3, background: "#f8f8f8", borderRadius: "50%" }} />
            </>
          );
        }
      } else if (tile === 1) { // Path
        bg = PALETTE.path[h % PALETTE.path.length];
        // Path edges (simulated by checking neighbors, but hardcoded here for simplicity)
        content = <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(0,0,0,0.05)" }} />;
      } else if (tile === 2) { // Tree
        bg = PALETTE.grass[h % PALETTE.grass.length]; // base grass
        // Render a cute round tree overlapping slightly upwards
        content = (
          <div style={{
            position: "absolute", left: -4, top: -12, width: TILE + 8, height: TILE + 12,
            background: PALETTE.tree[h % PALETTE.tree.length], border: "2px solid #184820", borderRadius: "50% 50% 10px 10px",
            boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.2), 0 4px 0 rgba(0,0,0,0.2)",
            zIndex: r * 10 + 2,
          }}>
            {/* Tree highlight */}
            <div style={{ position: "absolute", left: 8, top: 4, width: 12, height: 6, background: "rgba(255,255,255,0.15)", borderRadius: "50%" }} />
          </div>
        );
      } else if (tile === 3) { // House Base
        bg = PALETTE.grass[0]; // House rendered over this
      }

      visibleTiles.push(
        <div key={`${r}-${c}`} style={{
          position: "absolute", left: c * TILE, top: r * TILE,
          width: TILE, height: TILE, background: bg,
        }}>
          {content}
        </div>
      );
    }
  }

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#000", overflow: "hidden",
      fontFamily: "'Press Start 2P', monospace", userSelect: "none",
    }}>
      <style>{`
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes glowPulse { from { opacity: 0.5; transform: translateX(-50%) scale(1); } to { opacity: 1; transform: translateX(-50%) scale(1.1); } }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: `scale(${scale})`, transformOrigin: "center",
        imageRendering: "pixelated",
      }}>

        {/* ── GAME VIEWPORT ── */}
        <div style={{
          position: "relative", width: INTERNAL_W, height: INTERNAL_H,
          overflow: "hidden", background: PALETTE.grass[0],
          boxShadow: "0 0 0 4px #eef7f2",
          imageRendering: "pixelated",
        }}>

          {/* Scrolling world layer */}
          <div style={{
            position: "absolute",
            width: MAP_COLS * TILE, height: MAP_ROWS * TILE,
            left: -cam.x, top: -cam.y,
          }}>
            
            {visibleTiles}

            {/* Render Shops */}
            {SHOPS.map(shop => (
              <House key={shop.id} shop={shop} isNear={nearShop === shop.id} />
            ))}

            {/* Player */}
            <div style={{
              position: "absolute", left: pos.col * TILE, top: pos.row * TILE, width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
              transition: `left 0.1s linear, top 0.1s linear`,
            }}>
              {/* Drop shadow */}
              <div style={{ position: "absolute", bottom: 2, width: 14, height: 6, background: "rgba(0,0,0,0.3)", borderRadius: "50%", zIndex: -1 }} />
              <PlayerSprite direction={facing} stepping={stepping} costume="casual" />
            </div>

          </div>

          {/* Proximity prompt */}
          {phase === "free" && activeShop && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", padding: "5px 12px",
              background: "#f8f8f8", border: `2px solid #302820`, borderRadius: 4,
              zIndex: 6000, pointerEvents: "none", display: "flex", gap: 8, alignItems: "center",
              boxShadow: `0 4px 0 rgba(0,0,0,0.2)`, whiteSpace: "nowrap", color: "#302820"
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 5.5, color: "#302820" }}>
                <DoorOpen size={8} /><span>ENTER {activeShop.label}</span>
              </div>
              <div style={{ fontSize: 5, color: "#fff", background: "#302820", padding: "2px 5px", borderRadius: 2 }}>SPACE</div>
            </div>
          )}

          {/* Intro dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", bottom: 8, left: 8, right: 8, padding: "18px 14px 10px",
              background: "#f8f8f8", border: "2px solid #302820", borderRadius: 4,
              boxShadow: "0 6px 0 rgba(0,0,0,0.3)", zIndex: 6000,
            }}>
              <div style={{
                position: "absolute", top: -10, left: 10, background: "#d84040", border: "2px solid #302820",
                padding: "2px 8px", fontSize: 6, color: "#fff", borderRadius: 2,
              }}>NOMADSLAND</div>
              <div style={{ fontSize: 8, lineHeight: 2.4, minHeight: 28, color: "#302820" }}>
                Welcome to Nomadsland! A peaceful town full of ideas and projects.
                <span style={{ animation: "dialogBlink 0.5s step-end infinite" }}>▊</span>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setPhase("free")} style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6, background: "#408ad8", color: "#fff",
                  border: "2px solid #302820", padding: "6px 12px", borderRadius: 4, cursor: "pointer",
                  boxShadow: "0 2px 0 #302820", display: "flex", alignItems: "center",
                }}>
                  <span style={{ fontSize: 5, color: "#302820", marginRight: 8, background: "rgba(255,255,255,0.4)", padding: "2px 4px", borderRadius: 2 }}>SPACE</span>
                  LET'S GO!
                </button>
              </div>
            </div>
          )}
        </div>

        <ControlBar
          width={INTERNAL_W} musicPlaying={musicPlaying} musicMuted={musicMuted}
          musicVolume={musicVolume} speedMultiplier={speedMultiplier}
          onTogglePlay={() => musicPlaying ? setMusicMuted(!musicMuted) : setMusicPlaying(true)}
          onChangeVolume={setMusicVolume} onChangeSpeed={setSpeedMultiplier}
        />
      </div>
    </div>
  );
}
