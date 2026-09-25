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
    if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) return 2;
    if (c >= 6 && c <= 18 && r >= 6 && r <= 12) return 3;
    return 1;
  })
);

const NPC_POS = { col: 6, row: 8 };
const DIALOGUE_LINES = [
  "Welcome to the studio.",
  "I've got an 8-bit cover of 'Follow You' by Bring Me The Horizon playing.",
  "Take a look around. The mixing desk is visualizing the track right now."
];

// =====================================================================
//  BMTH "FOLLOW YOU" — 8-BIT CHIPTUNE COVER
//
//  Key: B major / D#m (original key, enharmonic to Cb/Ebm)
//  BPM: 89 (actual song tempo)
//  Chords: B – D#m – C# (= B – Ebm – Db in flat notation)
//
//  Structure per loop (24 beats = 8 bars of 3/3):
//    Bars 1-2 (beats 0-5):   B   — verse feel
//    Bars 3-4 (beats 6-11):  D#m — verse feel
//    Bars 5-6 (beats 12-17): C#  — pre-chorus build
//    Bars 7-8 (beats 18-23): B   — chorus payoff
//
//  The melody follows the vocal contour of the chorus:
//    "So you can drag me through hell / if it meant I could hold your hand
//     I will follow you / 'cause I'm under your spell"
// =====================================================================

const N = {
  // Bass notes
  "B1": 61.74, "C#2": 69.30, "D#2": 77.78, "F#2": 92.50,
  // Low
  "B2": 123.47, "C#3": 138.59, "D#3": 155.56, "E3": 164.81, "F#3": 185.00, "G#3": 207.65,
  // Mid (melody range)
  "A3": 220.00, "B3": 246.94, "C#4": 277.18, "D#4": 311.13, "E4": 329.63, "F#4": 369.99, "G#4": 415.30,
  // High
  "A4": 440.00, "B4": 493.88, "C#5": 554.37, "D#5": 622.25,
};

// 24 beats per loop, 96 sixteenth-note steps
const BEATS = 24;
const STEPS = BEATS * 4; // 96
const BPM = 89;
const BEAT_S = 60 / BPM; // ~0.674s
const STEP_S = BEAT_S / 4; // ~0.168s

// ── CHORD MAP (which chord is active at each beat) ──
// B (beats 0-5), D#m (beats 6-11), C# (beats 12-17), B (beats 18-23)
function getChord(beat) {
  const b = ((beat % BEATS) + BEATS) % BEATS;
  if (b < 6)  return { notes: ["B2","D#3","F#3"], bass: "B1", name: "B" };
  if (b < 12) return { notes: ["D#3","F#3","B3"], bass: "D#2", name: "D#m" };
  if (b < 18) return { notes: ["C#3","F#3","G#3"], bass: "C#2", name: "C#" };
  return             { notes: ["B2","D#3","F#3"], bass: "B1", name: "B" };
}

