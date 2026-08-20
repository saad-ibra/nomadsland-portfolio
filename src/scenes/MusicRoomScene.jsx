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
  const worldRef = useRef(null);
  const handleWorldTap = useTapToMove(worldRef, pos, isWalkable, setPath, MAP_COLS, MAP_ROWS, phase === "free" && !isTransitioning);


  const cam = useCameraLerp(pos, TILE, internalW, internalH, MAP_COLS, MAP_ROWS, speedMultiplier); 

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
        musicPlaying={musicPlaying} musicMuted={musicMuted} musicVolume={