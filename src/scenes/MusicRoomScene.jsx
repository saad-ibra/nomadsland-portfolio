"use client";
import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { useSmoothPixelGrid } from '../hooks/useSmoothPixelGrid.js';
import { useViewport } from '../hooks/useViewport.js';
import { getSharedAudioCtx } from '../engine/sfx.js';
import { ArrowLeft, X } from "lucide-react";
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

// --- SOUND UTILS ---
const playSynthNote = (freq, type = 'square', duration = 0.1) => {
  try {
    const ctx = getSharedAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

const playDrumSound = (type) => {
  try {
    const ctx = getSharedAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const time = ctx.currentTime;
    
    if (type === 0) { // Kick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.5);
    } else if (type === 1) { // Snare
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
    } else { // Hi-hat
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(8000, time);
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.05);
    }
  } catch (e) {}
};

// --- MINI GAMES COMPONENTS ---

const DrumsGame = ({ onClose }) => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [notes, setNotes] = useState([]);
  const timeRef = useRef(0);
  const reqRef = useRef(null);
  
  const lanes = [
    { key: 'D', color: '#ef4444' }, // Red (Kick)
    { key: 'F', color: '#f59e0b' }, // Yellow (Snare)
    { key: 'J', color: '#10b981' }, // Green (Hat)
    { key: 'K', color: '#3b82f6' }  // Blue (Hat)
  ];

  useEffect(() => {
    // Generate notes for ~30 seconds
    const generatedNotes = [];
    for (let i = 0; i < 80; i++) {
      generatedNotes.push({
        id: i,
        lane: Math.floor(Math.random() * 4),
        targetTime: 2000 + i * 400, // 400ms per note
        hit: false
      });
    }
    setNotes(generatedNotes);
    
    let startTime = performance.now();
    const loop = (t) => {
      timeRef.current = t - startTime;
      if (timeRef.current > 35000) {
        setGameOver(true);
        return;
      }
      // Force rerender for visual update
      setNotes(prev => [...prev]);
      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(reqRef.current);
  }, []);

  const handleHit = useCallback((laneIdx) => {
    if (gameOver) return;
    playDrumSound(laneIdx);
    
    setNotes(prev => {
      const newNotes = [...prev];
      const time = timeRef.current;
      
      // Find closest unhit note in this lane
      let closest = null;
      let minDiff = Infinity;
      
      for (let n of newNotes) {
        if (!n.hit && n.lane === laneIdx) {
          const diff = Math.abs(n.targetTime - time);
          if (diff < minDiff && diff < 200) { // Hit window
            minDiff = diff;
            closest = n;
          }
        }
      }
      
      if (closest) {
        closest.hit = true;
        if (minDiff < 50) {
          setScore(s => s + 100);
          setCombo(c => c + 1);
        } else if (minDiff < 120) {
          setScore(s => s + 50);
          setCombo(c => c + 1);
        }
      } else {
        setCombo(0); // Miss
      }
      return newNotes;
    });
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      const laneIdx = lanes.findIndex(l => l.key === key);
      if (laneIdx !== -1) handleHit(laneIdx);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHit, onClose, lanes]);

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Micro 5', monospace" }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={32} /></button>
      
      {gameOver ? (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, color: '#DAA520' }}>GIG OVER</h1>
          <p style={{ fontSize: 32 }}>Score: {score}</p>
          <button onClick={onClose} style={{ marginTop: 20, padding: '10px 20px', fontSize: 24, background: '#DAA520', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer' }}>EXIT</button>
        </div>
      ) : (
        <div style={{ width: 300, height: 400, position: 'relative', background: '#111', border: '4px solid #333', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 24 }}>SCORE: {score}</div>
          <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 24, color: combo > 5 ? '#DAA520' : '#fff' }}>COMBO: {combo}</div>
          
          {/* Hit Line */}
          <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.5)', zIndex: 10 }} />
          
          {/* Lanes */}
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {lanes.map((lane, i) => (
              <div key={i} style={{ flex: 1, borderRight: i < 3 ? '1px solid #222' : 'none', position: 'relative' }}>
                <div 
                  onPointerDown={() => handleHit(i)}
                  style={{ position: 'absolute', bottom: 10, left: '10%', width: '80%', height: 30, background: lane.color, opacity: 0.5, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', userSelect: 'none' }}
                >{lane.key}</div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {notes.map(note => {
            if (note.hit) return null;
            // Calculate Y position based on time difference
            const diff = note.targetTime - timeRef.current;
            // If diff is 0, y should be 360 (bottom 40). If diff is 2000, y should be -40.
            const y = 360 - (diff / 2000) * 400;
            if (y > 450 || y < -50) return null; // Off screen
            
            return (
              <div key={note.id} style={{ 
                position: 'absolute', 
                left: `${(note.lane * 25) + 2.5}%`, 
                top: y - 10, // center the note
                width: '20%', 
                height: 20, 
                background: lanes[note.lane].color,
                borderRadius: 4,
                boxShadow: '0 0 10px ' + lanes[note.lane].color
              }} />
            );
          })}
        </div>
      )}
    </div>
  );
};


const GuitarGame = ({ onClose }) => {
  const [sequence, setSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [round, setRound] = useState(0);
  const [activeString, setActiveString] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const strings = [
    { color: '#ef4444', freq: 329.63 }, // E4
    { color: '#3b82f6', freq: 440.00 }, // A4
    { color: '#10b981', freq: 554.37 }, // C#5
    { color: '#f59e0b', freq: 659.25 }  // E5
  ];

  const playString = useCallback((idx) => {
    setActiveString(idx);
    playSynthNote(strings[idx].freq, 'triangle', 0.3);
    setTimeout(() => setActiveString(null), 300);
  }, []);

  const nextRound = useCallback(() => {
    const nextIdx = Math.floor(Math.random() * 4);
    const newSeq = [...sequence, nextIdx];
    setSequence(newSeq);
    setPlayerStep(0);
    setRound(r => r + 1);
    setIsPlaying(true);
    
    // Play sequence
    let step = 0;
    const interval = setInterval(() => {
      if (step >= newSeq.length) {
        clearInterval(interval);
        setIsPlaying(false);
        return;
      }
      playString(newSeq[step]);
      step++;
    }, 600);
  }, [sequence, playString]);

  useEffect(() => {
    // Start game
    setTimeout(nextRound, 1000);
  }, []); // eslint-disable-line

  const handleHit = useCallback((idx) => {
    if (isPlaying || gameOver) return;
    playString(idx);
    
    if (sequence[playerStep] === idx) {
      if (playerStep === sequence.length - 1) {
        setTimeout(nextRound, 1000);
      } else {
        setPlayerStep(s => s + 1);
      }
    } else {
      setGameOver(true);
    }
  }, [isPlaying, gameOver, sequence, playerStep, playString, nextRound]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) handleHit(num - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHit, onClose]);

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Micro 5', monospace" }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={32} /></button>
      
      <h1 style={{ fontSize: 48, marginBottom: 10, color: '#DAA520' }}>GUITAR HERO</h1>
      <p style={{ fontSize: 24, marginBottom: 30 }}>ROUND {round}</p>

      {gameOver ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, color: '#ef4444' }}>WRONG NOTE!</h2>
          <button onClick={onClose} style={{ marginTop: 20, padding: '10px 20px', fontSize: 24, background: '#DAA520', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer' }}>EXIT</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {strings.map((str, i) => (
            <div 
              key={i}
              onPointerDown={() => handleHit(i)}
              style={{
                width: 60, height: 300, background: '#222', borderRadius: 8,
                position: 'relative', cursor: isPlaying ? 'default' : 'pointer',
                border: `4px solid ${activeString === i ? str.color : '#444'}`,
                boxShadow: activeString === i ? `0 0 20px ${str.color}` : 'none',
                transition: 'all 0.1s'
              }}
            >
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, bottom: 0, width: 4, background: '#fff', opacity: 0.5 }} />
              <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: 24, color: str.color }}>{i + 1}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const VinylGame = ({ onClose }) => {
  const allQuestions = [
    { q: "Which artist released the album 'Thriller'?", options: ["Prince", "Michael Jackson", "Madonna", "David Bowie"], a: 1 },
    { q: "What is the standard tuning of a guitar?", options: ["EADGBE", "DADGAD", "EABGDE", "CGCFCE"], a: 0 },
    { q: "Which frequency is considered 'Concert Pitch' A4?", options: ["432 Hz", "440 Hz", "444 Hz", "450 Hz"], a: 1 },
    { q: "What does 'BPM' stand for?", options: ["Beats Per Minute", "Bass Pitch Modulation", "Band Performance Metric", "Beat Pattern Maker"], a: 0 },
    { q: "Which instrument has 88 keys?", options: ["Synthesizer", "Harpsichord", "Piano", "Organ"], a: 2 },
    { q: "In what decade was the synthesizer invented?", options: ["1950s", "1960s", "1970s", "1980s"], a: 1 },
    { q: "Which genre originated in Jamaica in the late 1960s?", options: ["Ska", "Reggae", "Dub", "Dancehall"], a: 1 },
    { q: "What does 'EQ' stand for in mixing?", options: ["Equalization", "Equipment Quality", "Electronic Quotient", "Energy Quantizer"], a: 0 },
    { q: "Who composed 'Fur Elise'?", options: ["Mozart", "Bach", "Beethoven", "Chopin"], a: 2 },
    { q: "What is a polyrhythm?", options: ["Many fast beats", "Two or more rhythms playing together", "A long drum solo", "A synthesized beat"], a: 1 }
  ];

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);
    setQuestions(shuffled);
  }, []);

  useEffect(() => {
    if (gameOver || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          handleAnswer(-1); // timeout
          return 10;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQ, gameOver, questions]);

  const handleAnswer = (idx) => {
    if (idx === questions[currentQ].a) {
      setScore(s => s + 1);
      playSynthNote(800, 'square', 0.1);
      setTimeout(() => playSynthNote(1200, 'square', 0.15), 100);
    } else {
      playSynthNote(200, 'sawtooth', 0.3);
    }
    
    if (currentQ < 4) {
      setCurrentQ(q => q + 1);
      setTimeLeft(10);
    } else {
      setGameOver(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (questions.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Micro 5', monospace" }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={32} /></button>
      
      <div style={{ width: '90%', maxWidth: 500, background: '#FFFDF0', padding: 30, borderRadius: 8, color: '#000', boxShadow: '0 0 20px rgba(0,0,0,0.5)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', width: 100, height: 100, background: '#111', borderRadius: '50%', border: '4px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 30, height: 30, background: '#DAA520', borderRadius: '50%' }} />
        </div>
        
        <h1 style={{ fontSize: 42, textAlign: 'center', marginTop: 40, borderBottom: '2px solid #000', paddingBottom: 10 }}>CRATE DIGGER TRIVIA</h1>
        
        {gameOver ? (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <h2 style={{ fontSize: 36 }}>FINAL SCORE: {score}/5</h2>
            <p style={{ fontSize: 24, marginTop: 10 }}>{score >= 4 ? "True Audiophile!" : "Keep Digging!"}</p>
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 20px', fontSize: 24, background: '#111', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>CLOSE</button>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, marginBottom: 10 }}>
              <span>Q: {currentQ + 1}/5</span>
              <span style={{ color: timeLeft <= 3 ? '#ef4444' : '#000' }}>TIME: {timeLeft}s</span>
            </div>
            <p style={{ fontSize: 28, marginBottom: 20, minHeight: 60 }}>{questions[currentQ].q}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {questions[currentQ].options.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => handleAnswer(i)}
                  style={{ padding: '12px 20px', fontSize: 24, background: '#f0f0f0', border: '2px solid #ccc', borderRadius: 4, textAlign: 'left', cursor: 'pointer', fontFamily: "'Micro 5', monospace" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
                >
                  {i + 1}. {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// --- MAIN SCENE ---

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
  "Got a little 8-bit loop playing in the background.",
  "Take a look around. The mixing desk is visualizing the track right now."
];

function MusicRoomScene() {
  const { speedMultiplier, isLandscape, isTransitioning, changeScene, isConsoleMinimized, musicPlaying, musicMuted, musicVolume } = useGame();
  const viewport = useViewport(isLandscape, isConsoleMinimized);
  const { scale, internalW, internalH } = viewport;
  const [phase, setPhase] = useState("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [openGame, setOpenGame] = useState(null); // null, "drums", "guitar", "vinyl"
  const containerRef = useRef(null);
  const musicRef = useRef({ audioCtx: null, interval: null });

  // === SIMPLE 8-BIT ARPEGGIO (same approach as Library) ===
  const playStep = useCallback((stepIndex, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = getSharedAudioCtx();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      // Moody studio progression — Dm9 → Bbmaj7 → Gm7 → Asus4
      const progression = [
        [73.42, 146.83, 174.61, 220.00],  // Dm9
        [116.54, 146.83, 174.61, 220.00], // Bbmaj7
        [98.00, 116.54, 146.83, 174.61],  // Gm7
        [110.00, 146.83, 164.81, 220.00]  // Asus4
      ];

      const chordIdx = Math.floor(stepIndex / 8) % progression.length;
      const stepIdx = stepIndex % 8;
      const chord = progression[chordIdx];
      const time = ctx.currentTime;

      // Bass — root on beat 0, fifth on beat 4
      if (stepIdx === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(chord[0], time);
        gain.gain.setValueAtTime(vol * 0.13, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.7);
      } else if (stepIdx === 4) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(chord[2], time);
        gain.gain.setValueAtTime(vol * 0.09, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.5);
      }

      // 8-bit arpeggio — descending cascade then rising
      const pattern = [3, 2, 1, 0, 1, 2, 3, -1];
      const noteIdx = pattern[stepIdx];
      if (noteIdx !== -1) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        const f = chord[noteIdx] * (stepIdx < 4 ? 2 : 1.5);
        osc.frequency.setValueAtTime(f, time);
        gain.gain.setValueAtTime(vol * 0.035, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.14);
      }
    } catch (e) {}
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
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
    };
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
    isActive: phase === "free" && !isTransitioning && !openGame,
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
      if (checkC >= 3 && checkC <= 5 && checkR >= 13 && checkR <= 15) { setOpenGame("guitar"); return; }
      if (checkC >= 18 && checkC <= 21 && checkR >= 12 && checkR <= 15) { setOpenGame("drums"); return; }
      if (checkC >= 20 && checkC <= 22 && checkR >= 2 && checkR <= 4) { setOpenGame("vinyl"); return; }
    }
  });

  const playerRef = useRef(null);
  const worldRef = useRef(null);
  useSmoothPixelGrid({ pos, internalW, internalH, mapCols: MAP_COLS, mapRows: MAP_ROWS, speedMultiplier, worldRef, playerRef });
  const handleWorldTap = useTapToMove(worldRef, pos, isWalkable, setPath, MAP_COLS, MAP_ROWS, phase === "free" && !isTransitioning && !openGame);

  const activePrompt = useMemo(() => {
    if (phase !== "free" || isTransitioning || openGame) return null;
    let checkR = pos.row; let checkC = pos.col;
    if (facing === "up") checkR--; else if (facing === "down") checkR++; else if (facing === "left") checkC--; else if (facing === "right") checkC++;
    if (checkC === NPC_POS.col && checkR === NPC_POS.row) return "TALK TO SAAD";
    if (checkC >= 3 && checkC <= 5 && checkR >= 13 && checkR <= 15) return "GUITARS";
    if (checkC >= 18 && checkC <= 21 && checkR >= 12 && checkR <= 15) return "DRUM KIT";
    if (checkC >= 20 && checkC <= 22 && checkR >= 2 && checkR <= 4) return "VINYL CRATES";
    return null;
  }, [pos, facing, phase, isTransitioning, openGame]);

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
      {openGame === "drums" && <DrumsGame onClose={() => setOpenGame(null)} />}
      {openGame === "guitar" && <GuitarGame onClose={() => setOpenGame(null)} />}
      {openGame === "vinyl" && <VinylGame onClose={() => setOpenGame(null)} />}
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
