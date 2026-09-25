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
//  BMTH "FOLLOW YOU" — FULL 8-BIT CHIPTUNE ARRANGEMENT
//  Key: B major / G# minor (simplified from Eb minor for cleaner freqs)
//  BPM: 145 (original tempo)
//  Structure: 32-beat loop = 8-bar verse phrase + 8-bar chorus phrase
// =====================================================================

const NOTE = {
  // Octave 2
  "B2":  123.47, "C#3": 138.59, "D#3": 155.56, "E3":  164.81, "F#3": 185.00, "G#3": 207.65, "A3":  220.00,
  // Octave 3
  "B3":  246.94, "C#4": 277.18, "D#4": 311.13, "E4":  329.63, "F#4": 369.99, "G#4": 415.30, "A4":  440.00,
  // Octave 4
  "B4":  493.88, "C#5": 554.37, "D#5": 622.25, "E5":  659.26, "F#5": 739.99, "G#5": 830.61,
  // Bass octave
  "E2":  82.41, "F#2": 92.50, "G#2": 103.83, "A2":  110.00,
  "D#2": 77.78, "C#2": 69.30, "B1": 61.74,
};

// Each beat = 1 quarter note at 145 BPM
// 32 beats total, 128 sixteenth-note steps

// ── CHORD PROGRESSION (per 4 beats) ──
// Verse:  B  | G#m | E   | F#
// Chorus: B  | G#m | E   | F#
const CHORD_MAP = [
  // Verse (beats 0-15)
  { notes: ["B2","D#3","F#3"],  bass: "B1",  from: 0,  to: 4  },
  { notes: ["G#3","B3","D#4"], bass: "G#2", from: 4,  to: 8  },
  { notes: ["E3","G#3","B3"],  bass: "E2",  from: 8,  to: 12 },
  { notes: ["F#3","A3","C#4"], bass: "F#2", from: 12, to: 16 },
  // Chorus (beats 16-31)
  { notes: ["B3","D#4","F#4"],  bass: "B2",  from: 16, to: 20 },
  { notes: ["G#3","B3","D#4"], bass: "G#2", from: 20, to: 24 },
  { notes: ["E3","G#3","B3"],  bass: "E2",  from: 24, to: 28 },
  { notes: ["F#3","A3","C#4"], bass: "F#2", from: 28, to: 32 },
];

// ── VERSE MELODY (beats 0-15) ──
// "So you can drag me through hell / if it meant I could hold your hand"
const VERSE_MELODY = [
  // Phrase 1: "So you can drag me through hell"
  { n: "F#4", t: 0,    l: 0.5 },
  { n: "F#4", t: 0.5,  l: 0.5 },
  { n: "F#4", t: 1,    l: 0.5 },
  { n: "E4",  t: 1.5,  l: 0.5 },
  { n: "D#4", t: 2,    l: 0.5 },
  { n: "C#4", t: 2.5,  l: 0.5 },
  { n: "B3",  t: 3,    l: 1   },
  // Phrase 2: "if it meant I could hold your hand"
  { n: "B3",  t: 4,    l: 0.5 },
  { n: "C#4", t: 4.5,  l: 0.5 },
  { n: "D#4", t: 5,    l: 0.5 },
  { n: "D#4", t: 5.5,  l: 0.5 },
  { n: "C#4", t: 6,    l: 0.5 },
  { n: "B3",  t: 6.5,  l: 0.5 },
  { n: "G#3", t: 7,    l: 1   },
  // Phrase 3: "I will follow you"
  { n: "E4",  t: 8,    l: 0.75 },
  { n: "D#4", t: 8.75, l: 0.25 },
  { n: "C#4", t: 9,    l: 0.5  },
  { n: "B3",  t: 9.5,  l: 1.5  },
  // Phrase 4: "cause I'm under your spell"
  { n: "B3",  t: 11,   l: 0.5 },
  { n: "C#4", t: 11.5, l: 0.5 },
  { n: "D#4", t: 12,   l: 0.5 },
  { n: "F#4", t: 12.5, l: 0.5 },
  { n: "E4",  t: 13,   l: 0.5 },
  { n: "D#4", t: 13.5, l: 0.5 },
  { n: "C#4", t: 14,   l: 2   },
];

