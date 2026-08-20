"use client";
import React, { useState, useEffect, useRef, memo } from "react";
import { useCameraLerp } from '../hooks/useCameraLerp.js';
import { getSharedAudioCtx } from '../engine/sfx.js';
import { ArrowLeft, ArrowDown } from "lucide-react";
import { TILE } from '../engine/constants';
import PlayerSprite from "../components/sprites/PlayerSprite";
import SaadSprite from "../components/sprites/SaadSprite";
import ControlBar from "../components/ui/ControlBar";
import DialogueBox from "../components/ui/DialogueBox";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { useTapToMove, TapMarker } from "../hooks/useTapToMove.jsx";
import { playWoodStep } from "../engine/sfx";

const MAP_COLS = 24;
const MAP_ROWS = 18;

// 0: void, 1: floor, 2: wall, 3: rug
const MAP = Array.from({ length: MAP_ROWS }, (_, r) => 
  Array.from({ length: MAP_COLS }, (_, c) => {
    if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) return 2; // walls
    if (c >= 6 && c <= 18 && r >= 6 && r <= 12) return 3; // studio rug
    return 1; // floor
  })
);

const NPC_POS = { col: 6, row: 8 };
const DIALOGUE_LINES = [
  "The studio. Not much to mess with yet, but the sound system works. Head back downstairs whenever you want.",
];

