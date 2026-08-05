"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { TILE } from '../engine/constants';
import PlayerSprite from "../components/sprites/PlayerSprite";
import ControlBar from "../components/ui/ControlBar";
import ExitDoor from "../components/sprites/ExitDoor";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { playWoodStep } from "../engine/sfx";

const MAP_COLS = 24;
const MAP_ROWS = 18;

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
  const containerRef = useRef(null);

  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
      const availableHeight = window.innerHeight - consoleHeight;
      const availableWidth = isLandscape ? (window.innerWidth - 320) : window.innerWidth;
      const newScale = Math.max(1, Math.floor(Math.min(availableWidth, availableHeight) / 240));
      setScale(newScale);
      setInternalW(availableWidth / newScale);
      setInternalH(availableHeight / newScale);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLandscape]);

  // Object hitboxes
  const isWalkable = (c, r) => {
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
    initialPos: { col: Math.floor(MAP_COLS / 2), row: MAP_ROWS - 2 },
    canWalk: isWalkable,
    speedMultiplier,
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
    }
  });

  const rawCamX = pos.col * TILE + TILE / 2 - internalW / 2;
  const rawCamY = pos.row * TILE + TILE / 2 - internalH / 2;
  const camX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - internalW), rawCamX));
  const camY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - internalH), rawCamY));

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#000", fontFamily: "'Press Start 2P', monospace", userSelect: "none", boxSizing: "border-box", height: "100dvh", width: "100dvw",
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center", imageRendering: "pixelated" }}>
          <div style={{ position: "relative", width: internalW, height: internalH, overflow: "hidden", background: "#111", boxShadow: "0 0 0 4px #222" }}>
            
            <div style={{ position: "absolute", left: -camX, top: -camY, width: MAP_COLS * TILE, height: MAP_ROWS * TILE }}>
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
                {/* Pillow */}
                <div style={{ position: "absolute", left: 4, top: 4, right: 4, height: 14, background: "#fff", borderRadius: 4 }} />
                {/* Blanket Fold */}
                <div style={{ position: "absolute", left: 0, top: 24, right: 0, height: 4, background: "#5F9EA0" }} />
              </div>

              {/* Bookshelf */}
              <div style={{ position: "absolute", left: 18*TILE, top: 0.5*TILE, width: 4*TILE, height: 1.5*TILE, background: "#8B4513", border: "2px solid #5C3A21" }}>
                 <div style={{ position: "absolute", left: 2, top: 6, right: 2, height: 2, background: "#5C3A21" }} />
                 <div style={{ position: "absolute", left: 2, top: 18, right: 2, height: 2, background: "#5C3A21" }} />
                 {/* Fake books */}
                 {[...Array(12)].map((_, i) => <div key={i} style={{ position: "absolute", left: 4 + i*4, top: 2, width: 3, height: 4, background: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"][i%4] }} />)}
              </div>

              {/* Kitchen Counter */}
              <div style={{ position: "absolute", left: 20*TILE, top: 6*TILE, width: 3*TILE, height: 5*TILE, background: "#D3D3D3", border: "2px solid #A9A9A9", borderLeft: "4px solid #808080" }}>
                 {/* Sink */}
                 <div style={{ position: "absolute", left: 8, top: 8, width: 16, height: 24, background: "#F0F8FF", border: "2px solid #B0C4DE", borderRadius: 4 }} />
                 {/* Stove */}
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
                 {/* TV */}
                 <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: "#111", border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <div style={{ width: 4, height: 24, background: "#444" }} />
                 </div>
                 {/* Sofa */}
                 <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 2*TILE, background: "#8A2BE2", border: "2px solid #4B0082", borderRadius: 8 }} />
              </div>

              <ExitDoor col={Math.floor(MAP_COLS / 2)} row={MAP_ROWS - 1} />

              <div style={{
                position: "absolute", left: pos.col * TILE, top: pos.row * TILE,
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
