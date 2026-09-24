"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useViewport } from "../hooks/useViewport.js";
import { getSharedAudioCtx } from '../engine/sfx.js';
import { useGame } from '../context/GameContext.jsx';
import { DoorOpen } from "lucide-react";
import { TILE, MOVE_COOLDOWN } from '../engine/constants';
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { findPath } from "../engine/pathfinding";
import { useTapToMove, TapMarker } from "../hooks/useTapToMove.jsx";
import { playWaterSlosh, playGrassStep, playDirtStep, playWoodStep, playTileStep } from "../engine/sfx";
import PlayerSprite from "../components/sprites/PlayerSprite";
import ControlBar from "../components/ui/ControlBar";
import SaadSprite from "../components/sprites/SaadSprite";
import { Building } from "../components/village/Buildings.jsx";

import { useTerrainCanvas } from "../hooks/useTerrainCanvas";
import {
  MAP, MAP_COLS, MAP_ROWS, SHOPS, SHOP_TILES, START_POS,
  PALETTE,
} from "../data/village";

// ============================================================
//  WALKABILITY
// ============================================================
// Walkability is now handled inside VillageScene to access state.

// Deterministic hash for tile variations
function hash(r, c) {
  return (r * 7 + c * 13);
}

// ============================================================
//  BUILDING SHELL — shared wrapper that handles positioning,
//  hover state, and door-glow. Each building plugs into this.
// ============================================================

