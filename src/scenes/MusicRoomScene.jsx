"use client";
import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { useSmoothPixelGrid } from '../hooks/useSmoothPixelGrid.js';
import { useViewport } from '../hooks/useViewport.js';
import { getSharedAudioCtx } from '../engine/sfx.js';
import { ArrowLeft } from "lucide-react";
import { TILE } from '../engine/constants';
import PlayerSprite from "../components/sprites/PlayerSprite";
import SaadSprite from "../components/sprites/SaadSprite";
import ControlBar from "../components/ui/ControlBar";
import ExitDoor from "../components/sprites/ExitDoor";
import DialogueBox from "../components/ui/DialogueBox";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { useTapToMove, TapMarker } from "../hooks/useTapToMove.jsx";
import { playWoodStep } from "../engine/sfx";
import { useGame } from '../context/GameContext.jsx';

const MAP_COLS = 24;
const MAP_ROWS = 18;
const MAP = Array.from({ length: MAP_ROWS }, (_, r) => 
  Array.from({ length: MAP_COLS }, (_, c) => {
    if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) return 2; // walls
    if (c >= 6 && c <= 18 && r >= 6 && r <= 12) return 3; // studio rug
    return 1; // floor
  })
);

const NPC_POS = { col: 6, row: 8 };
const DIALOGUE_LINES = [
  "Welcome to the studio.",
  "I'm working on an 8-bit cover of 'Follow You' by Bring Me The Horizon.",
  "Take a look around. The mixing desk is visualizing the track right now."
];

// === BMTH FOLLOW YOU 8-BIT SYNTH ENGINE ===
const FREQ = {
  "E2": 82.41, "F#2": 92.50, "G#2": 103.83, "A2": 110.00, "B2": 123.47, "C#3": 138.59, "D3": 146.83,
  "E3": 164.81, "F#3": 185.00, "G#3": 207.65, "A3": 220.00, "B3": 246.94, "C#4": 277.18, "D4": 293.66, "E4": 329.63,
  "F#4": 369.99, "G#4": 415.30, "A4": 440.00, "B4": 493.88
};

const MELODY = [
  { n: "C#4", t: 0, l: 0.5 }, { n: "C#4", t: 0.5, l: 0.5 }, { n: "C#4", t: 1, l: 0.5 }, { n: "B3",  t: 1.5, l: 0.5 },
  { n: "A3",  t: 2, l: 0.5 }, { n: "F#3", t: 2.5, l: 0.5 }, { n: "F#3", t: 3, l: 1 },
  { n: "F#3", t: 4, l: 0.5 }, { n: "C#4", t: 4.5, l: 0.5 }, { n: "C#4", t: 5, l: 0.5 }, { n: "B3",  t: 5.5, l: 0.5 },
  { n: "A3",  t: 6, l: 0.5 }, { n: "B3",  t: 6.5, l: 0.5 }, { n: "A3",  t: 7, l: 1 },
  { n: "A3",  t: 8, l: 0.5 }, { n: "A3",  t: 8.5, l: 0.5 }, { n: "B3",  t: 9, l: 0.5 }, { n: "C#4", t: 9.5, l: 1.5 },
  { n: "A3",  t: 11, l: 0.5 }, { n: "C#4", t: 11.5, l: 0.5 }, { n: "B3",  t: 12, l: 0.5 }, { n: "A3",  t: 12.5, l: 0.5 },
  { n: "F#3", t: 13, l: 0.5 }, { n: "F#3", t: 13.5, l: 1.5 }
];

const CHORDS = [
  { root: "F#2", third: "A2", fifth: "C#3", t: 0, l: 4 },
  { root: "D3", third: "F#3", fifth: "A3", t: 4, l: 4 },
  { root: "A2", third: "C#3", fifth: "E3", t: 8, l: 4 },
  { root: "E2", third: "G#2", fifth: "B2", t: 12, l: 4 }
];

const MELODY_STEPS = new Array(64).fill(null);
MELODY.forEach(m => { MELODY_STEPS[Math.round(m.t * 4)] = { n: m.n, len: Math.round(m.l * 4) }; });

const CHORD_STEPS = new Array(64).fill(null);
CHORDS.forEach(c => { CHORD_STEPS[Math.round(c.t * 4)] = { root: c.root, third: c.third, fifth: c.fifth, len: Math.round(c.l * 4) }; });