// ── MELODY ──
// Mapped to the actual vocal line of Follow You chorus + verse hook
// t = beat position, l = length in beats, n = note name
const MELODY = [
  // Bars 1-2 over B: "My head is haunting me / and my heart feels like a ghost"
  // Vocal sits on F#4, drops to D#4, B3
  { n: "F#4", t: 0,    l: 0.75 },
  { n: "F#4", t: 0.75, l: 0.25 },
  { n: "F#4", t: 1,    l: 0.5  },
  { n: "E4",  t: 1.5,  l: 0.5  },
  { n: "D#4", t: 2,    l: 1    },
  { n: "D#4", t: 3,    l: 0.5  },
  { n: "D#4", t: 3.5,  l: 0.5  },
  { n: "C#4", t: 4,    l: 0.5  },
  { n: "D#4", t: 4.5,  l: 0.5  },
  { n: "B3",  t: 5,    l: 1    },

  // Bars 3-4 over D#m: "I need to feel something / 'cause I'm still so far from home"
  { n: "D#4", t: 6,    l: 0.5  },
  { n: "D#4", t: 6.5,  l: 0.5  },
  { n: "F#4", t: 7,    l: 0.5  },
  { n: "F#4", t: 7.5,  l: 0.5  },
  { n: "E4",  t: 8,    l: 0.5  },
  { n: "D#4", t: 8.5,  l: 0.5  },
  { n: "C#4", t: 9,    l: 0.5  },
  { n: "D#4", t: 9.5,  l: 0.5  },
  { n: "B3",  t: 10,   l: 0.5  },
  { n: "C#4", t: 10.5, l: 0.5  },
  { n: "D#4", t: 11,   l: 1    },

  // Bars 5-6 over C#: "So you can drag me through hell / if it meant I could hold your hand"
  // Pre-chorus/chorus vocal climbs up
  { n: "F#4", t: 12,   l: 0.5  },
  { n: "G#4", t: 12.5, l: 0.5  },
  { n: "F#4", t: 13,   l: 0.5  },
  { n: "F#4", t: 13.5, l: 0.5  },
  { n: "E4",  t: 14,   l: 0.5  },
  { n: "D#4", t: 14.5, l: 0.5  },
  { n: "C#4", t: 15,   l: 1    },
  { n: "C#4", t: 16,   l: 0.5  },
  { n: "D#4", t: 16.5, l: 0.5  },
  { n: "E4",  t: 17,   l: 0.5  },
  { n: "F#4", t: 17.5, l: 0.5  },

  // Bars 7-8 over B: "I will follow you / 'cause I'm under your spell"
  // The big hook — soaring on B4 then dropping
  { n: "F#4", t: 18,   l: 1    },
  { n: "G#4", t: 19,   l: 0.5  },
  { n: "F#4", t: 19.5, l: 0.5  },
  { n: "D#4", t: 20,   l: 1    },
  { n: "B3",  t: 21,   l: 0.5  },
  { n: "C#4", t: 21.5, l: 0.5  },
  { n: "D#4", t: 22,   l: 0.5  },
  { n: "C#4", t: 22.5, l: 0.5  },
  { n: "B3",  t: 23,   l: 1    },
];

// Pre-compute melody into a step lookup for performance
const MELODY_AT = {};
MELODY.forEach(m => {
  const step = Math.round(m.t * 4);
  MELODY_AT[step] = m;
});


