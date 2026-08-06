"use client";
import { useState, useEffect, useRef } from "react";
import { getSharedAudioCtx } from '../engine/sfx.js';
import { ArrowLeft, ArrowUp } from "lucide-react";
import { TILE } from '../engine/constants';
import PlayerSprite from "../components/sprites/PlayerSprite";
import SaadSprite from "../components/sprites/SaadSprite";
import ControlBar from "../components/ui/ControlBar";
import DialogueBox from "../components/ui/DialogueBox";
import ExitDoor from "../components/sprites/ExitDoor";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { playWoodStep } from "../engine/sfx";

const MAP_COLS = 24;
const MAP_ROWS = 18;

// NPC position: center of room on the rug, facing toward player spawn
const NPC_POS = { col: 12, row: 11 };

const DIALOGUE_LINES = [
  "Hey. I'm Saad. This is my place. The whole village outside is my portfolio, and you're standing in the middle of it.",
  "Use the arrow keys or WASD to walk. Press SPACE near things to interact. If you're on a phone, the D-pad and buttons below work the same way.",
  "Head out the front door to reach the village. There's a Library with my reading list, a Lab full of my code, and a Newsroom where I write.",
  "The stairs up in the corner lead to my studio. Take a look around whenever you're ready.",
];

// 0: void, 1: floor, 2: wall, 3: rug
const MAP = Array.from({ length: MAP_ROWS }, (_, r) => 
  Array.from({ length: MAP_COLS }, (_, c) => {
    if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) return 2; // walls
    if (c >= 10 && c <= 14 && r >= 8 && r <= 10) return 3; // rug
    return 1; // floor
  })
);