function MusicRoomScene() {
  const { speedMultiplier, isLandscape, isTransitioning, changeScene, isConsoleMinimized, musicPlaying, musicMuted, musicVolume } = useGame();
  const viewport = useViewport(isLandscape, isConsoleMinimized);
  const { scale, internalW, internalH } = viewport;
  const [phase, setPhase] = useState("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const containerRef = useRef(null);
  const musicRef = useRef({ audioCtx: null, interval: null });

  // === BACKGROUND MUSIC LOOP ===
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = getSharedAudioCtx();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const t = ctx.currentTime;
      const si = idx % 64; // 64 sixteenth notes in a 16-beat loop
      const beatLen = 60 / 90; // 90 BPM = 0.666s per beat
      const stepLen = beatLen / 4; // ~0.166s per 16th note

      // Helper to schedule notes
      const scheduleNote = (freq, type, duration, amp) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(amp * vol, t + 0.02);
        gain.gain.setValueAtTime(amp * vol, t + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
      };

      // Play Melody
      const mNote = MELODY_STEPS[si];
      if (mNote && FREQ[mNote.n]) {
        scheduleNote(FREQ[mNote.n], "square", mNote.len * stepLen, 0.1);
      }

      // Play Chords
      const cNote = CHORD_STEPS[si];
      if (cNote) {
        [cNote.root, cNote.third, cNote.fifth].forEach(n => {
          if (FREQ[n]) scheduleNote(FREQ[n], "sawtooth", cNote.len * stepLen, 0.05);
        });
      }

      // Continuous Arpeggio over the chords (every 16th note)
      // Find active chord
      const activeChordIdx = Math.floor(si / 16); // 16 steps per chord
      const c = CHORDS[activeChordIdx];
      if (c) {
         const arpNotes = [c.root, c.third, c.fifth, c.third];
         const n = arpNotes[si % 4];
         if (FREQ[n]) scheduleNote(FREQ[n] * 2, "sine", stepLen, 0.03);
      }

      // Drums
      // Kick on every beat (steps 0, 4, 8, 12...)
      if (si % 4 === 0) {
        const kOsc = ctx.createOscillator();
        const kGain = ctx.createGain();
        kOsc.frequency.setValueAtTime(150, t);
        kOsc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
        kGain.gain.setValueAtTime(0.5 * vol, t);
        kGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        kOsc.connect(kGain);
        kGain.connect(ctx.destination);
        kOsc.start(t);
        kOsc.stop(t + 0.5);
      }
      
      // Snare on beat 2 and 4 (steps 4, 12, 20, 28...)
      if (si % 8 === 4) {
         const nOsc = ctx.createOscillator();
         const nGain = ctx.createGain();
         nOsc.type = "square";
         nOsc.frequency.setValueAtTime(200, t);
         nGain.gain.setValueAtTime(0.2 * vol, t);
         nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
         nOsc.connect(nGain);
         nGain.connect(ctx.destination);
         nOsc.start(t);
         nOsc.stop(t + 0.2);
      }

    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(((60 / 90) / 4) * 1000 / speedMultiplier);
    musicRef.current.interval = setInterval(() => {
      playStep(step++, musicVolume, musicMuted);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);


  const isWalkable = (c, r) => {
    if (c === NPC_POS.col && r === NPC_POS.row) return false;
    if (c < 1 || c >= MAP_COLS - 1 || r < 1 || r >= MAP_ROWS - 1) return false;
    // Mixing Desk
    if (c >= 9 && c <= 15 && r >= 4 && r <= 5) return false;
    // Speakers
    if ((c === 8 || c === 16) && r === 4) return false;
    // Drum Kit
    if (c >= 18 && c <= 21 && r >= 12 && r <= 15) return false;
    // Guitars on stands
    if (c >= 3 && c <= 5 && r >= 13 && r <= 15) return false;
    // Vinyl Crates
    if (c >= 20 && c <= 22 && r >= 2 && r <= 4) return false;
    return true;
  };

  const { pos, facing, stepping, setPath, tapTarget, triggerAction } = usePlayerMovement({
    initialPos: { col: 3, row: 2 },
    isActive: phase === "free" && !isTransitioning,
    canWalk: isWalkable,
    speedMultiplier,
    onBump: (c, r) => {
      if (c === 3 && r === 0) changeScene('village');
    },
    onMove: () => { playWoodStep(); return false; },
    onAction: () => {
      let checkR = pos.row; let checkC = pos.col;
      if (facing === "up") checkR--; else if (facing === "down") checkR++; else if (facing === "left") checkC--; else if (facing === "right") checkC++;
      
      if (checkC === NPC_POS.col && checkR === NPC_POS.row) {
        setDialogueIndex(0); setPhase("talking"); return;
      }
    }
  });

  const playerRef = useRef(null);
  const worldRef = useRef(null);
  useSmoothPixelGrid({ pos, internalW, internalH, mapCols: MAP_COLS, mapRows: MAP_ROWS, speedMultiplier, worldRef, playerRef });
  const handleWorldTap = useTapToMove(worldRef, pos, isWalkable, setPath, MAP_COLS, MAP_ROWS, phase === "free" && !isTransitioning);

  const activePrompt = useMemo(() => {
    if (phase !== "free" || isTransitioning) return null;
    let checkR = pos.row; let checkC = pos.col;
    if (facing === "up") checkR--; else if (facing === "down") checkR++; else if (facing === "left") checkC--; else if (facing === "right") checkC++;
    
    if (checkC === NPC_POS.col && checkR === NPC_POS.row) return "TALK TO SAAD";
    if (checkC >= 3 && checkC <= 5 && checkR >= 13 && checkR <= 15) return "GUITARS";
    if (checkC >= 18 && checkC <= 21 && checkR >= 12 && checkR <= 15) return "DRUM KIT";
    if (checkC >= 20 && checkC <= 22 && checkR >= 2 && checkR <= 4) return "VINYL CRATES";
    
    return null;
  }, [pos, facing, phase, isTransitioning]);

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#000", fontFamily: "'Micro 5', monospace", userSelect: "none", boxSizing: "border-box", height: "100dvh", width: "100dvw",
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", paddingBottom: isConsoleMinimized ? 64 : 0 }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center", imageRendering: "pixelated" }}>
          <div style={{ position: "relative", width: internalW, height: internalH, overflow: "hidden", background: "#111", boxShadow: isConsoleMinimized ? "none" : "0 0 0 4px #222" }}>
            
            <div ref={worldRef} onPointerDown={handleWorldTap} style={{ position: "absolute", transform: "translate(0px, 0px)", willChange: "transform", width: MAP_COLS * TILE, height: MAP_ROWS * TILE }}>
              <TapMarker tapTarget={tapTarget} TILE={TILE} />
              <StaticWorld musicPlaying={musicPlaying} />
              <ExitDoor col={3} row={0} />

              <div style={{
                position: "absolute", left: NPC_POS.col * TILE, top: NPC_POS.row * TILE, width: TILE, height: TILE,
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: NPC_POS.row * 10,
                filter: (Math.abs(NPC_POS.col - pos.col) <= 1 && Math.abs(NPC_POS.row - pos.row) <= 1) ? "drop-shadow(0 0 6px rgba(218,165,32,0.6))" : "none",
                transition: "filter 0.2s",
              }}>
                <SaadSprite direction="left" />
              </div>

              <div ref={playerRef} style={{
                position: "absolute", left: 0, top: 0, willChange: "transform", width: TILE, height: TILE, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
              }}>
                <PlayerSprite direction={facing} stepping={stepping} costume="casual" />
              </div>
            </div>
            
          {activePrompt && (
            <div 
              onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(); }}
              style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", padding: "4px 8px",
              background: "rgba(10,10,20,0.85)", border: "2px solid #DAA520", borderRadius: 4,
              zIndex: 6000, pointerEvents: "auto", cursor: "pointer", display: "flex", gap: 8, alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.6)", whiteSpace: "nowrap"
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: "#DAA520" }}>
                <span>{activePrompt}</span>
              </div>
              <div style={{ fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.4)", padding: "2px 4px", borderRadius: 2 }}>SPACE/A</div>
            </div>
          )}

            <button onClick={() => changeScene('village')} style={{
              position: "absolute", top: 8, left: 8, fontFamily: "'Micro 5', monospace", fontSize: 12,
              background: "#222", color: "#fff", border: "2px solid #fff", padding: "4px 8px", cursor: "pointer", pointerEvents: "auto", zIndex: 500
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={6} /> VILLAGE</div>
            </button>

            {(phase === "intro" || phase === "talking") && (
              <DialogueBox lines={DIALOGUE_LINES} lineIndex={dialogueIndex} onAdvance={() => setDialogueIndex(i => i + 1)} onDismiss={() => setPhase("free")} speaker="SAAD IBRA" theme="music" lastButtonLabel="GOT IT" />
            )}
            
            <style>{`
              @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
              @keyframes npcBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
              @keyframes eqBounce { 0% { height: 10%; } 100% { height: 95%; } }
            `}</style>
          </div>
        </div>
      </div>
      <ControlBar />
    </div>
  );
}

