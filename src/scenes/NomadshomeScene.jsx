"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { TILE, INTERNAL_W, INTERNAL_H, MOVE_COOLDOWN } from "../engine/constants";
import PlayerSprite from "../components/sprites/PlayerSprite";
import ControlBar from "../components/ui/ControlBar";
import ExitDoor from "../components/sprites/ExitDoor";

const MAP_COLS = 16;
const MAP_ROWS = 12;

export default function NomadshomeScene({ onBackToVillage }) {
  const [pos, setPos] = useState({ col: Math.floor(MAP_COLS / 2), row: MAP_ROWS - 2 });
  const [facing, setFacing] = useState("up");
  const [stepping, setStepping] = useState(false);
  const [scale, setScale] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(() => parseFloat(localStorage.getItem("speedMultiplier") || "1"));
  
  const keysRef = useRef({});
  const lastMoveRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  useEffect(() => {
    const handleResize = () => setScale(Math.min(window.innerWidth / INTERNAL_W, window.innerHeight / (INTERNAL_H + 80)));
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onDown = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const onUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastMoveRef.current < (MOVE_COOLDOWN / speedMultiplier)) return;
      const k = keysRef.current;
      let dc = 0, dr = 0;
      if (k["arrowup"] || k["w"]) dr = -1;
      else if (k["arrowdown"] || k["s"]) dr = 1;
      else if (k["arrowleft"] || k["a"]) dc = -1;
      else if (k["arrowright"] || k["d"]) dc = 1;

      if (dc === 0 && dr === 0) { setStepping(false); return; }
      const dir = dr < 0 ? "up" : dr > 0 ? "down" : dc < 0 ? "left" : "right";
      setFacing(dir);
      
      setPos((p) => {
        const nc = p.col + dc;
        const nr = p.row + dr;

        if (nc === Math.floor(MAP_COLS / 2) && nr === MAP_ROWS - 1) {
          onBackToVillage();
          return p;
        }

        if (nc >= 1 && nc < MAP_COLS - 1 && nr >= 1 && nr < MAP_ROWS - 1) {
          setStepping((s) => !s);
          lastMoveRef.current = now;
          return { col: nc, row: nr };
        }
        return p;
      });
    }, 30);
    return () => clearInterval(id);
  }, [speedMultiplier, onBackToVillage]);

  const rawCamX = pos.col * TILE + TILE / 2 - INTERNAL_W / 2;
  const rawCamY = pos.row * TILE + TILE / 2 - INTERNAL_H / 2;
  const camX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - INTERNAL_W), rawCamX));
  const camY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - INTERNAL_H), rawCamY));

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#000", fontFamily: "'Press Start 2P', monospace", userSelect: "none",
    }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "center", imageRendering: "pixelated" }}>
        <div style={{ position: "relative", width: INTERNAL_W, height: INTERNAL_H, overflow: "hidden", background: "#111", boxShadow: "0 0 0 4px #222" }}>
          
          <div style={{ position: "absolute", left: -camX, top: -camY, width: MAP_COLS * TILE, height: MAP_ROWS * TILE }}>
            {/* Floor */}
            <div style={{ position: "absolute", left: TILE, top: TILE, width: (MAP_COLS-2)*TILE, height: (MAP_ROWS-2)*TILE, background: "#4a3320" }} />
            {/* Walls */}
            <div style={{ position: "absolute", left: TILE, top: 0, width: (MAP_COLS-2)*TILE, height: TILE, background: "#3a1c22" }} />
            
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
            background: "#222", color: "#fff", border: "2px solid #fff", padding: "4px 8px", cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={6} /> VILLAGE</div>
          </button>
        </div>
        
        <ControlBar
          width={INTERNAL_W} musicPlaying={false} musicMuted={false} musicVolume={0.1} speedMultiplier={speedMultiplier}
          onTogglePlay={() => {}} onChangeVolume={() => {}} onChangeSpeed={setSpeedMultiplier}
        />
      </div>
    </div>
  );
}