function MusicRoomScene() {
  const { speedMultiplier, isLandscape, isTransitioning, changeScene, isConsoleMinimized, musicPlaying, musicMuted, musicVolume } = useGame();
  const viewport = useViewport(isLandscape, isConsoleMinimized);
  const { scale, internalW, internalH } = viewport;
  const [phase, setPhase] = useState("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const containerRef = useRef(null);
  const musicRef = useRef({ audioCtx: null, interval: null });

  // === STEP-BASED SYNTH ENGINE ===
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = getSharedAudioCtx();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const t = ctx.currentTime;
      const si = idx % STEPS;         // 0..95
      const beat = si / 4;            // 0.00..23.75
      const chord = getChord(Math.floor(beat));

      // ── 1. LEAD MELODY (pulse/square wave + lowpass) ──
      const mel = MELODY_AT[si];
      if (mel && N[mel.n]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "square";
        osc.frequency.setValueAtTime(N[mel.n], t);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2000, t);
        filter.Q.setValueAtTime(1.5, t);

        const dur = mel.l * BEAT_S;
        const amp = 0.09 * vol;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(amp, t + 0.01);
        // Sustain then release
        gain.gain.setValueAtTime(amp * 0.7, t + dur * 0.6);
        gain.gain.linearRampToValueAtTime(0, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      }

      // ── 2. CHORD PAD (filtered sawtooth, plays once per chord change) ──
      // Chord changes at beats 0, 6, 12, 18
      const chordBeats = [0, 6, 12, 18];
      if (si % 4 === 0 && chordBeats.includes(Math.floor(beat))) {
        const dur = 6 * BEAT_S; // each chord lasts 6 beats
        chord.notes.forEach((noteName, i) => {
          if (!N[noteName]) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(N[noteName], t);
          // Slight detune for stereo width feel
          osc.detune.setValueAtTime((i - 1) * 8, t);

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(600, t);
          filter.frequency.exponentialRampToValueAtTime(300, t + dur * 0.8);

          const amp = 0.03 * vol;
          gain.gain.setValueAtTime(amp, t + 0.02);
          gain.gain.setValueAtTime(amp, t + dur * 0.7);
          gain.gain.linearRampToValueAtTime(0, t + dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + dur + 0.01);
        });
      }

      // ── 3. BASS (triangle wave — NES channel 3 style) ──
      // Root on beat, octave on the "and" (8th note feel)
      if (si % 4 === 0 && N[chord.bass]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(N[chord.bass], t);

        const amp = 0.18 * vol;
        gain.gain.setValueAtTime(amp, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + BEAT_S * 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + BEAT_S);
      }
      // Octave bounce on the "and"
      if (si % 4 === 2 && N[chord.bass]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(N[chord.bass] * 2, t);

        const amp = 0.1 * vol;
        gain.gain.setValueAtTime(amp, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + STEP_S * 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + STEP_S * 2);
      }

      // ── 4. ARPEGGIATED SHIMMER (sine, every 16th note) ──
      {
        const arpNotes = chord.notes;
        const arpNote = arpNotes[si % arpNotes.length];
        if (arpNote && N[arpNote]) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          // Play two octaves up for shimmer
          osc.frequency.setValueAtTime(N[arpNote] * 4, t);

          const amp = 0.015 * vol;
          gain.gain.setValueAtTime(amp, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + STEP_S * 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + STEP_S);
        }
      }

      // ── 5. DRUMS ──
      const beatInBar = Math.floor(beat) % 3; // 3-beat bars (6/8 feel like the song)

      // Kick: beat 0 of each bar (every 3 beats)
      if (si % 4 === 0 && beatInBar === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.25);
        gain.gain.setValueAtTime(0.4 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      }

      // Snare: beat 1 of each bar
      if (si % 4 === 0 && beatInBar === 1) {
        // Tone body
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.06);
        gain.gain.setValueAtTime(0.18 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);

        // Noise burst
        const bufSize = Math.floor(ctx.sampleRate * 0.06);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const nf = ctx.createBiquadFilter();
        nf.type = "highpass";
        nf.frequency.value = 4000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.12 * vol, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        noise.connect(nf);
        nf.connect(ng);
        ng.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.06);
      }

      // Closed hi-hat: every 8th note (every 2 steps)
      if (si % 2 === 0) {
        const bufSize = Math.floor(ctx.sampleRate * 0.02);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = "highpass";
        f.frequency.value = 8000;
        const g = ctx.createGain();
        const accent = si % 4 === 0 ? 0.05 : 0.025;
        g.gain.setValueAtTime(accent * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        noise.connect(f);
        f.connect(g);
        g.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.025);
      }

    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(STEP_S * 1000 / speedMultiplier);
    musicRef.current.interval = setInterval(() => {
      playStep(step++, musicVolume, musicMuted);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);


  const isWalkable = (c, r) => {
    if (c === NPC_POS.col && r === NPC_POS.row) return false;
    if (c < 1 || c >= MAP_COLS - 1 || r < 1 || r >= MAP_ROWS - 1) return false;
    if (c >= 9 && c <= 15 && r >= 4 && r <= 5) return false;
    if ((c === 8 || c === 16) && r === 4) return false;
    if (c >= 18 && c <= 21 && r >= 12 && r <= 15) return false;
    if (c >= 3 && c <= 5 && r >= 13 && r <= 15) return false;
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
            <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerAction(); }}
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
    <div style={{ position: "absolute", left: TILE, top: TILE, width: (MAP_COLS-2)*TILE, height: (MAP_ROWS-2)*TILE, background: "#2C1B18" }}>
        {Array.from({ length: MAP_ROWS - 2 }).map((_, r) => (
          <div key={r} style={{ position: "absolute", top: r * TILE, left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.3)" }} />
        ))}
        <div style={{ position: "absolute", left: 5*TILE, top: 5*TILE, width: 13*TILE, height: 7*TILE, background: "#1A1A1A", border: "2px solid #333", borderRadius: 8 }}>
          <div style={{ position: "absolute", inset: 4, background: "#222", borderRadius: 4 }} />
        </div>
    </div>
    <div style={{ position: "absolute", left: TILE, top: 0, width: (MAP_COLS-2)*TILE, height: TILE, background: "#3A3A3A", borderBottom: "4px solid #111", display: "flex" }}>
        {Array.from({ length: MAP_COLS - 2 }).map((_, c) => (
          <div key={c} style={{ flex: 1, borderRight: "1px solid #222", borderLeft: "1px solid #444", background: c % 2 === 0 ? "#333" : "#3A3A3A" }} />
        ))}
    </div>
    <div style={{ position: "absolute", left: 9*TILE, top: 4*TILE, width: 7*TILE, height: 2*TILE, background: "#222", border: "2px solid #000", borderRadius: 4, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 32, background: "#111", border: "1px solid #444", display: "flex", flexDirection: "column", gap: 2, padding: 2, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 2, flex: 1, alignItems: "flex-end" }}>
              {Array.from({length: 14}).map((_,i) => (
                <div key={i} style={{ flex: 1, background: i % 4 === 0 ? "#ef4444" : (i % 2 === 0 ? "#f59e0b" : "#10b981"), height: "20%",
                  animation: musicPlaying ? `eqBounce ${0.15 + (i%7)*0.05}s infinite alternate ease-in-out` : "none" }} />
              ))}
          </div>
        </div>
        <div style={{ position: "absolute", top: 2.2*TILE, left: "50%", transform: "translateX(-50%)", width: 24, height: 24, background: "#1A1A1A", borderRadius: "50%", border: "2px solid #000" }} />
    </div>
    <div style={{ position: "absolute", left: 8*TILE, top: 4*TILE, width: TILE, height: TILE, background: "#111", border: "2px solid #000" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: "#222", border: "1px solid #000" }} />
    </div>
    <div style={{ position: "absolute", left: 16*TILE, top: 4*TILE, width: TILE, height: TILE, background: "#111", border: "2px solid #000" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 16, height: 16, borderRadius: "50%", background: "#222", border: "1px solid #000" }} />
    </div>
    <div style={{ position: "absolute", left: 18*TILE, top: 12*TILE, width: 4*TILE, height: 4*TILE }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 40, height: 40, background: "#EEE", border: "4px solid #8B0000", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 4, top: 20, width: 24, height: 24, background: "#FFF", border: "2px solid #CCC", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: 0, top: 4, width: 20, height: 20, background: "#DAA520", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 28, height: 28, background: "#DAA520", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 8, bottom: 8, width: 30, height: 30, background: "#EEE", border: "4px solid #8B0000", borderRadius: "50%" }} />
    </div>
    <div style={{ position: "absolute", left: 3*TILE, top: 13*TILE, width: 3*TILE, height: 3*TILE, display: "flex", gap: 8 }}>
        <div style={{ width: 16, height: 48, background: "#111", borderRadius: 8, position: "relative", transform: "rotate(15deg)" }}>
          <div style={{ position: "absolute", left: 6, top: -16, width: 4, height: 24, background: "#D2B48C" }} />
        </div>
        <div style={{ width: 18, height: 50, background: "#8B0000", borderRadius: 8, position: "relative", transform: "rotate(-10deg)" }}>
          <div style={{ position: "absolute", left: 7, top: -20, width: 4, height: 28, background: "#D2B48C" }} />
        </div>
    </div>
    <div style={{ position: "absolute", left: 20*TILE, top: 2*TILE, width: 3*TILE, height: 3*TILE, background: "#8B4513", border: "2px solid #5C3A21", display: "flex", flexWrap: "wrap", padding: 4, gap: 2 }}>
        {Array.from({length: 6}).map((_,i) => <div key={i} style={{ width: 12, height: 24, background: ["#FFD700", "#FF4500", "#1E90FF", "#32CD32"][i%4], border: "1px solid #000" }} />)}
    </div>
  </>
));

export default MusicRoomScene;