const StaticWorld = memo(({ musicPlaying }) => (
  <>
    {/* Floor */}
    <div style={{ position: "absolute", left: TILE, top: TILE, width: (MAP_COLS-2)*TILE, height: (MAP_ROWS-2)*TILE, background: "#2C1B18" }}>
        {Array.from({ length: MAP_ROWS - 2 }).map((_, r) => (
          <div key={r} style={{ position: "absolute", top: r * TILE, left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.3)" }} />
        ))}
        {/* Studio Rug */}
        <div style={{ position: "absolute", left: 5*TILE, top: 5*TILE, width: 13*TILE, height: 7*TILE, background: "#1A1A1A", border: "2px solid #333", borderRadius: 8 }}>
          <div style={{ position: "absolute", inset: 4, background: "#222", borderRadius: 4 }} />
        </div>
    </div>
    
    {/* Walls */}
    <div style={{ position: "absolute", left: TILE, top: 0, width: (MAP_COLS-2)*TILE, height: TILE, background: "#3A3A3A", borderBottom: "4px solid #111", display: "flex" }}>
        {Array.from({ length: MAP_COLS - 2 }).map((_, c) => (
          <div key={c} style={{ flex: 1, borderRight: "1px solid #222", borderLeft: "1px solid #444", background: c % 2 === 0 ? "#333" : "#3A3A3A" }} />
        ))}
    </div>
    
    {/* Mixing Desk */}
    <div style={{ position: "absolute", left: 9*TILE, top: 4*TILE, width: 7*TILE, height: 2*TILE, background: "#222", border: "2px solid #000", borderRadius: 4, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        {/* Mixing Screen (Animated Equalizer) */}
        <div style={{ width: 64, height: 32, background: "#111", border: "1px solid #444", display: "flex", flexDirection: "column", gap: 2, padding: 2, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 2, flex: 1, alignItems: "flex-end" }}>
              {Array.from({length: 14}).map((_,i) => (
                <div key={i} style={{ 
                  flex: 1, 
                  background: i % 4 === 0 ? "#ef4444" : (i % 2 === 0 ? "#f59e0b" : "#10b981"), 
                  height: "20%",
                  animation: musicPlaying ? `eqBounce ${0.2 + (i%5)*0.1}s infinite alternate ease-in-out` : "none" 
                }} />
              ))}
          </div>
        </div>
        <div style={{ position: "absolute", top: 2.2*TILE, left: "50%", transform: "translateX(-50%)", width: 24, height: 24, background: "#1A1A1A", borderRadius: "50%", border: "2px solid #000" }} />
    </div>
    
    {/* Left Monitor */}
    <div style={{ position: "absolute", left: 8*TILE, top: 4*TILE, width: TILE, height: TILE, background: "#111", border: "2px solid #000" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: "#222", border: "1px solid #000" }} />
    </div>
    {/* Right Monitor */}
    <div style={{ position: "absolute", left: 16*TILE, top: 4*TILE, width: TILE, height: TILE, background: "#111", border: "2px solid #000" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: "#222", border: "1px solid #000" }} />
    </div>

    {/* Drum Kit */}
    <div style={{ position: "absolute", left: 18*TILE, top: 12*TILE, width: 4*TILE, height: 4*TILE }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 40, height: 40, background: "#EEE", border: "4px solid #8B0000", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 4, top: 20, width: 24, height: 24, background: "#FFF", border: "2px solid #CCC", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 0, top: 4, width: 20, height: 20, background: "#DAA520", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 28, height: 28, background: "#DAA520", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 8, bottom: 8, width: 30, height: 30, background: "#EEE", border: "4px solid #8B0000", borderRadius: "50%" }} />
    </div>

    {/* Guitars */}
    <div style={{ position: "absolute", left: 3*TILE, top: 13*TILE, width: 3*TILE, height: 3*TILE, display: "flex", gap: 8 }}>
        <div style={{ width: 16, height: 48, background: "#111", borderRadius: 8, position: "relative", transform: "rotate(15deg)" }}>
          <div style={{ position: "absolute", left: 6, top: -16, width: 4, height: 24, background: "#D2B48C" }} />
        </div>
        <div style={{ width: 18, height: 50, background: "#8B0000", borderRadius: 8, position: "relative", transform: "rotate(-10deg)" }}>
          <div style={{ position: "absolute", left: 7, top: -20, width: 4, height: 28, background: "#D2B48C" }} />
        </div>
    </div>

    {/* Vinyl Crates */}
    <div style={{ position: "absolute", left: 20*TILE, top: 2*TILE, width: 3*TILE, height: 3*TILE, background: "#8B4513", border: "2px solid #5C3A21", display: "flex", flexWrap: "wrap", padding: 4, gap: 2 }}>
        {Array.from({length: 6}).map((_,i) => <div key={i} style={{ width: 12, height: 24, background: ["#FFD700", "#FF4500", "#1E90FF", "#32CD32"][i%4], border: "1px solid #000" }} />)}
    </div>
  </>
));

export default MusicRoomScene;