// ── CHORUS MELODY (beats 16-31) ──
// "I will follow you / 'cause I'm under your spell"
const CHORUS_MELODY = [
  // "I will follow you" — big, soaring
  { n: "F#4", t: 16,   l: 1   },
  { n: "G#4", t: 17,   l: 0.5 },
  { n: "F#4", t: 17.5, l: 0.5 },
  { n: "E4",  t: 18,   l: 0.5 },
  { n: "D#4", t: 18.5, l: 0.5 },
  { n: "B3",  t: 19,   l: 1   },
  // "I will follow you" — repeat up
  { n: "F#4", t: 20,   l: 1   },
  { n: "G#4", t: 21,   l: 0.5 },
  { n: "B4",  t: 21.5, l: 0.5 },
  { n: "G#4", t: 22,   l: 0.5 },
  { n: "F#4", t: 22.5, l: 0.5 },
  { n: "E4",  t: 23,   l: 1   },
  // "'cause I'm under your spell"
  { n: "E4",  t: 24,   l: 0.5 },
  { n: "F#4", t: 24.5, l: 0.5 },
  { n: "G#4", t: 25,   l: 0.5 },
  { n: "F#4", t: 25.5, l: 0.5 },
  { n: "E4",  t: 26,   l: 0.5 },
  { n: "D#4", t: 26.5, l: 0.5 },
  { n: "B3",  t: 27,   l: 1   },
  // Resolution
  { n: "C#4", t: 28,   l: 0.5 },
  { n: "D#4", t: 28.5, l: 0.5 },
  { n: "E4",  t: 29,   l: 0.5 },
  { n: "F#4", t: 29.5, l: 0.5 },
  { n: "D#4", t: 30,   l: 1   },
  { n: "B3",  t: 31,   l: 1   },
];

const ALL_MELODY = [...VERSE_MELODY, ...CHORUS_MELODY];

// ── BASS PATTERN ──
// Root-octave pulse pattern — plays root on beat, octave on "and"
function getBassNote(beat) {
  const chord = CHORD_MAP.find(c => beat >= c.from && beat < c.to);
  if (!chord) return null;
  return chord.bass;
}

// ── DRUM PATTERN (per beat, 0-3 = subdivisions) ──
// Kick: beats 1 and 3 of each 4-beat bar
// Snare: beats 2 and 4
// Hi-hat: every 8th note
// Open hat: on the "and" of beat 4

const TOTAL_STEPS = 128; // 32 beats * 4 subdivisions
const BPM = 145;
const BEAT_LEN = 60 / BPM;
const STEP_LEN = BEAT_LEN / 4;