// ============================================================
//  MAIN VILLAGE SCENE
// ============================================================
export default function VillageScene() {
  const { isLandscape, isTransitioning, triggerTransition, previousScene, changeScene,
    speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume, isConsoleMinimized } = useGame();
  const [nearShop, setNearShop]   = useState(null);
  const [phase, setPhase]         = useState(previousScene ? "free" : "intro");
  
  const { scale, internalW, internalH } = useViewport(isLandscape, isConsoleMinimized);
        
  const [isSailing, setIsSailing] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [boatPos, setBoatPos] = useState({ col: 28.5, row: 29 });
  const [wakes, setWakes] = useState([]);
  
  const [mountTime] = useState(() => Date.now());
  const [sailStartTime, setSailStartTime] = useState(0);

  useEffect(() => {
    if (wakes.length > 0) {
      const timer = setTimeout(() => setWakes(w => w.slice(1)), 250);
      return () => clearTimeout(timer);
    }
  }, [wakes]);

  const canWalk = useCallback((c, r) => {
    if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return false;
    if (c === 9 && r === 22) return false; // Saad NPC
    
    if (!isSailing && SHOP_TILES.has(`${c},${r}`)) return false; // doors

    const t = MAP[r][c];
    if (isSailing) {
      return t === 4 || t === 10; // Allow water and bridge while sailing
    } else {
      if (t === 0 || t === 1 || t === 6 || t === 9 || t === 10 || t === 11) return true;
            return false;
    }
  }, [isSailing, boatPos]);

  const sceneCallbacks = {
    library: () => changeScene('library'), lab: () => changeScene('lab'), newsroom: () => changeScene('newsroom'),
    nomadshome: () => changeScene('nomadshome'), musicroom: () => changeScene('musicroom'),
  };

  const initialPos = (() => {
    if (previousScene && SHOPS.some(s => s.scene === previousScene)) {
      const shop = SHOPS.find(s => s.scene === previousScene);
      return { col: shop.col, row: shop.row + 1 };
    }
    return START_POS;
  })();

  const {  pos, setPos, facing, stepping, setPath, tapTarget , triggerAction } = usePlayerMovement({
    sceneId: "village",
    ignoreSavedPos: previousScene !== null,
    initialPos,
    canWalk,
    speedMultiplier,
    isActive: phase === "free" && !isTransitioning,
    isSailing,
    onMove: (nc, nr, dir, pCol, pRow) => {
      if (isSailing) {
        setBoatPos({ col: nc, row: nr });


        if (MAP[nr]?.[nc] === 4 && pCol !== undefined && pRow !== undefined) {
          setWakes(prev => [...prev.slice(-8), { c: pCol, r: pRow, id: Math.random() }]);
        }
        playWoodStep();
      } else {
        const tile = MAP[nr]?.[nc];
        if (tile === 4) playWoodStep();
        else if (tile === 0 || tile === 6) playGrassStep(); // Grass & flowers
        else if (tile === 1 || tile === 9) playDirtStep(); // Trail & stairs
        else if (tile === 10 || tile === 11) playWoodStep(); // Bridge/Dock
      }
      let isNear = null;
      for (const shop of SHOPS) {
        const dc = Math.abs(shop.col - nc);
        const dr = Math.abs(shop.row - nr);
        if ((dc + dr) === 1 || (dc === 0 && dr === 0)) {
          isNear = shop;
          break;
        }
      }
      setNearShop(isNear ? isNear.id : null);
      return false; // don't cancel move
    },
    onAction: () => {
      if (!isSailing) {
        const t = MAP[pos.row]?.[pos.col];
        const isOnBoatLocal = pos.row === boatPos.row && Math.abs(pos.col - boatPos.col) <= 1;
        
        if ((t === 11) && !isOnBoatLocal) {
          let targetCol = pos.col, targetRow = pos.row;
          let foundWater = false;
          // Search up to 3 tiles outwards for water (fixes large docks)
          for (let d = 1; d <= 3 && !foundWater; d++) {
            const adjs = [
              {c: pos.col + d, r: pos.row}, {c: pos.col - d, r: pos.row},
              {c: pos.col, r: pos.row + d}, {c: pos.col, r: pos.row - d}
            ];
            for (let adj of adjs) {
              if (MAP[adj.r]?.[adj.c] === 4) {
                targetCol = adj.c;
                targetRow = adj.r;
                foundWater = true;
                break;
              }
            }
          }
          
          if (triggerTransition) {
            triggerTransition(() => {
              setBoatPos({ col: targetCol - 0.5, row: targetRow });
              setPos({ col: targetCol, row: targetRow });
              setIsSailing(true);
              setSailStartTime(Date.now());
            });
          } else {
            setBoatPos({ col: targetCol - 0.5, row: targetRow });
            setPos({ col: targetCol, row: targetRow });
            setIsSailing(true);
            setSailStartTime(Date.now());
          }
          return;
        }

        
        const nx = pos.col + (facing === "right" ? 1 : facing === "left" ? -1 : 0);
        const ny = pos.row + (facing === "down" ? 1 : facing === "up" ? -1 : 0);
        
        if ((nx === 9 && ny === 22) || (Math.abs(pos.col - 9) <= 1 && Math.abs(pos.row - 22) <= 1)) {
          setPhase("intro");
          return;
        }


        if (nearShop) {
          const shop = SHOPS.find(s => s.id === nearShop);
          if (shop && sceneCallbacks[shop.scene]) sceneCallbacks[shop.scene]();
        }
      } else {
        if (Date.now() - sailStartTime < 500) return;
        
        // Drop anchor if next to a dock (Bridge = 10, Dock = 11)
        const adjs = [
          { c: pos.col, r: pos.row - 1 }, { c: pos.col, r: pos.row + 1 },
          { c: pos.col - 1, r: pos.row }, { c: pos.col + 1, r: pos.row },
        ];
        for (const adj of adjs) {
          if (MAP[adj.r]?.[adj.c] === 11) {
            if (triggerTransition) {
              triggerTransition(() => {
                setBoatPos({ col: pos.col - 0.5, row: pos.row });
                setPos({ col: adj.c, row: adj.r }); // Step player onto dock
                setIsSailing(false);
              });
            } else {
              setBoatPos({ col: pos.col - 0.5, row: pos.row });
              setPos({ col: adj.c, row: adj.r }); // Step player onto dock
              setIsSailing(false);
            }
            return;
          }
        }
      }
    },
    onCancel: () => setNearShop(null)
  });

  // Rescue player if they reload the page while sailing (which leaves them stranded in water with isSailing=false)
  useEffect(() => {
    const tile = MAP[pos.row]?.[pos.col];
    if (tile === 4 || tile === 10 || tile === 11) { // Water, Bridge, Dock
      setPos({ col: 29, row: 27 }); // Place them right outside the dock
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera uses refs + direct DOM mutation instead of React state to avoid 60fps re-renders
  const camRef = useRef({ x: initialPos.col * TILE + TILE/2 - internalW/2, y: initialPos.row * TILE + TILE/2 - internalH/2 });
  const worldRef = useRef(null);
  const handleWorldTap = useTapToMove(worldRef, pos, canWalk, setPath, MAP_COLS, MAP_ROWS, phase === "free" && !isTransitioning, isSailing);
  // Only triggers React re-render when the visible tile window changes
  const [tileWindow, setTileWindow] = useState({ sc: 0, ec: MAP_COLS, sr: 0, er: MAP_ROWS });



  const musicRef     = useRef({ audioCtx: null, interval: null });
  const containerRef = useRef(null);
  const rafRef       = useRef();
  const { waterCanvasRef, landCanvasRef } = useTerrainCanvas();

  // ---- Synth engine: Richer 16-bit RPG Overworld Theme ----
  const playStep = useCallback((idx, vol, muted, sailing) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = getSharedAudioCtx();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const t = ctx.currentTime;

      if (sailing) {
        // MAJESTIC OCEAN THEME
        // D Major scale
        const dScale = [293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 554.37, 587.33]; 
        // D Major, A Major, B minor, G Major
        const chords = [
          [0, 2, 4],    // D F# A
          [4, 6, 1+7],  // A C# E
          [5, 0+7, 2+7], // B D F#
          [3, 5, 0+7]   // G B D
        ];
        const chordIdx = Math.floor(idx / 12) % chords.length;
        const chord = chords[chordIdx];

        // Sweeping Bass (Sine wave - deep and smooth)
        if (idx % 12 === 0 || idx % 12 === 6) {
          const bass = ctx.createOscillator();
          const bG = ctx.createGain();
          bass.type = "sine"; 
          const rootNote = dScale[chord[0]] / 4; // two octaves down
          bass.frequency.setValueAtTime(rootNote, t);
          bG.gain.setValueAtTime(0, t);
          bG.gain.linearRampToValueAtTime(vol * 0.2, t + 0.2);
          bG.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
          bass.connect(bG); bG.connect(ctx.destination);
          bass.start(t); bass.stop(t + 1.1);
        }

        // Harp-like Arpeggios (Triangle wave)
        if (idx % 2 === 0) {
          const arp = ctx.createOscillator();
          const aG = ctx.createGain();
          arp.type = "triangle";
          
          const arpPattern = [0, 1, 2, 1]; // Up and down the chord
          const noteIndexInChord = arpPattern[(idx / 2) % 4];
          let noteFreq = dScale[chord[noteIndexInChord]] * 2; // one octave up

          arp.frequency.setValueAtTime(noteFreq, t);
          aG.gain.setValueAtTime(vol * 0.1, t);
          aG.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          arp.connect(aG); aG.connect(ctx.destination);
          arp.start(t); arp.stop(t + 0.4);
        }
        
        // Majestic string pad (Sine wave chords swelling)
        if (idx % 12 === 0) {
           for (let i=0; i<3; i++) {
             const pad = ctx.createOscillator();
             const pG = ctx.createGain();
             pad.type = "sine";
             pad.frequency.setValueAtTime(dScale[chord[i]], t);
             pG.gain.setValueAtTime(0, t);
             pG.gain.linearRampToValueAtTime(vol * 0.04, t + 0.5);
             pG.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
             pad.connect(pG); pG.connect(ctx.destination);
             pad.start(t); pad.stop(t + 2.1);
           }
        }
      } else {
        // ORIGINAL OVERWORLD THEME
        // Cheerful major scale melody (C Major Pentatonic + F & B for passing)
        const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major

        // Bassline (Triangle wave - warmer, rounder bass)
        if (idx % 4 === 0 || idx % 4 === 2) {
          const bass = ctx.createOscillator();
          const bG = ctx.createGain();
          bass.type = "triangle";
          // Alternating root notes for a walking bass feel
          const roots = [130.81, 130.81, 174.61, 196.00]; // C, C, F, G
          const root = roots[Math.floor(idx / 16) % roots.length];
          bass.frequency.setValueAtTime(root, t);
          
          bG.gain.setValueAtTime(vol * 0.15, t);
          bG.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          bass.connect(bG); bG.connect(ctx.destination);
          bass.start(t); bass.stop(t + 0.35);
        }

        // Arpeggiated Melody (Square wave with lowpass filter for 16-bit "flute/synth" tone)
        if (idx % 2 === 0) {
          const mel = ctx.createOscillator();
          const mG = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          mel.type = "square";
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(1200, t); // Cut off harsh high frequencies
          
          // A slightly more complex, cheerful sequence
          const pattern = [0, 2, 4, 7, 4, 5, 2, -1];
          const noteIdx = pattern[(idx / 2) % 8];
          
          if (noteIdx !== -1) {
            // Add some octave variation
            const octave = (idx % 32 > 16) ? 2 : 1.5;
            mel.frequency.setValueAtTime(scale[noteIdx] * octave, t);
            
            mG.gain.setValueAtTime(vol * 0.05, t);
            // Slightly longer decay for smoother melody
            mG.gain.setTargetAtTime(0.001, t + 0.1, 0.05);
            
            mel.connect(filter); filter.connect(mG); mG.connect(ctx.destination);
            mel.start(t); mel.stop(t + 0.25);
          }
        }
        
        // Counter-melody (Sine wave for a glassy pad sound)
        if (idx % 8 === 0) {
          const pad = ctx.createOscillator();
          const pG = ctx.createGain();
          pad.type = "sine";
          const padNote = scale[Math.floor(idx / 16) % scale.length];
          pad.frequency.setValueAtTime(padNote * 2, t); // High register
          
          pG.gain.setValueAtTime(0, t);
          pG.gain.linearRampToValueAtTime(vol * 0.03, t + 0.2);
          pG.gain.linearRampToValueAtTime(0, t + 0.6);
          
          pad.connect(pG); pG.connect(ctx.destination);
          pad.start(t); pad.stop(t + 0.65);
        }
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
      playStep(step++, musicVolume, musicMuted, isSailing);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, isSailing, playStep]);


  useEffect(() => {
    const resume = () => {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = getSharedAudioCtx();
      if (musicRef.current.audioCtx.state === "suspended") musicRef.current.audioCtx.resume();
    };
    const onIntroDismiss = (e) => {
      if ((e.key === " " || e.key === "Enter")) {
        if (phase === "intro") {
          e.preventDefault();
          setPhase("free");
        } else if (showComingSoon) {
          e.preventDefault();
          setShowComingSoon(false);
        }
      }
    };

    window.addEventListener("keydown", resume);
    window.addEventListener("click", resume);
    window.addEventListener("touchstart", resume);
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", onIntroDismiss);

    return () => {
      window.removeEventListener("keydown", resume);
      window.removeEventListener("click", resume);
      window.removeEventListener("touchstart", resume);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", onIntroDismiss);
    };
  }, [phase, showComingSoon]);

  const isFirstFrame = useRef(true);

  // Smooth Camera Lerp — uses direct DOM mutation, NOT React state
  useEffect(() => {
    let lastTime = performance.now();
    const updateCam = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      const targetX = pos.col * TILE + TILE / 2 - internalW / 2;
      const targetY = pos.row * TILE + TILE / 2 - internalH / 2;
      
      const clampedTX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - internalW), targetX));
      const clampedTY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - internalH), targetY));

      const cam = camRef.current;
      
      if (isFirstFrame.current) {
        cam.x = clampedTX;
        cam.y = clampedTY;
        isFirstFrame.current = false;
      } else {
        const lerpFactor = 1.0 - Math.pow(0.001, dt * speedMultiplier);
        cam.x = cam.x + (clampedTX - cam.x) * lerpFactor;
        cam.y = cam.y + (clampedTY - cam.y) * lerpFactor;
      }

      // Direct DOM mutation — no React re-render
      if (worldRef.current) {
        worldRef.current.style.transform = `translate(${-Math.round(cam.x)}px, ${-Math.round(cam.y)}px)`;
      }

      // Only trigger React re-render when the visible tile window actually changes
      const sc = Math.max(0, Math.floor(cam.x / TILE) - 2);
      const ec = Math.min(MAP_COLS, Math.floor((cam.x + internalW) / TILE) + 3);
      const sr = Math.max(0, Math.floor(cam.y / TILE) - 2);
      const er = Math.min(MAP_ROWS, Math.floor((cam.y + internalH) / TILE) + 3);
      setTileWindow(prev => {
        if (prev.sc !== sc || prev.ec !== ec || prev.sr !== sr || prev.er !== er) {
          return { sc, ec, sr, er };
        }
        return prev;
      });

      rafRef.current = requestAnimationFrame(updateCam);
    };
    rafRef.current = requestAnimationFrame(updateCam);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pos, speedMultiplier, internalW, internalH]);

  // Virtualization — driven by tileWindow state (updates ~every 32px of movement, not every frame)
  const { sc: startCol, ec: endCol, sr: startRow, er: endRow } = tileWindow;

  // Pre-compute minimap tile rects once (MAP never changes)
  const minimapTiles = useMemo(() => {
    return MAP.map((row, ry) => row.map((t, cx) => {
      let fill;
      if (t === 0 || t === 6) fill = "#5a9a44";
      else if (t === 1) fill = "#d0b870";
      else if (t === 2 || t === 5 || t === 7) fill = "#1a4a22";
      else if (t === 3) fill = "#6a6a6a";
      else if (t === 4) fill = "#2060a0";
      else if (t === 8) fill = "#5a4030";
      else if (t === 9) fill = "#8a8a8a";
      else if (t === 10 || t === 11) fill = "#8a5a2a";
      else fill = "#2060a0";
      return <rect key={`${ry}-${cx}`} x={cx} y={ry} width={1} height={1} fill={fill} />;
    }));
  }, []); // MAP is static, compute once

  const activeShop = SHOPS.find(s => s.id === nearShop);
  const isOnBoat = !isSailing && pos.row === boatPos.row && Math.abs(pos.col - boatPos.col) <= 1;
  const isStandingOnDock = !isSailing && (MAP[pos.row]?.[pos.col] === 11);
  const isNearDockWhileSailing = isSailing && [
    { c: pos.col, r: pos.row - 1 }, { c: pos.col, r: pos.row + 1 },
    { c: pos.col - 1, r: pos.row }, { c: pos.col + 1, r: pos.row },
  ].some(adj => MAP[adj.r]?.[adj.c] === 11);

  const getBoatTransform = () => {
    if (!isSailing) return "none";
    if (facing === "left") return "scaleX(-1)";
    return "none";
  };

  // Render Virtualized Grid — ONLY trees (Y-sorted), bridges (dynamic z), NPC, and barricade
  // Ground tiles (grass, path, water, cliffs, stairs, docks) are on the pre-baked <canvas>.
  const visibleTiles = [];
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const tile = MAP[r][c];
      
      const h = hash(r, c);
      let bg = PALETTE.grass[h % PALETTE.grass.length]; // default grass base
      let content = null;

      const distToLab = Math.sqrt(Math.pow(r - 17, 2) + Math.pow(c - 28, 2));
      const dryness = Math.max(0, Math.min(1, 1 - (distToLab - 2) / 7));
      const isDry = (h % 100) / 100 < dryness;

      if (tile === 0 || tile === 6 || tile === 1 || tile === 3 || tile === 4 || tile === 8 || tile === 9 || tile === 11) {
        // Ground tiles are painted on the pre-baked <canvas> — skip DOM rendering
      } else if (tile === 2) { // Tree
        // Render a detailed pixel-art Pokémon-style RPG tree
        const SPECIES = isDry ? [
          ["#5c3a21", "#c28144", "#e8a864", "#8c562b"], // dry broadleaf
          ["#4d311c", "#a86b32", "#cc8b4a", "#734522"], // dry oak
          ["#3d2716", "#8f5726", "#b06e33", "#59361a"], // dry pine
        ] : [
          ["#1a4d24", "#5db34a", "#a3e37e", "#2f7d3a"], // broadleaf
          ["#173d1f", "#4f9c3c", "#87c95f", "#26622c"], // oak
          ["#0f3322", "#2f7d4a", "#5cae74", "#1c5433"], // pine
        ];
        const VARIANTS = [
          [{cx:28,cy:25,r:15},{cx:15,cy:27,r:11},{cx:41,cy:27,r:11},{cx:21,cy:14,r:10},{cx:35,cy:14,r:10},{cx:28,cy:35,r:12}],
          [{cx:28,cy:40,r:14},{cx:28,cy:28,r:12},{cx:28,cy:17,r:10},{cx:28,cy:8,r:7}],
          [{cx:17,cy:27,r:13},{cx:39,cy:27,r:13},{cx:28,cy:18,r:11},{cx:28,cy:35,r:12}],
        ];

        const uid = `${r}-${h}`; // swap for a true row/col key if available, must be unique per tile
        const circles = VARIANTS[h % VARIANTS.length];
        const [outline, base, hi, sh] = SPECIES[h % SPECIES.length];
        const flip = h % 2 === 0;
        const circleTags = circles.map(c => <circle key={c.cx+","+c.cy} cx={c.cx} cy={c.cy} r={c.r} />);

        visibleTiles.push(
          <div key={`${r}-${c}`} style={{
            position: "absolute", left: c * TILE - 8, top: r * TILE - 22, width: TILE + 16, height: TILE + 24,
            zIndex: r * 10 + 2, display: "flex", alignItems: "flex-end", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <svg viewBox="0 0 56 66" width="56" height="66"
                 style={{ transform: flip ? "scaleX(-1)" : "none", overflow: "visible" }}>
              <defs>
                <clipPath id={`clip-${uid}`}>{circleTags}</clipPath>
                <filter id={`outline-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="dilated" />
                  <feFlood floodColor={outline} result="outlineColor" />
                  <feComposite in="outlineColor" in2="dilated" operator="in" result="outlinePart" />
                  <feMerge>
                    <feMergeNode in="outlinePart" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ground shadow */}
              <ellipse cx="28" cy="60" rx="15" ry="4.5" fill="#000" opacity="0.28" />

              {/* two-tone trunk */}
              <rect x="23" y="46" width="5" height="13" fill="#6b4423" stroke="#2e1c0e" strokeWidth="1.6" />
              <rect x="28" y="46" width="5" height="13" fill="#4a2f18" stroke="#2e1c0e" strokeWidth="1.6" />

              {/* canopy: circle union + filter = chunky pixel outline, free */}
              <g filter={`url(#outline-${uid})`} fill={base}>{circleTags}</g>

              {/* cel-shading */}
              <ellipse cx="20" cy="17" rx="11" ry="9" fill={hi} opacity="0.55" clipPath={`url(#clip-${uid})`} />
              <ellipse cx="37" cy="33" rx="12" ry="10" fill={sh} opacity="0.45" clipPath={`url(#clip-${uid})`} />

              {/* gloss chips */}
              <rect x="17" y="12" width="3" height="3" fill="#fff" opacity="0.85" clipPath={`url(#clip-${uid})`} />

              {/* fruit, same hash rules as before */}
              {h % 5 === 0 && <circle cx="16" cy="22" r="2.6" fill="#e0524a" stroke="#7a1f1c" strokeWidth="1.2" clipPath={`url(#clip-${uid})`} />}
              {h % 7 === 0 && <circle cx="37" cy="20" r="2.6" fill="#e0524a" stroke="#7a1f1c" strokeWidth="1.2" clipPath={`url(#clip-${uid})`} />}
              {h % 13 === 0 && <circle cx="28" cy="31" r="3.4" fill="#ffd75e" stroke="#8a6a10" strokeWidth="1.4" clipPath={`url(#clip-${uid})`} />}
            </svg>
          </div>
        );
      } else if (tile === 10) { // Bridge — stays as DOM for dynamic z-index (sailing vs walking)
        visibleTiles.push(
          <div key={`br-${r}-${c}`} style={{
            position: "absolute", left: c * TILE, top: r * TILE,
            width: TILE + 1, height: TILE + 1,
            background: PALETTE.bridge[h % PALETTE.bridge.length],
            zIndex: isSailing ? r * 10 + 9 : r * 10 + 3,
          }}>
            {[0, 8, 16, 24].map(sx => (
              <div key={sx} style={{ position: "absolute", left: sx, top: 0, width: 1, height: TILE, background: "#5c3a18" }} />
            ))}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#5c3a18" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#5c3a18" }} />
          </div>
        );
      } else if (tile === 5) { // Pine Tree
        const PINE_PALETTES = isDry ? [
          ["#4a2c16", "#7d4a24", "#ad6a35", "#5c3619"],
          ["#3d2311", "#663b1b", "#94582a", "#4d2c14"],
          ["#5c341b", "#8f522a", "#c2733f", "#734120"],
        ] : [
          ["#0d3a1f", "#1a5c2a", "#3a8a4a", "#0f4a22"],
          ["#0a3018", "#166628", "#2d7a3c", "#0c3a1a"],
          ["#0f3322", "#1e6830", "#40905a", "#134428"],
        ];
        const PINE_SHAPES = [
          [{cx:20,cy:36,r:13},{cx:20,cy:26,r:11},{cx:20,cy:17,r:9},{cx:20,cy:9,r:6}],
          [{cx:20,cy:38,r:12},{cx:20,cy:28,r:10},{cx:20,cy:19,r:8},{cx:20,cy:11,r:5.5}],
          [{cx:20,cy:37,r:14},{cx:20,cy:27,r:11},{cx:20,cy:18,r:8},{cx:20,cy:10,r:5}],
        ];
        const puid = `p${r}-${c}`;
        const pCircles = PINE_SHAPES[h % PINE_SHAPES.length];
        const [pOutline, pBase, pHi, pSh] = PINE_PALETTES[h % PINE_PALETTES.length];
        const pFlip = h % 2 === 0;
        const pTags = pCircles.map(ci => <circle key={ci.cy} cx={ci.cx} cy={ci.cy} r={ci.r} />);
        visibleTiles.push(
          <div key={`${r}-${c}`} style={{
            position: "absolute", left: c * TILE - 4, top: r * TILE - 24,
            width: TILE + 8, height: TILE + 26,
            zIndex: r * 10 + 2, display: "flex", alignItems: "flex-end", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <svg viewBox="0 0 40 62" width="40" height="62"
                 style={{ transform: pFlip ? "scaleX(-1)" : "none", overflow: "visible" }}>
              <defs>
                <clipPath id={`pclip-${puid}`}>{pTags}</clipPath>
                <filter id={`pout-${puid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="d" />
                  <feFlood floodColor={pOutline} result="oc" />
                  <feComposite in="oc" in2="d" operator="in" result="op" />
                  <feMerge><feMergeNode in="op" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <ellipse cx="20" cy="58" rx="10" ry="3.5" fill="#000" opacity="0.22" />
              <rect x="17" y="46" width="3" height="12" fill="#6b4423" stroke="#2e1c0e" strokeWidth="1.4" />
              <rect x="20" y="46" width="3" height="12" fill="#4a2f18" stroke="#2e1c0e" strokeWidth="1.4" />
              <g filter={`url(#pout-${puid})`} fill={pBase}>{pTags}</g>
              <ellipse cx="16" cy="14" rx="6" ry="5" fill={pHi} opacity="0.5" clipPath={`url(#pclip-${puid})`} />
              <ellipse cx="24" cy="30" rx="7" ry="6" fill={pSh} opacity="0.4" clipPath={`url(#pclip-${puid})`} />
              <rect x="15" y="8" width="2" height="2" fill="#fff" opacity="0.7" clipPath={`url(#pclip-${puid})`} />
            </svg>
          </div>
        );
      } else if (tile === 7) { // Oak Tree
        const OAK_PALETTES = isDry ? [
          ["#4d311c", "#a86b32", "#cc8b4a", "#734522"],
          ["#3d2716", "#8f5726", "#b06e33", "#59361a"],
          ["#5c3a21", "#c28144", "#e8a864", "#8c562b"],
        ] : [
          ["#1a4d22", "#2d6a36", "#5aa060", "#1f5a28"],
          ["#174420", "#28603a", "#4a9050", "#1c5030"],
          ["#1a5028", "#38783e", "#60b068", "#245a30"],
        ];
        const OAK_SHAPES = [
          [{cx:24,cy:24,r:17},{cx:12,cy:26,r:12},{cx:36,cy:26,r:12},{cx:18,cy:14,r:10},{cx:30,cy:14,r:10},{cx:24,cy:34,r:13}],
          [{cx:24,cy:22,r:18},{cx:10,cy:28,r:11},{cx:38,cy:28,r:11},{cx:24,cy:12,r:10},{cx:24,cy:36,r:12}],
          [{cx:24,cy:25,r:16},{cx:14,cy:22,r:13},{cx:34,cy:22,r:13},{cx:20,cy:12,r:9},{cx:28,cy:12,r:9},{cx:24,cy:36,r:11}],
        ];
        const ouid = `o${r}-${c}`;
        const oCircles = OAK_SHAPES[h % OAK_SHAPES.length];
        const [oOutline, oBase, oHi, oSh] = OAK_PALETTES[h % OAK_PALETTES.length];
        const oFlip = h % 2 === 0;
        const oTags = oCircles.map(ci => <circle key={`${ci.cx},${ci.cy}`} cx={ci.cx} cy={ci.cy} r={ci.r} />);
        visibleTiles.push(
          <div key={`${r}-${c}`} style={{
            position: "absolute", left: c * TILE - 8, top: r * TILE - 22,
            width: TILE + 16, height: TILE + 24,
            zIndex: r * 10 + 2, display: "flex", alignItems: "flex-end", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <svg viewBox="0 0 48 62" width="48" height="62"
                 style={{ transform: oFlip ? "scaleX(-1)" : "none", overflow: "visible" }}>
              <defs>
                <clipPath id={`oclip-${ouid}`}>{oTags}</clipPath>
                <filter id={`oout-${ouid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d" />
                  <feFlood floodColor={oOutline} result="oc" />
                  <feComposite in="oc" in2="d" operator="in" result="op" />
                  <feMerge><feMergeNode in="op" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <ellipse cx="24" cy="58" rx="14" ry="4" fill="#000" opacity="0.25" />
              <rect x="20" y="44" width="4" height="14" fill="#6b4423" stroke="#2e1c0e" strokeWidth="1.5" />
              <rect x="24" y="44" width="4" height="14" fill="#4a2f18" stroke="#2e1c0e" strokeWidth="1.5" />
              <g filter={`url(#oout-${ouid})`} fill={oBase}>{oTags}</g>
              <ellipse cx="16" cy="15" rx="10" ry="8" fill={oHi} opacity="0.5" clipPath={`url(#oclip-${ouid})`} />
              <ellipse cx="32" cy="30" rx="10" ry="8" fill={oSh} opacity="0.4" clipPath={`url(#oclip-${ouid})`} />
              <rect x="14" y="10" width="3" height="3" fill="#fff" opacity="0.7" clipPath={`url(#oclip-${ouid})`} />
              {h % 4 === 0 && <circle cx="14" cy="28" r="2.5" fill="#8a6a30" stroke="#5a4020" strokeWidth="1" clipPath={`url(#oclip-${ouid})`} />}
              {h % 9 === 0 && <circle cx="34" cy="24" r="2.5" fill="#8a6a30" stroke="#5a4020" strokeWidth="1" clipPath={`url(#oclip-${ouid})`} />}
            </svg>
          </div>
        );
      }

      // Saad NPC
      if (r === 22 && c === 9) {
        const isNearNpc = Math.abs(9 - pos.col) <= 1 && Math.abs(22 - pos.row) <= 1;
        visibleTiles.push(
          <div key="saad-npc" style={{
            position: "absolute", left: 9 * TILE, top: 22 * TILE,
            width: TILE, height: TILE, zIndex: 22 * 10 + 3, pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute", bottom: 4, left: 0,
              filter: isNearNpc && phase === "free" ? "drop-shadow(0 0 6px rgba(255,255,255,0.6))" : "none",
              transition: "filter 0.2s",
            }}>
              <SaadSprite direction="down" />
            </div>
          </div>
        );
      }

    }
  }

  // Determine if boat is near a bridge or dock — if so, drop it behind land tiles but above dock
  const bRow = isSailing ? pos.row : boatPos.row;
  const bCol = isSailing ? pos.col : boatPos.col;
  let nearStructure = false;
  for (let dr = -2; dr <= 2 && !nearStructure; dr++) {
    for (let dc = -2; dc <= 2 && !nearStructure; dc++) {
      const tr = Math.floor(bRow) + dr;
      const tc = Math.floor(bCol) + dc;
      if (MAP[tr]?.[tc] === 10 || MAP[tr]?.[tc] === 11) nearStructure = true;
    }
  }
  const boatSailZ = nearStructure ? -3 : Math.floor(bRow) * 10 + 4;
  const playerZ   = (isSailing && nearStructure) ? -2 : pos.row * 10 + 5;
  const boatHullZ = nearStructure ? -1 : Math.floor(bRow) * 10 + 8;

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#000",
      fontFamily: "'Micro 5', monospace", userSelect: "none",
      
      boxSizing: "border-box", height: "100dvh", width: "100dvw", }}>
      <title>Village Hub | Saad Ibra</title>
      <meta name="description" content="Explore the village hub of Nomadsland. Find the Library, Chemistry Lab, Newsroom, and my Home." />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingBottom: isConsoleMinimized ? 64 : 0 }}>
      <style>{`
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dialogSlideIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes keycapGlow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
        @keyframes beaconFlash { 0%,49%{opacity:1;box-shadow:0 0 8px 4px rgba(255,204,0,0.9)} 50%,100%{opacity:0.15;box-shadow:none} }
        @keyframes glowPulse { from { opacity: 0.5; transform: translateX(-50%) scale(1); } to { opacity: 1; transform: translateX(-50%) scale(1.1); } }
        @keyframes floatBoat { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-3px) rotate(2deg); } }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: `scale(${scale})`, transformOrigin: "center",
        imageRendering: "pixelated",
      }}>

        {/* ── GAME VIEWPORT ── */}
        <div style={{
          position: "relative", width: internalW, height: internalH,
          overflow: "hidden", background: PALETTE.water[0],
          boxShadow: "0 0 0 4px #1a5580",
          imageRendering: "pixelated",
        }}>

          {/* Scrolling world layer — positioned by RAF via ref, not React state */}
          <div ref={worldRef} onPointerDown={handleWorldTap} style={{
            position: "absolute",
            width: MAP_COLS * TILE, height: MAP_ROWS * TILE,
            transform: `translate(${-Math.round(camRef.current.x)}px, ${-Math.round(camRef.current.y)}px)`,
            willChange: "transform",
            zIndex: 1
          }}>
            <canvas ref={waterCanvasRef} style={{ position: "absolute", left: 0, top: 0, zIndex: -10, pointerEvents: "none" }} />
            <canvas ref={landCanvasRef} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} />
            {/* Tap-to-move visual marker */}
            <TapMarker tapTarget={tapTarget} TILE={TILE} isSailing={isSailing} />
            
            {visibleTiles}

            {/* Render Buildings */}
            {SHOPS.map(shop => (
              <Building key={shop.id} shop={shop} isNear={nearShop === shop.id} />
            ))}

            {/* Player */}
            <div style={{
              position: "absolute", left: pos.col * TILE, top: pos.row * TILE, 
              transition: isTransitioning ? "none" : isSailing ? "left 0.09s linear, top 0.09s linear" : "left 0.14s linear, top 0.14s linear",
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: playerZ,
              animation: isSailing ? "floatBoat 4s ease-in-out infinite" : "none",
              animationDelay: isSailing ? `-${(sailStartTime - mountTime) % 4000}ms` : "0ms",
            }}>
              {/* Pixel drop shadow */}
              <div style={{ position: "absolute", bottom: 2, left: "50%", marginLeft: -7, width: 14, height: 4, background: "rgba(0,0,0,0.25)", zIndex: -1 }} />
              <PlayerSprite direction={facing} stepping={stepping} costume="casual" />
            </div>
            
            {/* Wakes */}
            {wakes.map((w, i) => {
              const age = wakes.length - i;
              const tileType = MAP[w.r]?.[w.c];
              if (tileType !== 4) return null; // Only show on water tiles
              
              return (
                <div key={w.id} style={{
                  position: "absolute", left: (w.c + 0.5) * TILE - 3, top: (w.r + 0.5) * TILE - 3,
                  width: 6, height: 6, background: "#fff", borderRadius: "50%",
                  opacity: Math.max(0, 0.4 - (age / 8) * 0.4),
                  transform: `scale(${1 + (age / 8) * 1.5})`,
                  zIndex: 1, pointerEvents: "none"
                }} />
              );
            })}

            {/* ── MOORED BOAT (HULL) ── */}
            <div style={{
              position: "absolute",
              left: (isSailing ? pos.col - 0.5 : boatPos.col) * TILE,
              top: (isSailing ? pos.row : boatPos.row) * TILE,
              transition: isTransitioning ? "none" : isSailing ? "left 0.09s linear, top 0.09s linear" : "left 0.14s linear, top 0.14s linear",
              width: TILE * 2, height: TILE * 1.5,
              animation: "floatBoat 4s ease-in-out infinite",
              zIndex: boatHullZ,
              pointerEvents: "auto", cursor: "pointer",
            }} onClick={(e) => { 
              e.stopPropagation();
              if (!isSailing) {
                const adjs = [
                  {c: boatPos.col, r: boatPos.row + 1}, {c: boatPos.col, r: boatPos.row - 1},
                  {c: boatPos.col - 1, r: boatPos.row}, {c: boatPos.col + 1, r: boatPos.row},
                  {c: boatPos.col - 2, r: boatPos.row}, {c: boatPos.col + 2, r: boatPos.row}
                ];
                let dockCol = -1, dockRow = -1;
                for (let adj of adjs) {
                  if (MAP[adj.r]?.[adj.c] === 11) {
                    dockCol = adj.c; dockRow = adj.r; break;
                  }
                }
                if (dockCol !== -1) {
                  const path = findPath(pos.col, pos.row, dockCol, dockRow, canWalk, MAP_COLS, MAP_ROWS);
                  if (path.length > 0) setPath(path);
                }
              }
            }}>
              <div style={{ transform: getBoatTransform(), width: "100%", height: "100%", transition: "transform 0.2s" }}>
                {(!isSailing || facing === "left" || facing === "right") && (
                  <div style={{ position: "absolute", bottom: 4, left: 4, width: TILE*2 - 8, height: 14, background: "#a05a2c", border: "2px solid #3a1c0a", borderRadius: "4px 4px 14px 14px", boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.3)" }} />
                )}
                {isSailing && facing === "down" && (
                  <div style={{ position: "absolute", bottom: 4, left: TILE - 10, width: 20, height: 18, background: "#a05a2c", border: "2px solid #3a1c0a", borderRadius: "4px 4px 18px 18px", boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.3)" }} />
                )}
                {isSailing && facing === "up" && (
                  <div style={{ position: "absolute", bottom: 4, left: TILE - 10, width: 20, height: 14, background: "#a05a2c", border: "2px solid #3a1c0a", borderRadius: "4px", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3)" }} />
                )}
              </div>
            </div>

            {/* ── MOORED BOAT (SAIL & MAST) ── */}
            <div style={{
              position: "absolute",
              left: (isSailing ? pos.col - 0.5 : boatPos.col) * TILE,
              top: (isSailing ? pos.row : boatPos.row) * TILE,
              transition: isTransitioning ? "none" : isSailing ? "left 0.09s linear, top 0.09s linear" : "left 0.14s linear, top 0.14s linear",
              width: TILE * 2, height: TILE * 1.5,
              animation: "floatBoat 4s ease-in-out infinite",
              zIndex: boatSailZ,
              pointerEvents: "none",
            }}>
              <div style={{ transform: getBoatTransform(), width: "100%", height: "100%", transition: "transform 0.2s" }}>
                {(!isSailing || facing === "left" || facing === "right") && (
                  <>
                    <div style={{ position: "absolute", bottom: 18, left: TILE - 2, width: 4, height: 32, background: "#d4a520", border: "2px solid #3a1c0a", borderRadius: 2 }} />
                    <div style={{ position: "absolute", bottom: 22, left: TILE, width: 22, height: 20, background: "#f8f8f8", border: "2px solid #3a1c0a", borderRadius: "0 16px 16px 0", boxShadow: "inset -4px 0 0 rgba(0,0,0,0.1)" }} />
                  </>
                )}
                {isSailing && facing === "down" && (
                  <>
                    <div style={{ position: "absolute", bottom: 18, left: TILE - 2, width: 4, height: 32, background: "#d4a520", border: "2px solid #3a1c0a", borderRadius: 2 }} />
                    <div style={{ position: "absolute", bottom: 22, left: TILE - 14, width: 28, height: 20, background: "#f8f8f8", border: "2px solid #3a1c0a", borderRadius: "14px 14px 4px 4px", boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.1)" }} />
                  </>
                )}
                {isSailing && facing === "up" && (
                  <>
                    <div style={{ position: "absolute", bottom: 22, left: TILE - 14, width: 28, height: 20, background: "#e8e8e8", border: "2px solid #3a1c0a", borderRadius: "14px 14px 4px 4px", boxShadow: "inset 0 4px 0 rgba(0,0,0,0.05)" }} />
                    <div style={{ position: "absolute", bottom: 42, left: TILE - 2, width: 4, height: 8, background: "#d4a520", border: "2px solid #3a1c0a", borderRadius: "2px 2px 0 0" }} />
                  </>
                )}
              </div>
            </div>


          </div>

          {/* ── DUSK OVERLAY ── */}
          <div style={{
            position: "absolute", inset: 0,
            background: "#ff8a50", mixBlendMode: "multiply", opacity: 0.4,
            pointerEvents: "none", zIndex: 4000,
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "#603080", mixBlendMode: "overlay", opacity: 0.3,
            pointerEvents: "none", zIndex: 4001,
          }} />

          {/* ── MINIMAP ── */}
          {phase === "free" && (
            <div style={{
              position: "absolute", top: 6, right: 6, zIndex: 5000,
              background: "rgba(0,0,0,0.7)", border: "2px solid rgba(255,255,255,0.3)",
              borderRadius: 4, padding: 3, pointerEvents: "auto",
            }}>
              <svg
                width={MAP_COLS * 2} height={MAP_ROWS * 2}
                viewBox={`0 0 ${MAP_COLS} ${MAP_ROWS}`}
                style={{ display: "block", imageRendering: "pixelated" }}
              >
                {/* Map tiles — pre-computed once, never changes */}
                {minimapTiles}
                {/* Building markers — clickable */}
                {SHOPS.map(shop => {
                  const colors = {
                    newsroom: "#4285F4", library: "#EF5350",
                    musicroom: "#D946EF", lab: "#00E676",
                    nomadshome: "#FFCA28", dock: "#FF9800",
                  };
                  // Music room is now unlocked and colored
                  const isLocked = false;
                  return (
                    <rect
                      key={shop.id}
                      x={shop.col - 2} y={shop.row - 2}
                      width={5} height={3}
                      fill={isLocked ? "#554422" : (colors[shop.id] || "#fff")}
                      stroke={isLocked ? "#886633" : "#fff"} strokeWidth={0.3}
                      strokeDasharray={isLocked ? "1 0.5" : undefined}
                      style={{ cursor: "pointer", opacity: isLocked ? 0.65 : 1 }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        const teleport = () => {
                          if (isSailing) {
                            setIsSailing(false);
                            setBoatPos({ col: 27.5, row: 28 });
                          }
                          if (shop.id === "dock") {
                            setPos({ col: 29, row: 27 });
                          } else {
                            setPos({ col: shop.col, row: shop.row + 1 });
                          }
                          setNearShop(shop.id === "dock" ? null : shop.id);
                        };
                        
                        if (triggerTransition) {
                          triggerTransition(teleport);
                        } else {
                          teleport();
                        }
                      }}
                    />
                  );
                })}
                {/* Player dot */}
                <circle cx={pos.col + 0.5} cy={pos.row + 0.5} r={0.8} fill="#fff" stroke="#000" strokeWidth={0.3} />
              </svg>
            </div>
          )}

          {/* Proximity prompt */}
          {phase === "free" && (activeShop || isOnBoat || isNearDockWhileSailing || (isStandingOnDock && !isOnBoat) || (Math.abs(pos.col - 9) <= 1 && Math.abs(pos.row - 22) <= 1)) && (
            <div 
              onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(); }}
              style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", padding: "5px 12px",
              background: "#f8f8f8", border: `2px solid #302820`, borderRadius: 4,
              zIndex: 6000, pointerEvents: "auto", cursor: "pointer", display: "flex", gap: 8, alignItems: "center",
              boxShadow: `0 4px 0 rgba(0,0,0,0.2)`, whiteSpace: "nowrap", color: "#302820"
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 10.5, color: "#302820" }}>
                {(Math.abs(pos.col - 9) <= 1 && Math.abs(pos.row - 22) <= 1) && <span>TALK TO SAAD</span>}
                {(! (Math.abs(pos.col - 9) <= 1 && Math.abs(pos.row - 22) <= 1)) && activeShop && <><DoorOpen size={8} /><span>ENTER {activeShop.label}</span></>}
                {(! (Math.abs(pos.col - 9) <= 1 && Math.abs(pos.row - 22) <= 1)) && isOnBoat && <span>SAIL BOAT</span>}
                {(! (Math.abs(pos.col - 9) <= 1 && Math.abs(pos.row - 22) <= 1)) && isNearDockWhileSailing && <span>DROP ANCHOR</span>}
                {(! (Math.abs(pos.col - 9) <= 1 && Math.abs(pos.row - 22) <= 1)) && isStandingOnDock && !isOnBoat && <span>SUMMON & SAIL</span>}
              </div>
              <div style={{ fontSize: 10, color: "#fff", background: "#302820", padding: "2px 5px", borderRadius: 2 }}>SPACE/A</div>
            </div>
          )}

          {/* Intro dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", top: 16, left: 8, right: 8, padding: "18px 14px 10px",
              background: "#f8f8f8", border: "2px solid #302820", borderRadius: 4,
              boxShadow: "0 6px 0 rgba(0,0,0,0.3)", zIndex: 6000, animation: "dialogSlideIn 0.3s ease-out"
            }}>
              <div style={{ position: "absolute", top: 3, right: 3, width: 4, height: 4, borderRight: "2px solid #302820", borderTop: "2px solid #302820", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 3, left: 3, width: 4, height: 4, borderLeft: "2px solid #302820", borderBottom: "2px solid #302820", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 3, right: 3, width: 4, height: 4, borderRight: "2px solid #302820", borderBottom: "2px solid #302820", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{
                position: "absolute", top: -10, left: 54, background: "#d84040", border: "2px solid #302820",
                padding: "2px 8px", fontSize: 12, color: "#fff", borderRadius: 2,
              }}>SAAD IBRA</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <img src="/favicon.svg" alt="" draggable={false} style={{
                  width: 30, height: 30, minWidth: 30,
                  imageRendering: "pixelated", borderRadius: 2, marginTop: 1,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, lineHeight: 2.4, minHeight: 28, color: "#302820" }}>
                    This is the village. Each building leads to a different part of my work. Walk up to any door and press{' '}
                    <span style={{ display: "inline-block", background: "#302820", border: "1px solid #504030", borderBottomWidth: 2, borderBottomColor: "#1a1410", padding: "1px 4px", borderRadius: 2, fontFamily: "'Micro 5', monospace", color: "#fff", boxShadow: "0 1px 0 #1a1410", margin: "0 2px", whiteSpace: "nowrap", animation: "keycapGlow 2s ease-in-out infinite" }}>SPACE</span>
                    {' '}to step inside.
                    <span style={{ animation: "dialogBlink 0.5s step-end infinite" }}>&#x258A;</span>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button onPointerDown={(e) => { e.preventDefault(); setPhase("free"); }} style={{
                      fontFamily: "'Micro 5', monospace", fontSize: 12, background: "#408ad8", color: "#fff",
                      border: "2px solid #302820", padding: "6px 12px", borderRadius: 4, cursor: "pointer",
                      boxShadow: "0 2px 0 #302820", display: "flex", alignItems: "center",
                    }}>
                      <span style={{ fontSize: 10, color: "#302820", marginRight: 8, background: "rgba(255,255,255,0.4)", padding: "2px 4px", borderRadius: 2 }}>SPACE/A</span>
                      GOT IT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      </div>
      <ControlBar />
    </div>
  );
}
