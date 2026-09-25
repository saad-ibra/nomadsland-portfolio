"use client";
import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import { useSmoothPixelGrid } from '../hooks/useSmoothPixelGrid.js';
import { useViewport } from '../hooks/useViewport.js';
import { getSharedAudioCtx } from '../engine/sfx.js';
import { ArrowLeft, Play, Square, Disc } from "lucide-react";
import { TILE } from '../engine/constants';
import PlayerSprite from "../components/sprites/PlayerSprite";
import SaadSprite from "../components/sprites/SaadSprite";
import ControlBar from "../components/ui/ControlBar";
import ExitDoor from "../components/sprites/ExitDoor";
import DialogueBox from "../components/ui/DialogueBox";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { useTapToMove, TapMarker } from "../hooks/useTapToMove.jsx";
import { playWoodStep, playBlip } from "../engine/sfx";
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
  "I've got a gamified 8-bit cover of 'Follow You' loaded on the mixing desk.",
  "Check it out when you're ready."
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

function SynthPlayerModal({ onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visualizerBars, setVisualizerBars] = useState(Array(16).fill(0));
  
  const ctxRef = useRef(null);
  const startTimeRef = useRef(0);
  const animRef = useRef(null);
  const activeNodesRef = useRef([]); // To keep track and stop them
  const loopLength = 16;
  const bpm = 90;
  const beatLen = 60 / bpm; // 0.666 seconds per beat

  const scheduleNote = (ctx, freq, type, time, duration, vol) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    // Envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.05);
    gain.gain.setValueAtTime(vol, time + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration);
    
    activeNodesRef.current.push({ osc, gain });
  };

  const playSequence = () => {
    stopSequence(); // Ensure we clear anything first
    
    if (!ctxRef.current) ctxRef.current = getSharedAudioCtx();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    
    setIsPlaying(true);
    startTimeRef.current = ctx.currentTime;
    
    // Schedule one loop
    const t0 = ctx.currentTime + 0.1;

    // Schedule Melody (Square wave)
    MELODY.forEach(note => {
      if (FREQ[note.n]) scheduleNote(ctx, FREQ[note.n], "square", t0 + note.t * beatLen, note.l * beatLen, 0.1);
    });

    // Schedule Chords (Sawtooth wave with filter)
    CHORDS.forEach(chord => {
      [chord.root, chord.third, chord.fifth].forEach(note => {
        if (FREQ[note]) scheduleNote(ctx, FREQ[note], "sawtooth", t0 + chord.t * beatLen, chord.l * beatLen, 0.05);
      });
      // Arpeggiator overlay
      for (let i = 0; i < chord.l * 4; i++) {
         const arpNotes = [chord.root, chord.third, chord.fifth, chord.third];
         const n = arpNotes[i % 4];
         if (FREQ[n]) scheduleNote(ctx, FREQ[n] * 2, "sine", t0 + chord.t * beatLen + i * (beatLen/4), beatLen/4, 0.03);
      }
    });

    // Schedule Drums
    for (let i = 0; i < loopLength; i++) {
      const time = t0 + i * beatLen;
      // Kick
      const kOsc = ctx.createOscillator();
      const kGain = ctx.createGain();
      kOsc.frequency.setValueAtTime(150, time);
      kOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      kGain.gain.setValueAtTime(0.5, time);
      kGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      kOsc.connect(kGain);
      kGain.connect(ctx.destination);
      kOsc.start(time);
      kOsc.stop(time + 0.5);
      activeNodesRef.current.push({ osc: kOsc, gain: kGain });
      
      // Snare on 2 and 4
      if (i % 2 === 1) {
         const nOsc = ctx.createOscillator();
         const nGain = ctx.createGain();
         nOsc.type = "square";
         nOsc.frequency.setValueAtTime(200, time);
         nGain.gain.setValueAtTime(0.2, time);
         nGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
         nOsc.connect(nGain);
         nGain.connect(ctx.destination);
         nOsc.start(time);
         nOsc.stop(time + 0.2);
         activeNodesRef.current.push({ osc: nOsc, gain: nGain });
      }
    }

    const updateUI = () => {
       const elapsed = ctx.currentTime - startTimeRef.current;
       const totalTime = loopLength * beatLen;
       if (elapsed >= totalTime) {
         setIsPlaying(false);
         setProgress(0);
         setVisualizerBars(Array(16).fill(0));
         return;
       }
       setProgress((elapsed / totalTime) * 100);
       setVisualizerBars(bars => bars.map(() => Math.random() * 100));
       animRef.current = requestAnimationFrame(updateUI);
    };
    animRef.current = requestAnimationFrame(updateUI);
  };

  const stopSequence = () => {
    setIsPlaying(false);
    setProgress(0);
    setVisualizerBars(Array(16).fill(0));
    if (animRef.current) cancelAnimationFrame(animRef.current);
    
    // Stop all active nodes gracefully
    if (ctxRef.current) {
        const t = ctxRef.current.currentTime;
        activeNodesRef.current.forEach(({ osc, gain }) => {
            try {
                gain.gain.cancelScheduledValues(t);
                gain.gain.setValueAtTime(gain.gain.value, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.stop(t + 0.05);
            } catch (e) {}
        });
    }
    activeNodesRef.current = [];
  };

  useEffect(() => {
    return () => {
      stopSequence();
    };
  }, []);

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 6000
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#18181b", border: "4px solid #3f3f46", borderRadius: 12,
        width: 480, maxWidth: "90%", padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 2px #000",
        display: "flex", flexDirection: "column", gap: 20
      }}>
        {/* Screen */}
        <div style={{
          background: "#020617", border: "2px solid #000", borderRadius: 8, padding: 16,
          boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.1)", position: "relative", overflow: "hidden"
        }}>
          {/* Scanlines */}
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)", pointerEvents: "none" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: "#10b981", fontSize: 14, fontFamily: "'Micro 5', monospace", textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 8 }}>
              <Disc size={14} className={isPlaying ? "spin-anim" : ""} />
              BMTH - Follow You (8-Bit)
            </div>
            <div style={{ color: isPlaying ? "#10b981" : "#ef4444", fontSize: 12, fontFamily: "'Micro 5', monospace", animation: isPlaying ? "pulse 1s infinite" : "none" }}>
              {isPlaying ? "● PLAYING" : "■ STOPPED"}
            </div>
          </div>

          {/* Visualizer */}
          <div style={{ height: 60, display: "flex", alignItems: "flex-end", gap: 4, margin: "16px 0" }}>
            {visualizerBars.map((h, i) => (
              <div key={i} style={{
                flex: 1, background: `linear-gradient(to top, #10b981, #34d399, #6ee7b7)`,
                height: `${isPlaying ? Math.max(10, h) : 5}%`, transition: "height 0.1s ease",
                borderRadius: "2px 2px 0 0", opacity: 0.8
              }} />
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 4, background: "#1f2937", borderRadius: 2, overflow: "hidden", marginTop: 8 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#10b981", transition: "width 0.1s linear" }} />
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={isPlaying ? stopSequence : playSequence} style={{
              background: isPlaying ? "#3f3f46" : "#10b981", color: isPlaying ? "#a1a1aa" : "#022c22",
              border: "none", padding: "12px 24px", borderRadius: 6, cursor: "pointer",
              fontFamily: "'Micro 5', monospace", fontSize: 18, display: "flex", alignItems: "center", gap: 8,
              boxShadow: isPlaying ? "inset 0 4px 8px rgba(0,0,0,0.5)" : "0 4px 0 #047857",
              transform: isPlaying ? "translateY(4px)" : "translateY(0)", transition: "all 0.1s"
            }}>
              {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              {isPlaying ? "STOP" : "PLAY LOOP"}
            </button>
          </div>
          <button onClick={onClose} style={{
            background: "transparent", color: "#a1a1aa", border: "2px solid #52525b",
            padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontFamily: "'Micro 5', monospace", fontSize: 16
          }}>CLOSE</button>
        </div>
        
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          .spin-anim { animation: spin 2s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}

function MusicRoomScene() {
  const { speedMultiplier, isLandscape, isTransitioning, changeScene, isConsoleMinimized } = useGame();
  const viewport = useViewport(isLandscape, isConsoleMinimized);
  const { scale, internalW, internalH } = viewport;
  const [phase, setPhase] = useState("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showSynth, setShowSynth] = useState(false);
  const containerRef = useRef(null);

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
    isActive: phase === "free" && !isTransitioning && !showSynth,
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
      if (checkC >= 9 && checkC <= 15 && checkR >= 4 && checkR <= 5) {
        playBlip(); setShowSynth(true); return;
      }
    }
  });

  const playerRef = useRef(null);
  const worldRef = useRef(null);
  useSmoothPixelGrid({ pos, internalW, internalH, mapCols: MAP_COLS, mapRows: MAP_ROWS, speedMultiplier, worldRef, playerRef });
  const handleWorldTap = useTapToMove(worldRef, pos, isWalkable, setPath, MAP_COLS, MAP_ROWS, phase === "free" && !isTransitioning && !showSynth);

  const activePrompt = useMemo(() => {
    if (phase !== "free" || isTransitioning || showSynth) return null;
    let checkR = pos.row; let checkC = pos.col;
    if (facing === "up") checkR--; else if (facing === "down") checkR++; else if (facing === "left") checkC--; else if (facing === "right") checkC++;
    
    if (checkC === NPC_POS.col && checkR === NPC_POS.row) return "TALK TO SAAD";
    if (checkC >= 9 && checkC <= 15 && checkR >= 4 && checkR <= 5) return "USE MIXING DESK";
    if (checkC >= 3 && checkC <= 5 && checkR >= 13 && checkR <= 15) return "GUITARS";
    if (checkC >= 18 && checkC <= 21 && checkR >= 12 && checkR <= 15) return "DRUM KIT";
    if (checkC >= 20 && checkC <= 22 && checkR >= 2 && checkR <= 4) return "VINYL CRATES";
    
    return null;
  }, [pos, facing, phase, isTransitioning, showSynth]);

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
              <StaticWorld />
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
            
            {showSynth && <SynthPlayerModal onClose={() => setShowSynth(false)} />}
            
            <style>{`
              @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
              @keyframes npcBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
            `}</style>
          </div>
        </div>
      </div>
      <ControlBar />
    </div>
  );
}

const StaticWorld = memo(() => (
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
        <div style={{ width: 64, height: 32, background: "#111", border: "1px solid #444", display: "flex", flexDirection: "column", gap: 2, padding: 2 }}>
          <div style={{ display: "flex", gap: 2, flex: 1 }}>
              {Array.from({length: 12}).map((_,i) => <div key={i} style={{ flex: 1, background: i%3===0 ? "#f00" : "#0f0", height: Math.random() * 20 + 4, alignSelf: "flex-end" }} />)}
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