function MusicRoomScene({ isLandscape, onBackToVillage, onGoToNomadshome, triggerTransition, isTransitioning, speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume }) {
  const [scale, setScale] = useState(1);
  const [internalW, setInternalW] = useState(384);
  const [internalH, setInternalH] = useState(288);
  const [phase, setPhase] = useState("intro");
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  useEffect(() => {
    const handleResize = () => {
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
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLandscape]);

  // Object hitboxes
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

  const { pos, facing, stepping, setPath, tapTarget } = usePlayerMovement({
    initialPos: { col: 2, row: 2 }, // spawn near stairs
    isActive: phase === "free" && !isTransitioning,
    canWalk: isWalkable,
    speedMultiplier,
    onMove: (c, r) => {
      // Stairs Down (top left corner)
      if (c >= 1 && c <= 2 && r === 1) {
        onBackToVillage();
        return true;
      }
      playWoodStep();
      return false;
    },
    onAction: () => {
      const dc = Math.abs(NPC_POS.col - pos.col);
      const dr = Math.abs(NPC_POS.row - pos.row);
      if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
        setDialogueIndex(0);
        setPhase("talking");
      }
    }
  });

  const cam = useCameraLerp(pos, TILE, internalW, internalH, MAP_COLS, MAP_ROWS, speedMultiplier);
  const worldRef = useRef(null);
  const handleWorldTap = useTapToMove(worldRef, pos, isWalkable, setPath, MAP_COLS, MAP_ROWS, phase === "free" && !isTransitioning);


  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#000", fontFamily: "'Press Start 2P', monospace", userSelect: "none", boxSizing: "border-box", height: "100dvh", width: "100dvw",
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center", imageRendering: "pixelated" }}>
          <div style={{ position: "relative", width: internalW, height: internalH, overflow: "hidden", background: "#111", boxShadow: "0 0 0 4px #222" }}>
            
            <div ref={worldRef} onPointerDown={handleWorldTap} style={{ position: "absolute", left: -cam.x, top: -cam.y, width: MAP_COLS * TILE, height: MAP_ROWS * TILE }}>
              <TapMarker tapTarget={tapTarget} TILE={TILE} />
              <StaticWorld />


              {/* NPC Saad */}
              <div style={{
                position: "absolute",
                left: NPC_POS.col * TILE,
                top: NPC_POS.row * TILE,
                width: TILE, height: TILE,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: NPC_POS.row * 10,
                filter: (Math.abs(NPC_POS.col - pos.col) <= 1 && Math.abs(NPC_POS.row - pos.row) <= 1) ? "drop-shadow(0 0 6px rgba(218,165,32,0.6))" : "none",
                transition: "filter 0.2s",
              }}>
                <SaadSprite direction="left" />
                {(Math.abs(NPC_POS.col - pos.col) <= 1 && Math.abs(NPC_POS.row - pos.row) <= 1) && phase === "free" && (
                  <div style={{
                    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                    background: "#fff", border: "2px solid #000", borderRadius: 4, padding: "1px 4px",
                    fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: "#000",
                    animation: "npcBounce 1s infinite", zIndex: 100,
                  }}>!</div>
                )}
              </div>

              <div style={{
                position: "absolute", left: pos.col * TILE, top: pos.row * TILE, transition: "left 0.14s linear, top 0.14s linear",
                width: TILE, height: TILE, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PlayerSprite direction={facing} stepping={stepping} costume="casual" />
              </div>
            </div>
            
            <button onClick={onBackToVillage} style={{
              position: "absolute", top: 8, left: 8, fontFamily: "'Press Start 2P', monospace", fontSize: 6,
              background: "#222", color: "#fff", border: "2px solid #fff", padding: "4px 8px", cursor: "pointer", pointerEvents: "auto",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={6} /> VILLAGE</div>
            </button>

            {(phase === "intro" || phase === "talking") && (
              <DialogueBox
                lines={DIALOGUE_LINES}
                lineIndex={dialogueIndex}
                onAdvance={() => setDialogueIndex(i => i + 1)}
                onDismiss={() => setPhase("free")}
                speaker="SAAD IBRA"
                theme="music"
                lastButtonLabel="GOT IT"
              />
            )}
            
            <style>{`
              @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
              @keyframes npcBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
            `}</style>
          </div>
          </div>
      </div>
      <ControlBar
        musicPlaying={musicPlaying} musicMuted={musicMuted} musicVolume={musicVolume} speedMultiplier={speedMultiplier}
        onTogglePlay={() => musicPlaying ? setMusicMuted(!musicMuted) : setMusicPlaying(true)} onChangeVolume={setMusicVolume} onChangeSpeed={setSpeedMultiplier}
      />
    </div>
  );
}

const StaticWorld = memo(() => (
  <>
    {/* Floor - Dark Wood / Studio */}
    <div style={{ position: "absolute", left: TILE, top: TILE, width: (MAP_COLS-2)*TILE, height: (MAP_ROWS-2)*TILE, background: "#2C1B18" }}>
        {/* Floorboards */}
        {Array.from({ length: MAP_ROWS - 2 }).map((_, r) => (
          <div key={r} style={{ position: "absolute", top: r * TILE, left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.3)" }} />
        ))}
        {/* Soundproofing Studio Rug */}
        <div style={{ position: "absolute", left: 5*TILE, top: 5*TILE, width: 13*TILE, height: 7*TILE, background: "#1A1A1A", border: "2px solid #333", borderRadius: 8 }}>
          <div style={{ position: "absolute", inset: 4, background: "#222", borderRadius: 4 }} />
        </div>
    </div>
    
    {/* Soundproof Walls */}
    <div style={{ position: "absolute", left: TILE, top: 0, width: (MAP_COLS-2)*TILE, height: TILE, background: "#3A3A3A", borderBottom: "4px solid #111", display: "flex" }}>
        {Array.from({ length: MAP_COLS - 2 }).map((_, c) => (
          <div key={c} style={{ flex: 1, borderRight: "1px solid #222", borderLeft: "1px solid #444", background: c % 2 === 0 ? "#333" : "#3A3A3A" }} />
        ))}
    </div>
    
    {/* Stairs Down */}
    <div style={{ position: "absolute", left: TILE, top: TILE, width: 2*TILE, height: 2*TILE, background: "#1A0F0D", borderRight: "2px solid #000", display: "flex", flexDirection: "column" }}>
      {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, borderBottom: "2px solid #0A0504", borderTop: "1px solid #3A221C" }} />)}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", color: "#fff", opacity: 0.5 }}><ArrowDown size={12} /></div>
    </div>

    {/* Mixing Desk & Monitors */}
    <div style={{ position: "absolute", left: 9*TILE, top: 4*TILE, width: 7*TILE, height: 2*TILE, background: "#222", border: "2px solid #000", borderRadius: 4, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 32, background: "#111", border: "1px solid #444", display: "flex", flexDirection: "column", gap: 2, padding: 2 }}>
          <div style={{ display: "flex", gap: 2, flex: 1 }}>
              {Array.from({length: 12}).map((_,i) => <div key={i} style={{ flex: 1, background: i%3===0 ? "#f00" : "#0f0", height: Math.random() * 20 + 4, alignSelf: "flex-end" }} />)}
          </div>
        </div>
        {/* Studio Chair */}
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
        {/* Bass Drum */}
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 40, height: 40, background: "#EEE", border: "4px solid #8B0000", borderRadius: "50%" }} />
        {/* Snare */}
        <div style={{ position: "absolute", left: 4, top: 20, width: 24, height: 24, background: "#FFF", border: "2px solid #CCC", borderRadius: "50%" }} />
        {/* Hi-Hat */}
        <div style={{ position: "absolute", left: 0, top: 4, width: 20, height: 20, background: "#DAA520", borderRadius: "50%" }} />
        {/* Cymbal */}
        <div style={{ position: "absolute", right: 0, top: 0, width: 28, height: 28, background: "#DAA520", borderRadius: "50%" }} />
        {/* Floor Tom */}
        <div style={{ position: "absolute", right: 8, bottom: 8, width: 30, height: 30, background: "#EEE", border: "4px solid #8B0000", borderRadius: "50%" }} />
    </div>

    {/* Guitars */}
    <div style={{ position: "absolute", left: 3*TILE, top: 13*TILE, width: 3*TILE, height: 3*TILE, display: "flex", gap: 8 }}>
        {/* Strat */}
        <div style={{ width: 16, height: 48, background: "#111", borderRadius: 8, position: "relative", transform: "rotate(15deg)" }}>
          <div style={{ position: "absolute", left: 6, top: -16, width: 4, height: 24, background: "#D2B48C" }} />
        </div>
        {/* Bass */}
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