export default function NomadshomeScene({ isLandscape, onBackToVillage, onGoToMusicRoom, speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume }) {
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
    // Allow exit door
    if (c === Math.floor(MAP_COLS / 2) && r === MAP_ROWS - 1) return true;
    // NPC tile
    if (c === NPC_POS.col && r === NPC_POS.row) return false;
    
    if (c < 1 || c >= MAP_COLS - 1 || r < 1 || r >= MAP_ROWS - 1) return false;
    // Bed (left side)
    if (c >= 2 && c <= 4 && r >= 2 && r <= 5) return false;
    // Bookshelf (top right)
    if (c >= 18 && c <= 21 && r === 1) return false;
    // Kitchen (right side)
    if (c >= 20 && c <= 22 && r >= 6 && r <= 10) return false;
    // Dining Table
    if (c >= 15 && c <= 17 && r >= 7 && r <= 9) return false;
    // TV / Sofa
    if (c >= 5 && c <= 9 && r >= 13 && r <= 15) return false;
    return true;
  };

  const { pos, facing, stepping } = usePlayerMovement({
    initialPos: { col: 12, row: 13 },
    canWalk: isWalkable,
    speedMultiplier,
    isActive: phase === "free",
    onMove: (c, r) => {
      // Exit Door (bottom)
      if (c === Math.floor(MAP_COLS / 2) && r === MAP_ROWS - 1) {
        onBackToVillage();
        return true;
      }
      // Stairs Up (top left corner)
      if (c >= 1 && c <= 2 && r === 1) {
        onGoToMusicRoom();
        return true;
      }
      playWoodStep();
      return false;
    },
    onAction: () => {
      // Check if adjacent to NPC
      const dc = Math.abs(NPC_POS.col - pos.col);
      const dr = Math.abs(NPC_POS.row - pos.row);
      if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
        setDialogueIndex(0);
        setPhase("talking");
      }
    },
  });

  // Keyboard listener for intro phase (auto-start dialogue)
  useEffect(() => {
    if (phase !== "intro") return;
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter" || k === "escape" ||
          ["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)) {
        e.preventDefault();
        // Don't dismiss on first interaction, let DialogueBox handle it
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const rawCamX = pos.col * TILE + TILE / 2 - internalW / 2;
  const rawCamY = pos.row * TILE + TILE / 2 - internalH / 2;
  const camX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - internalW), rawCamX));
  const camY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - internalH), rawCamY));

  // Check if player is near NPC (for glow effect)
  const isNearNpc = Math.abs(NPC_POS.col - pos.col) <= 1 && Math.abs(NPC_POS.row - pos.row) <= 1;

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#000", fontFamily: "'Press Start 2P', monospace", userSelect: "none", boxSizing: "border-box", height: "100dvh", width: "100dvw",
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
          @keyframes npcBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        `}</style>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center", imageRendering: "pixelated" }}>
          <div style={{ position: "relative", width: internalW, height: internalH, overflow: "hidden", background: "#111", boxShadow: "0 0 0 4px #222" }}>
            
            <div style={{ position: "absolute", left: -camX, top: -camY, transition: "left 0.14s linear, top 0.14s linear", width: MAP_COLS * TILE, height: MAP_ROWS * TILE }}>
              {/* Floor */}
              <div style={{ position: "absolute", left: TILE, top: TILE, width: (MAP_COLS-2)*TILE, height: (MAP_ROWS-2)*TILE, background: "#8B5A2B" }}>
                 {/* Floorboards */}
                 {Array.from({ length: MAP_ROWS - 2 }).map((_, r) => (
                   <div key={r} style={{ position: "absolute", top: r * TILE, left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.15)" }} />
                 ))}
                 {/* Rug */}
                 <div style={{ position: "absolute", left: 9*TILE, top: 7*TILE, width: 5*TILE, height: 3*TILE, background: "#CD5C5C", border: "2px solid #8B1A1A", borderRadius: 4 }} />
              </div>
              
              {/* Walls */}
              <div style={{ position: "absolute", left: TILE, top: 0, width: (MAP_COLS-2)*TILE, height: TILE, background: "#5C4033", borderBottom: "4px solid #3E2723" }} />
              
              {/* Stairs Up */}
              <div style={{ position: "absolute", left: TILE, top: TILE, width: 2*TILE, height: 2*TILE, background: "#A0522D", borderRight: "2px solid #6B4226", display: "flex", flexDirection: "column" }}>
                {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, borderTop: "1px solid #CD853F", borderBottom: "2px solid #5C3A21" }} />)}
                <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", color: "#fff", opacity: 0.5 }}><ArrowUp size={12} /></div>
              </div>

              {/* Bed */}
              <div style={{ position: "absolute", left: 2*TILE, top: 2*TILE, width: 3*TILE, height: 4*TILE, background: "#4682B4", border: "2px solid #2F4F4F", borderRadius: 6 }}>
                <div style={{ position: "absolute", left: 4, top: 4, right: 4, height: 14, background: "#fff", borderRadius: 4 }} />
                <div style={{ position: "absolute", left: 0, top: 24, right: 0, height: 4, background: "#5F9EA0" }} />
              </div>

              {/* Bookshelf */}
              <div style={{ position: "absolute", left: 18*TILE, top: 0.5*TILE, width: 4*TILE, height: 1.5*TILE, background: "#8B4513", border: "2px solid #5C3A21" }}>
                 <div style={{ position: "absolute", left: 2, top: 6, right: 2, height: 2, background: "#5C3A21" }} />
                 <div style={{ position: "absolute", left: 2, top: 18, right: 2, height: 2, background: "#5C3A21" }} />
                 {[...Array(12)].map((_, i) => <div key={i} style={{ position: "absolute", left: 4 + i*4, top: 2, width: 3, height: 4, background: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"][i%4] }} />)}
              </div>

              {/* Kitchen Counter */}
              <div style={{ position: "absolute", left: 20*TILE, top: 6*TILE, width: 3*TILE, height: 5*TILE, background: "#D3D3D3", border: "2px solid #A9A9A9", borderLeft: "4px solid #808080" }}>
                 <div style={{ position: "absolute", left: 8, top: 8, width: 16, height: 24, background: "#F0F8FF", border: "2px solid #B0C4DE", borderRadius: 4 }} />
                 <div style={{ position: "absolute", left: 8, bottom: 8, width: 16, height: 24, background: "#2F4F4F", border: "2px solid #1A1A1A", borderRadius: 2 }}>
                   <div style={{ position: "absolute", left: 2, top: 2, width: 4, height: 4, background: "#FF4500", borderRadius: "50%" }} />
                   <div style={{ position: "absolute", right: 2, top: 2, width: 4, height: 4, background: "#FF4500", borderRadius: "50%" }} />
                   <div style={{ position: "absolute", left: 2, bottom: 2, width: 4, height: 4, background: "#FF4500", borderRadius: "50%" }} />
                   <div style={{ position: "absolute", right: 2, bottom: 2, width: 4, height: 4, background: "#FF4500", borderRadius: "50%" }} />
                 </div>
              </div>

              {/* Dining Table */}
              <div style={{ position: "absolute", left: 15*TILE, top: 7*TILE, width: 3*TILE, height: 3*TILE, background: "#DEB887", border: "2px solid #8B4513", borderRadius: 16 }}>
                 <div style={{ position: "absolute", left: "50%", top: -8, width: 12, height: 12, background: "#CD853F", borderRadius: "50%", transform: "translateX(-50%)" }} />
                 <div style={{ position: "absolute", left: "50%", bottom: -8, width: 12, height: 12, background: "#CD853F", borderRadius: "50%", transform: "translateX(-50%)" }} />
                 <div style={{ position: "absolute", top: "50%", left: -8, width: 12, height: 12, background: "#CD853F", borderRadius: "50%", transform: "translateY(-50%)" }} />
                 <div style={{ position: "absolute", top: "50%", right: -8, width: 12, height: 12, background: "#CD853F", borderRadius: "50%", transform: "translateY(-50%)" }} />
              </div>

              {/* TV & Sofa */}
              <div style={{ position: "absolute", left: 5*TILE, top: 13*TILE, width: 5*TILE, height: 3*TILE }}>
                 <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: "#111", border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <div style={{ width: 4, height: 24, background: "#444" }} />
                 </div>
                 <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 2*TILE, background: "#8A2BE2", border: "2px solid #4B0082", borderRadius: 8 }} />
              </div>

              <ExitDoor col={Math.floor(MAP_COLS / 2)} row={MAP_ROWS - 1} />

              {/* NPC Saad */}
              <div style={{
                position: "absolute",
                left: NPC_POS.col * TILE,
                top: NPC_POS.row * TILE,
                width: TILE, height: TILE,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: NPC_POS.row * 10,
                filter: isNearNpc && phase === "free" ? "drop-shadow(0 0 6px rgba(244,232,208,0.6))" : "none",
                transition: "filter 0.2s",
              }}>
                <SaadSprite direction="down" />
              </div>

              {/* Player */}
              <div style={{
                position: "absolute", left: pos.col * TILE, top: pos.row * TILE, transition: "left 0.14s linear, top 0.14s linear",
                width: TILE, height: TILE, display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: pos.row * 10 + 5,
              }}>
                <PlayerSprite direction={facing} stepping={stepping} costume="casual" />
              </div>
            </div>
            
            <button onClick={onBackToVillage} style={{
              position: "absolute", top: 8, left: 8, fontFamily: "'Press Start 2P', monospace", fontSize: 6,
              background: "#222", color: "#fff", border: "2px solid #fff", padding: "4px 8px", cursor: "pointer", pointerEvents: "auto", zIndex: 500,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={6} /> VILLAGE</div>
            </button>

            {/* Dialogue overlay */}
            {(phase === "intro" || phase === "talking") && (
              <DialogueBox
                lines={DIALOGUE_LINES}
                lineIndex={dialogueIndex}
                onAdvance={() => setDialogueIndex(i => i + 1)}
                onDismiss={() => setPhase("free")}
                speaker="SAAD IBRA"
                theme="home"
                lastButtonLabel="GOT IT"
              />
            )}
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