function MusicRoomScene() {
  const { speedMultiplier, isLandscape, isTransitioning, changeScene, isConsoleMinimized, musicPlaying, musicMuted, musicVolume } = useGame();
  const viewport = useViewport(isLandscape, isConsoleMinimized);
  const { scale, internalW, internalH } = viewport;
  const [phase, setPhase] = useState("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const containerRef = useRef(null);
  const musicRef = useRef({ audioCtx: null, interval: null });

  // === BACKGROUND MUSIC — STEP SEQUENCER ===
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = getSharedAudioCtx();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const t = ctx.currentTime;
      const si = idx % TOTAL_STEPS; // 0-127
      const beat = si / 4;          // 0.00 - 31.75

      // ── LEAD MELODY (pulse wave + lowpass filter) ──
      const melodyNote = ALL_MELODY.find(m => Math.abs(m.t * 4 - si) < 0.5 && si === Math.round(m.t * 4));
      if (melodyNote && NOTE[melodyNote.n]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = "square";
        osc.frequency.setValueAtTime(NOTE[melodyNote.n], t);
        
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2400, t);
        filter.Q.setValueAtTime(2, t);
        
        const dur = melodyNote.l * BEAT_LEN;
        const amp = (beat >= 16 ? 0.1 : 0.07) * vol; // chorus louder
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(amp, t + 0.015);
        gain.gain.setValueAtTime(amp * 0.8, t + dur * 0.7);
        gain.gain.linearRampToValueAtTime(0, t + dur);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      }

      // ── CHORD PAD (sawtooth, filtered, quiet) ──
      const chordData = CHORD_MAP.find(c => beat >= c.from && beat < c.to);
      // Play chord on the first step of each chord change
      if (chordData && si === chordData.from * 4) {
        chordData.notes.forEach(n => {
          if (!NOTE[n]) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(NOTE[n], t);
          // Slight detune for width
          osc.detune.setValueAtTime(Math.random() * 10 - 5, t);
          
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(800, t);
          filter.frequency.exponentialRampToValueAtTime(400, t + 2);
          
          const dur = (chordData.to - chordData.from) * BEAT_LEN;
          const amp = (beat >= 16 ? 0.04 : 0.025) * vol;
          gain.gain.setValueAtTime(amp, t);
          gain.gain.setValueAtTime(amp, t + dur * 0.8);
          gain.gain.linearRampToValueAtTime(0, t + dur);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + dur + 0.01);
        });
      }

      // ── BASS (triangle wave — NES-style) ──
      // Plays on every beat (every 4 steps) with an octave pulse on the "and"
      if (si % 4 === 0) {
        const bassNote = getBassNote(Math.floor(beat));
        if (bassNote && NOTE[bassNote]) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(NOTE[bassNote], t);
          
          const amp = (beat >= 16 ? 0.22 : 0.16) * vol;
          gain.gain.setValueAtTime(amp, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + BEAT_LEN * 0.9);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + BEAT_LEN);
        }
      }
      // Bass octave hop on the "and" (step 2 of each beat)
      if (si % 4 === 2) {
        const bassNote = getBassNote(Math.floor(beat));
        if (bassNote && NOTE[bassNote]) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = "triangle";
          osc.frequency.setValueAtTime(NOTE[bassNote] * 2, t);
          
          const amp = (beat >= 16 ? 0.12 : 0.08) * vol;
          gain.gain.setValueAtTime(amp, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + STEP_LEN * 1.5);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + STEP_LEN * 2);
        }
      }

      // ── ARPEGGIO (sine, chorus section only) ──
      if (beat >= 16 && chordData) {
        const arpIdx = si % 4;
        const arpNote = chordData.notes[arpIdx % chordData.notes.length];
        if (arpNote && NOTE[arpNote]) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(NOTE[arpNote] * 2, t);
          
          gain.gain.setValueAtTime(0.03 * vol, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + STEP_LEN * 0.9);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + STEP_LEN);
        }
      }

      // ── DRUMS ──
      const beatInBar = Math.floor(beat) % 4;
      
      // Kick on beats 0 and 2 of each bar
      if (si % 4 === 0 && (beatInBar === 0 || beatInBar === 2)) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.3);
        gain.gain.setValueAtTime(0.45 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      }

      // Snare on beats 1 and 3
      if (si % 4 === 0 && (beatInBar === 1 || beatInBar === 3)) {
        // Tone body
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
        gain.gain.setValueAtTime(0.2 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
        
        // Noise burst
        const bufSize = ctx.sampleRate * 0.08;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = "highpass";
        nFilter.frequency.value = 3000;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.15 * vol, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.08);
      }

      // Hi-hat: every 8th note (every 2 steps)
      if (si % 2 === 0) {
        const bufSize = ctx.sampleRate * 0.03;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 7000;
        const gain = ctx.createGain();
        // Accent on downbeats
        const isDown = si % 4 === 0;
        const hhVol = (isDown ? 0.06 : 0.03) * vol;
        gain.gain.setValueAtTime(hhVol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.03);
      }

      // Open hi-hat on "and" of beat 4 (step 14 of each 16-step bar)
      if (si % 16 === 14) {
        const bufSize = ctx.sampleRate * 0.12;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 5000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.07 * vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.12);
      }

    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(STEP_LEN * 1000 / speedMultiplier);
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
        <div style={{ width: 64, height: 32, background: "#111", border: "1px solid #444", display: "flex", flexDirection: "column", gap: 2, padding: 2, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 2, flex: 1, alignItems: "flex-end" }}>
              {Array.from({length: 14}).map((_,i) => (
                <div key={i} style={{ 
                  flex: 1, 
                  background: i % 4 === 0 ? "#ef4444" : (i % 2 === 0 ? "#f59e0b" : "#10b981"), 
                  height: "20%",
                  animation: musicPlaying ? `eqBounce ${0.15 + (i%7)*0.05}s infinite alternate ease-in-out` : "none" 
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
