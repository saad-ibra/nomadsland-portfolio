"use client";
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { ArrowLeft } from "lucide-react";
import { useForm, ValidationError } from '@formspree/react';
import { useGame } from '../context/GameContext.jsx';
import { TILE } from '../engine/constants';
import PlayerSprite from "../components/sprites/PlayerSprite";
import SaadSprite from "../components/sprites/SaadSprite";
import ControlBar from "../components/ui/ControlBar";
import DialogueBox from "../components/ui/DialogueBox";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { useTapToMove, TapMarker } from "../hooks/useTapToMove.jsx";
import { useCameraLerp } from "../hooks/useCameraLerp";
import { getSharedAudioCtx, playWoodStep, playBlip } from "../engine/sfx";
import ExitDoor from "../components/sprites/ExitDoor";

// --- MAP CONFIG ---
const MAP_COLS = 16;
const MAP_ROWS = 12;

const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1],
];

const START_POS = { col: 7, row: 10 };

const FURNITURE = [
  { col: 7, row: 7, type: "resume", label: "My Resume", w: 1, h: 1, collision: true },
  { col: 1, row: 1, type: "bed", label: "Cozy Bed", w: 3, h: 4, collision: true },
  { col: 4, row: 1, type: "nightstand", label: "Nightstand", w: 1, h: 1, collision: true },
  { col: 1, row: 5, type: "plant", label: "Cactus", w: 1, h: 1, collision: true },
  { col: 10, row: 1, type: "kitchen", label: "Kitchenette", w: 4, h: 2, collision: true },
  { col: 14, row: 1, type: "fridge", label: "Fridge", w: 1, h: 2, collision: true },
  { col: 1, row: 6, type: "aquarium", label: "Aquarium", w: 2, h: 2, collision: true },
  { col: 5, row: 6, type: "rug", w: 6, h: 4, collision: false }, 
  { col: 12, row: 9, type: "pc_desk", label: "Workstation", w: 3, h: 2, collision: true },
  { col: 13, row: 5, type: "bookshelf", label: "Bookshelf", w: 2, h: 2, collision: true },
  { col: 1, row: 9, type: "toilet", label: "Toilet", w: 1, h: 2, collision: true },
];

const INTRO_DIALOGUE = [
  "Hey. I'm Saad. This is my place. The whole village outside is my portfolio, and you're standing in the middle of it.",
  "Use the arrow keys or WASD to walk. Press SPACE near things to interact. If you are on a phone, the buttons below work the same way.",
  "Head out the front door to reach the village. There is a Library with my reading list, a Lab full of my code, and a Newsroom where I write.",
  "Take a look around my room first whenever you are ready."
];

const NPC_POS = { col: 8, row: 7 };

const FurnitureSprite = ({ item }) => {
  const { type } = item;
  if (type === "bed") return <div style={{ width: "100%", height: "100%", background: "#4a3c31", borderRadius: 4, position: "relative", boxShadow: "2px 4px 6px rgba(0,0,0,0.5)", border: "2px solid #2a1c11" }}><div style={{ position: "absolute", bottom: 0, left: 2, right: 2, height: "65%", background: "#3a6080", borderRadius: "0 0 2px 2px", borderTop: "3px solid #2a4060", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)" }} /><div style={{ position: "absolute", top: 6, left: 6, width: "35%", height: 16, background: "#e0e0e0", borderRadius: 2, boxShadow: "1px 2px 2px rgba(0,0,0,0.3)" }} /><div style={{ position: "absolute", top: 6, right: 6, width: "35%", height: 16, background: "#e0e0e0", borderRadius: 2, boxShadow: "1px 2px 2px rgba(0,0,0,0.3)" }} /></div>;
  if (type === "nightstand") return <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}><div style={{ width: "100%", height: "100%", background: "#6b4a2e", border: "2px solid #3a1c11", borderRadius: 2, position: "relative", boxShadow: "2px 2px 4px rgba(0,0,0,0.4)" }}><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 4, height: 2, background: "#3a1c11" }} /></div><div style={{ position: "absolute", top: -8, left: 4, width: 14, height: 14, background: "#f4d03f", borderRadius: "50%", boxShadow: "0 0 20px 10px rgba(244, 208, 63, 0.5)", border: "1px solid #c89c00" }} /></div>;
  if (type === "pc_desk") return <div style={{ width: "100%", height: "100%", background: "#8e6c4e", border: "2px solid #5c4028", borderRadius: 4, position: "relative", boxShadow: "2px 4px 6px rgba(0,0,0,0.5)" }}><div style={{ position: "absolute", inset: -2, background: "rgba(100, 200, 255, 0.2)", filter: "blur(8px)", pointerEvents: "none" }} /><div style={{ position: "absolute", bottom: "10%", left: "15%", width: "70%", height: "30%", background: "#111", borderRadius: 2, border: "1px solid #333" }} /><div style={{ position: "absolute", bottom: "45%", left: "15%", width: "70%", height: "40%", background: "#050505", border: "2px solid #222", borderRadius: 4, boxShadow: "0 0 10px rgba(50, 150, 255, 0.4)", overflow: "hidden" }}><div style={{ position: "absolute", top: 2, left: 2, width: "30%", height: 2, background: "#e06c75" }} /><div style={{ position: "absolute", top: 6, left: 2, width: "60%", height: 2, background: "#98c379" }} /><div style={{ position: "absolute", top: 10, left: 6, width: "40%", height: 2, background: "#61afef" }} /><div style={{ position: "absolute", top: 14, left: 6, width: "50%", height: 2, background: "#e5c07b" }} /><div style={{ position: "absolute", top: 18, left: 2, width: "20%", height: 2, background: "#c678dd" }} /></div><div style={{ position: "absolute", bottom: "15%", left: "25%", width: "30%", height: "15%", background: "#222", borderRadius: 1, display: "flex", flexWrap: "wrap", gap: 1, padding: 1 }}><div style={{ flex: 1, background: "#fff", opacity: 0.8 }} /><div style={{ flex: 1, background: "#fff", opacity: 0.8 }} /><div style={{ flex: 1, background: "#fff", opacity: 0.8 }} /></div><div style={{ position: "absolute", bottom: "15%", left: "60%", width: "8%", height: "15%", background: "#fff", borderRadius: "40%" }} /><div style={{ position: "absolute", bottom: "20%", right: "15%", width: 6, height: 6, background: "#f1c40f", borderRadius: "50%", border: "1px solid #d4ac0d" }}><div style={{ position: "absolute", inset: 1, background: "#3e2723", borderRadius: "50%" }} /></div></div>;
  if (type === "kitchen") return <div style={{ width: "100%", height: "100%", background: "#34495e", border: "2px solid #2c3e50", borderRadius: 2, position: "relative", display: "flex", flexDirection: "column", boxShadow: "2px 2px 5px rgba(0,0,0,0.5)" }}><div style={{ width: "100%", height: "60%", background: "#ecf0f1", borderBottom: "2px solid #bdc3c7", position: "relative" }}><div style={{ position: "absolute", top: 4, left: 4, width: 14, height: 14, background: "#95a5a6", borderRadius: 2, border: "1px solid #7f8c8d" }}><div style={{ position: "absolute", top: -2, left: "50%", width: 4, height: 6, background: "#7f8c8d", marginLeft: -2 }} /></div><div style={{ position: "absolute", top: 6, left: 24, width: 12, height: 10, background: "#d35400", borderRadius: 2 }} /><div style={{ position: "absolute", bottom: 2, right: 4, width: 16, height: 16, background: "#2c3e50", borderRadius: 2 }}><div style={{ position: "absolute", top: 2, left: 2, width: 4, height: 4, background: "#e74c3c", borderRadius: "50%" }} /><div style={{ position: "absolute", top: 2, right: 2, width: 4, height: 4, background: "#e74c3c", borderRadius: "50%" }} /><div style={{ position: "absolute", bottom: 2, left: 2, width: 4, height: 4, background: "#e74c3c", borderRadius: "50%" }} /><div style={{ position: "absolute", bottom: 2, right: 2, width: 4, height: 4, background: "#e74c3c", borderRadius: "50%" }} /></div></div><div style={{ width: "100%", flex: 1, display: "flex" }}><div style={{ flex: 1, borderRight: "1px solid #2c3e50", position: "relative" }}><div style={{ position: "absolute", top: 4, right: 2, width: 2, height: 6, background: "#bdc3c7" }} /></div><div style={{ flex: 1, position: "relative" }}><div style={{ position: "absolute", top: 4, left: 2, width: 2, height: 6, background: "#bdc3c7" }} /></div></div></div>;
  if (type === "toilet") return <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}><div style={{ width: "80%", height: "40%", background: "#ecf0f1", border: "2px solid #bdc3c7", borderRadius: "4px 4px 0 0", position: "relative" }}><div style={{ position: "absolute", top: 2, right: 2, width: 4, height: 2, background: "#95a5a6" }} /></div><div style={{ width: "70%", height: "40%", background: "#fff", border: "2px solid #bdc3c7", borderRadius: "0 0 10px 10px", position: "relative", zIndex: 2 }}><div style={{ position: "absolute", inset: 2, background: "#ecf0f1", borderRadius: "0 0 6px 6px" }} /><div style={{ position: "absolute", top: -2, left: -2, right: -2, height: 4, background: "#fff", border: "1px solid #bdc3c7", borderRadius: "4px 4px 0 0" }} /></div></div>;
  if (type === "fridge") return <div style={{ width: "100%", height: "100%", background: "#ecf0f1", border: "2px solid #bdc3c7", borderRadius: 2, position: "relative", boxShadow: "2px 2px 5px rgba(0,0,0,0.4)" }}><div style={{ position: "absolute", top: 2, bottom: "45%", left: 2, right: 2, border: "1px solid #bdc3c7", borderBottom: "2px solid #95a5a6" }}><div style={{ position: "absolute", left: 2, top: "30%", width: 2, height: "40%", background: "#bdc3c7" }} /></div><div style={{ position: "absolute", top: "55%", bottom: 2, left: 2, right: 2, border: "1px solid #bdc3c7" }}><div style={{ position: "absolute", left: 2, top: "10%", width: 2, height: "30%", background: "#bdc3c7" }} /></div></div>;
  if (type === "rug") return <div style={{ width: "100%", height: "100%", background: "#8b2525", border: "2px solid #5c1818", borderRadius: 8, position: "relative", opacity: 0.9 }}><div style={{ position: "absolute", inset: 4, border: "2px dashed #b58945", borderRadius: 4 }} /><div style={{ position: "absolute", inset: 12, border: "2px solid #b58945", borderRadius: 2, background: "#6a1b1b" }} /></div>;
  if (type === "aquarium") return <div style={{ width: "100%", height: "100%", background: "#111", border: "2px solid #2c3e50", borderRadius: 4, position: "relative", display: "flex", flexDirection: "column" }}><div style={{ flex: 1, background: "rgba(52, 152, 219, 0.4)", position: "relative", overflow: "hidden", borderBottom: "4px solid #1a252f" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)" }} /><div style={{ position: "absolute", top: "40%", left: "30%", width: 10, height: 5, animation: "swimRight 8s infinite linear alternate" }}><div style={{ position: "absolute", right: 0, top: 0, width: 7, height: 5, background: "#e67e22", borderRadius: "50%" }} /><div style={{ position: "absolute", left: 0, top: 0, width: 4, height: 5, background: "#e67e22", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} /></div><div style={{ position: "absolute", top: "60%", right: "30%", width: 10, height: 5, animation: "swimLeft 6s infinite linear alternate" }}><div style={{ position: "absolute", left: 0, top: 0, width: 7, height: 5, background: "#d35400", borderRadius: "50%" }} /><div style={{ position: "absolute", right: 0, top: 0, width: 4, height: 5, background: "#d35400", clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }} /></div><div style={{ position: "absolute", bottom: 0, left: "20%", width: 2, height: 2, background: "rgba(255,255,255,0.6)", borderRadius: "50%", animation: "dustParticle 4s infinite linear" }} /><div style={{ position: "absolute", bottom: 0, right: "40%", width: 3, height: 3, background: "rgba(255,255,255,0.6)", borderRadius: "50%", animation: "dustParticle 5s infinite linear 2s" }} /></div><div style={{ height: 6, background: "#2c3e50" }} /></div>;
  if (type === "bookshelf") return <div style={{ width: "100%", height: "100%", background: "#3a2210", border: "2px solid #201008", borderRadius: 2, position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-evenly", boxShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}><div style={{ width: "100%", height: 3, background: "#201008" }} /><div style={{ width: "100%", height: 3, background: "#201008" }} /><div style={{ position: "absolute", top: 4, left: 4, width: 6, height: 12, background: "#8b2222" }} /><div style={{ position: "absolute", top: 5, left: 14, width: 4, height: 11, background: "#225588" }} /><div style={{ position: "absolute", top: 6, left: 22, width: 5, height: 10, background: "#d4af37" }} /><div style={{ position: "absolute", bottom: 4, left: 6, width: 6, height: 12, background: "#228b22" }} /><div style={{ position: "absolute", bottom: 4, left: 16, width: 4, height: 12, background: "#4b0082" }} /></div>;
  if (type === "plant") return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}><div style={{ width: "70%", height: "60%", background: "#e67e22", borderRadius: "2px 2px 6px 6px", border: "2px solid #d35400", position: "relative" }}><div style={{ position: "absolute", bottom: "90%", left: "10%", width: "80%", height: "160%", background: "#27ae60", borderRadius: "8px 8px 0 0", border: "2px solid #2ecc71" }}><div style={{ position: "absolute", top: "20%", left: "-60%", width: "60%", height: "40%", background: "#27ae60", borderRadius: "4px 0 0 4px", border: "2px solid #2ecc71", borderRight: "none" }}><div style={{ position: "absolute", bottom: "100%", left: 0, width: "100%", height: "80%", background: "#27ae60", borderRadius: "4px 4px 0 0", border: "2px solid #2ecc71", borderBottom: "none" }} /></div><div style={{ position: "absolute", top: "40%", right: "-50%", width: "50%", height: "30%", background: "#27ae60", borderRadius: "0 4px 4px 0", border: "2px solid #2ecc71", borderLeft: "none" }}><div style={{ position: "absolute", bottom: "100%", right: 0, width: "100%", height: "60%", background: "#27ae60", borderRadius: "4px 4px 0 0", border: "2px solid #2ecc71", borderBottom: "none" }} /></div></div></div></div>;
  if (type === "resume") return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 12, height: 14, background: "#fdf6e3", border: "1px solid #dcd3b6", borderRadius: 1, position: "relative", boxShadow: "1px 1px 2px rgba(0,0,0,0.3)", transform: "rotate(-5deg)" }}><div style={{ position: "absolute", top: 2, left: 2, width: 6, height: 1, background: "#93a1a1" }}/><div style={{ position: "absolute", top: 4, left: 2, width: 8, height: 1, background: "#93a1a1" }}/><div style={{ position: "absolute", top: 6, left: 2, width: 7, height: 1, background: "#93a1a1" }}/><div style={{ position: "absolute", top: -2, right: 2, width: 4, height: 6, border: "1px solid #586e75", borderRadius: 2, transform: "rotate(15deg)", background: "transparent" }}/></div></div>;
  return null;
};

// ============================================================
//  DESK TELEPHONE (Tip Line) & CONTACT FORM
// ============================================================
function TipLinePhone({ isNear, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;
  return (
    <div
      onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: 5 * TILE, top: 1 * TILE - 8,
        width: TILE, height: TILE,
        display: "flex", alignItems: "flex-end", justifyContent: "center", cursor: "pointer",
        filter: active ? "brightness(1.2) drop-shadow(0 0 8px rgba(0,180,255,0.6))" : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
        transition: "filter 0.15s", zIndex: 11,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 16 16" style={{ imageRendering: "pixelated", overflow: "visible" }}>
        {/* Phone base */}
        <rect x="4" y="4" width="8" height="4" rx="1" fill="#c03030" />
        <rect x="5" y="4" width="6" height="3" fill="#a02020" />
        {/* Rotary dial / buttons */}
        <circle cx="8" cy="6" r="1.5" fill="#eef7f2" />
        {/* Handset */}
        <rect x="3" y="1" width="10" height="2" rx="1" fill="#c03030" />
        <rect x="2" y="1" width="3" height="3" rx="1" fill="#a02020" />
        <rect x="11" y="1" width="3" height="3" rx="1" fill="#a02020" />
      </svg>
    </div>
  );
}

function TipLineForm({ onClose }) {
  const [state, handleSubmit] = useForm('mljrjbde');
  const formRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA";
      
      if (e.key === "Escape" || (!isTyping && e.key.toLowerCase() === "b")) {
        onClose();
      } else if (!isTyping && (e.key === " " || e.key.toLowerCase() === "a")) {
        e.preventDefault();
        if (formRef.current && typeof formRef.current.requestSubmit === "function") {
          formRef.current.requestSubmit();
        } else if (formRef.current) {
          formRef.current.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (state.succeeded) {
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        <h3 style={{ fontSize: 20, color: "#228b22", marginBottom: 16 }}>SENT!</h3>
        <p style={{ fontSize: 12, color: "#333", marginBottom: 16 }}>Message received loud and clear.</p>
        <button onClick={onClose} style={{ fontFamily: "'Micro 5', monospace", fontSize: 12, background: "#000", color: "#fff", padding: "6px 10px", border: "none", cursor: "pointer" }}>CLOSE</button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", fontFamily: "'Micro 5', monospace" }}>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 2, color: "#111" }}>NAME</label>
        <input name="name" required style={{ width: "100%", padding: 4, boxSizing: "border-box", border: "1px solid #111", background: "#fff", fontFamily: "'Micro 5', monospace", fontSize: 12, color: "#111" }} />
        <ValidationError field="name" prefix="Name" errors={state.errors} style={{ fontSize: 10, color: "#c03030", marginTop: 2, display: "block" }} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 2, color: "#111" }}>CONTACT</label>
        <input name="email" required style={{ width: "100%", padding: 4, boxSizing: "border-box", border: "1px solid #111", background: "#fff", fontFamily: "'Micro 5', monospace", fontSize: 12, color: "#111" }} />
        <ValidationError field="email" prefix="Email" errors={state.errors} style={{ fontSize: 10, color: "#c03030", marginTop: 2, display: "block" }} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: "bold", marginBottom: 2, color: "#111" }}>MESSAGE</label>
        <textarea name="message" required rows={3} style={{ width: "100%", padding: 4, boxSizing: "border-box", border: "1px solid #111", background: "#fff", fontFamily: "'Micro 5', monospace", fontSize: 12, resize: "none", color: "#111" }} />
        <ValidationError field="message" prefix="Message" errors={state.errors} style={{ fontSize: 10, color: "#c03030", marginTop: 2, display: "block" }} />
      </div>
      <button type="submit" disabled={state.submitting} style={{ fontFamily: "'Micro 5', monospace", fontSize: 12, background: "#000", color: "#fff", padding: "8px", border: "none", cursor: "pointer", marginTop: 4, boxShadow: "2px 2px 0 rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {state.submitting ? "SENDING..." : "SUBMIT"}
      </button>
      {state.errors && state.errors.length > 0 && <div style={{ fontSize: 10, color: "#c03030", textAlign: "center" }}>Failed to send. Try again.</div>}
    </form>
  );
}

const StaticWorld = memo(() => (
  <>
    {MAP.map((row, r) => row.map((tile, c) => {
       const key = `${r}_${c}`;
       if (tile === 1) return <div key={key} style={{ position: "absolute", left: c*TILE, top: r*TILE, width: TILE, height: TILE, background: "#5a3a2a", border: "1px solid #3a1c11", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 6px)", zIndex: r * 10 }} />;
       if (tile === 2) return (
          <div key={key}>
            <div style={{ position: "absolute", left: c*TILE, top: r*TILE, width: TILE, height: TILE, background: (r + c) % 2 === 0 ? "#8c6b45" : "#805c38", border: "1px solid rgba(0,0,0,0.1)", zIndex: 0 }} />
            <ExitDoor col={c} row={r} />
          </div>
       );
       return <div key={key} style={{ position: "absolute", left: c*TILE, top: r*TILE, width: TILE, height: TILE, background: (r + c) % 2 === 0 ? "#8c6b45" : "#805c38", border: "1px solid rgba(0,0,0,0.1)", zIndex: 0 }} />;
    }))}
    {/* Window */}
    <div style={{ position: "absolute", top: 4, left: TILE * 6 + 12, width: TILE * 3, height: TILE - 8, background: "linear-gradient(to bottom, #ff7b54, #ffd56b)", border: "2px solid #3a1c11", zIndex: 15, boxShadow: "inset 0 0 12px rgba(255,255,255,0.7), 0 0 40px rgba(255,160,80,0.6)" }}>
      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#3a1c11", transform: "translateX(-50%)" }} />
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#3a1c11", transform: "translateY(-50%)" }} />
    </div>

    {/* Sunbeam */}
    <div style={{
      position: "absolute", top: TILE - 2, left: TILE * 6 - 10, width: TILE * 3 + 48, height: TILE * 6,
      background: "linear-gradient(to bottom, rgba(255,220,150,0.4), transparent)",
      clipPath: "polygon(24px 0, calc(100% - 24px) 0, 100% 100%, 0 100%)",
      mixBlendMode: "overlay", pointerEvents: "none", zIndex: 300
    }}>
      <div style={{ position: "absolute", left: "30%", top: "40%", width: 2, height: 2, background: "#fff", animation: "dustParticle 4s infinite linear", opacity: 0 }} />
      <div style={{ position: "absolute", left: "60%", top: "60%", width: 2, height: 2, background: "#fff", animation: "dustParticle 5s infinite linear 1.5s", opacity: 0 }} />
      <div style={{ position: "absolute", left: "40%", top: "20%", width: 2, height: 2, background: "#fff", animation: "dustParticle 3.5s infinite linear 0.7s", opacity: 0 }} />
      <div style={{ position: "absolute", left: "70%", top: "30%", width: 2, height: 2, background: "#fff", animation: "dustParticle 6s infinite linear 2.5s", opacity: 0 }} />
    </div>
  </>
));

export default function NomadshomeScene() {
  const {
    isLandscape,
    changeScene,
    isTransitioning,
    speedMultiplier,
    musicPlaying,
    musicMuted,
    musicVolume,
  } = useGame();

  const [scale, setScale] = useState(1);
  const [internalW, setInternalW] = useState(256);
  const [internalH, setInternalH] = useState(192);
  
  const [phase, setPhase] = useState(() => {
    if (sessionStorage.getItem("hasVisitedHome")) return "free";
    sessionStorage.setItem("hasVisitedHome", "true");
    return "intro";
  });
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [dynamicDialogue, setDynamicDialogue] = useState(null);
  const [openResume, setOpenResume] = useState(false);
  const [openTipLine, setOpenTipLine] = useState(false);
  const [nearPhone, setNearPhone] = useState(false);
  
  const containerRef = useRef(null);
  const resumeScrollRef = useRef(null);

  useEffect(() => {
    const handleIntroDismiss = (e) => {
      const isTap = !e.key;
      if (phase === "intro" && (isTap || e.key === " " || e.key === "Enter" || e.key?.toLowerCase() === "a")) {
        e.preventDefault();
        setPhase("free");
      } else if (phase === "talking" && (isTap || e.key === " " || e.key === "Enter" || e.key?.toLowerCase() === "a")) {
        e.preventDefault();
        const activeLines = dynamicDialogue || INTRO_DIALOGUE;
        if (dialogueIndex < activeLines.length - 1) {
          setDialogueIndex(prev => prev + 1);
        } else {
          setPhase("free");
        }
      }
    };
    window.addEventListener("keydown", handleIntroDismiss);
    window.addEventListener("click", handleIntroDismiss);
    window.addEventListener("touchstart", handleIntroDismiss, { passive: false });
    window.addEventListener("pointerdown", handleIntroDismiss);
    return () => {
      window.removeEventListener("keydown", handleIntroDismiss);
      window.removeEventListener("click", handleIntroDismiss);
      window.removeEventListener("touchstart", handleIntroDismiss);
      window.removeEventListener("pointerdown", handleIntroDismiss);
    };
  }, [phase, dialogueIndex, dynamicDialogue]);

  useEffect(() => {
    if (!openResume) return;
    const handleScroll = (e) => {
      if (!resumeScrollRef.current) return;
      const key = e.key.toLowerCase();
      const scrollAmt = 40;
      if (key === 'arrowdown' || key === 's') {
        resumeScrollRef.current.scrollTop += scrollAmt;
        e.preventDefault();
      } else if (key === 'arrowup' || key === 'w') {
        resumeScrollRef.current.scrollTop -= scrollAmt;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleScroll, { capture: true });
    return () => window.removeEventListener("keydown", handleScroll, { capture: true });
  }, [openResume]);

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

  useEffect(() => {
    if (containerRef.current) containerRef.current.focus();
  }, [phase]);

  const musicRef = useRef({ audioCtx: null, interval: null });

  // ---- Synth engine: Chill Lofi Electric Piano ----
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = getSharedAudioCtx();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const t = ctx.currentTime;
      const si = idx % 16;
      
      // Warm chords (Fmaj7 -> Em7 -> Dm7 -> Cmaj7)
      const chordProg = [
        [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
        [164.81, 196.00, 246.94, 293.66], // Em7 (E3, G3, B3, D4)
        [146.83, 174.61, 220.00, 261.63], // Dm7 (D3, F3, A3, C4)
        [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
      ];
      
      const measure = Math.floor(idx / 16) % 4;
      const chord = chordProg[measure];

      // Play chord on beat 1 and slightly syncopated beat 11
      if (si === 0 || si === 10) {
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          osc.type = "sine"; // smooth e-piano
          osc.frequency.setValueAtTime(freq, t);
          
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(800, t);
          filter.frequency.exponentialRampToValueAtTime(300, t + 1.5);
          
          const v = vol * (si === 0 ? 0.4 : 0.25);
          gain.gain.setValueAtTime(v, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
          
          osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
          osc.start(t); osc.stop(t + 1.6);
        });
      }

      // Gentle lofi vinyl crackle/noise
      if (si % 8 === 0) {
        const bufSize = ctx.sampleRate * 0.1;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = "lowpass";
        nFilter.frequency.value = 400; // very muffled crackle

        const nG = ctx.createGain();
        nG.gain.setValueAtTime(vol * 0.05, t);
        nG.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        noise.connect(nFilter); nFilter.connect(nG); nG.connect(ctx.destination);
        noise.start(t); noise.stop(t + 0.1);
      }

    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(200 / speedMultiplier);
    musicRef.current.interval = setInterval(() => {
      playStep(step++, musicVolume, musicMuted);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);

  const isWalkable = useCallback((targetC, targetR) => {
    if (targetR < 0 || targetR >= MAP_ROWS || targetC < 0 || targetC >= MAP_COLS) return false;
    const tile = MAP[targetR][targetC];
    if (tile === 1) return false;
    if (FURNITURE.some(f => f.collision && targetC >= f.col && targetC < f.col + f.w && targetR >= f.row && targetR < f.row + f.h)) return false;
    return true;
  }, []);

  const { pos, facing, stepping, setPath, tapTarget } = usePlayerMovement({
    sceneId: "nomadshome_studio",
    initialPos: START_POS,
    isActive: phase === "free" && !isTransitioning && !openResume && !openTipLine,
    speedMultiplier,
    canWalk: isWalkable,
    onMove: (nc, nr) => {
      playWoodStep();
      setNearPhone(nc >= 4 && nc <= 6 && nr >= 0 && nr <= 2);
      if (MAP[nr]?.[nc] === 2) changeScene('village');
      return false;
    },
    onAction: () => {
      let checkR = pos.row; let checkC = pos.col;
      if (facing === "up") checkR--; else if (facing === "down") checkR++; else if (facing === "left") checkC--; else if (facing === "right") checkC++;
      
      if (nearPhone) {
        playBlip();
        setOpenTipLine(true);
        return;
      }
      
      if (checkC === NPC_POS.col && checkR === NPC_POS.row) {
        playBlip();
        setDynamicDialogue(null);
        setPhase("talking");
        setDialogueIndex(0);
        return;
      }

      const item = FURNITURE.find(f => checkC >= f.col && checkC < f.col + f.w && checkR >= f.row && checkR < f.row + f.h);
      
      if (item) {
        playBlip();
        if (item.type === "resume") { setOpenResume(true); return; }
        if (item.type === "pc_desk") setDynamicDialogue(["My battlestation.", "I spend way too much time staring at these glowing rectangles."]);
        else if (item.type === "bed") setDynamicDialogue(["A surprisingly comfortable bed.", "But there's no time to sleep right now!"]);
        else if (item.type === "kitchen") setDynamicDialogue(["A neat little kitchenette.", "The stove gets surprisingly hot."]);
        else if (item.type === "toilet") setDynamicDialogue(["The porcelain throne.", "This is where I do my most intense debugging."]);
        else if (item.type === "fridge") setDynamicDialogue(["Nothing but energy drinks, leftover pizza, and a single sad lemon."]);
        else if (item.type === "aquarium") setDynamicDialogue(["That's Crouton and Quake.", "They are very good boys."]);
        else if (item.type === "bookshelf") setDynamicDialogue(["A bunch of sci-fi novels and old programming textbooks...", "...that I've honestly never read."]);
        else if (item.type === "nightstand") setDynamicDialogue(["My highly secure filing cabinet, code-named 'The Dust-Bin'.", "If a burglar breaks in, they'll just think I'm incredibly messy.", "Joke's on them, that's where my Social Security card is."]);
        else if (item.type === "plant") setDynamicDialogue(["I'm doing my best to keep this thing alive."]);
        else setDynamicDialogue([`You inspect the ${item.label || "object"}.`, "It looks nice."]);
        setPhase("talking");
        setDialogueIndex(0);
        return;
      }
    }
  });
  const worldRef = useRef(null);
  const handleWorldTap = useTapToMove(worldRef, pos, isWalkable, setPath, MAP_COLS, MAP_ROWS, phase === "free" && !isTransitioning);


  const cam = useCameraLerp(pos, TILE, internalW, internalH, MAP_COLS, MAP_ROWS, speedMultiplier); 

  return (
    <div ref={containerRef} tabIndex={0} style={{ position: "fixed", inset: 0, display: "flex", flexDirection: isLandscape ? "row" : "column", background: "#05050a", overflow: "hidden", margin: 0, padding: 0, fontFamily: "'Micro 5', monospace", color: "#f4e8d0", userSelect: "none", boxSizing: "border-box", height: "100dvh", width: "100dvw", outline: "none" }}>
      <title>Home | Saad Ibra</title>
      <meta name="description" content="Welcome to my cozy home base. View my resume, learn more about me, and interact with my pixel art apartment." />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <style>{`@keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} } @keyframes dustParticle { 0% { transform: translateY(0) scale(1); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(-20px) scale(0.5); opacity: 0; } } @keyframes swimRight { 0% { transform: translateX(-5px) scaleX(1); } 100% { transform: translateX(15px) scaleX(1); } } @keyframes swimLeft { 0% { transform: translateX(5px) scaleX(-1); } 100% { transform: translateX(-15px) scaleX(-1); } }`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${scale})`, transformOrigin: "center", imageRendering: "pixelated" }}>
          <div style={{ position: "relative", width: internalW, height: internalH, overflow: "hidden", background: "#000", boxShadow: "0 0 0 4px #2a1c11, 0 0 30px rgba(0,0,0,1)", imageRendering: "pixelated", borderRadius: 4 }}>
            {/* CAMERA CONTAINER */}
            <div ref={worldRef} onPointerDown={handleWorldTap} style={{ position: "absolute", width: MAP_COLS * TILE, height: MAP_ROWS * TILE, left: -cam.x, top: -cam.y, zIndex: 1 }}>
            <TapMarker tapTarget={tapTarget} TILE={TILE} />

              <StaticWorld />
              {FURNITURE.map((item, idx) => {
                let isNear = false;
                if (item.type !== "rug") {
                   isNear = pos.col >= item.col - 1 && pos.col <= item.col + item.w && 
                            pos.row >= item.row - 1 && pos.row <= item.row + item.h;
                }
                return (
                  <div key={`furn-${idx}`} style={{ position: "absolute", left: item.col * TILE, top: item.row * TILE, width: item.w * TILE, height: item.h * TILE, zIndex: item.collision ? ((item.row + item.h - 1) * 10 + 1) : 1, pointerEvents: "none", filter: isNear && phase === "free" ? "drop-shadow(0 0 6px rgba(244,232,208,0.8))" : "none", transition: "filter 0.2s" }}><FurnitureSprite item={item} /></div>
                );
              })}

              <TipLinePhone isNear={nearPhone} onClick={() => { if (phase === "free") setOpenTipLine(true); }} />
              
              <div style={{
                position: "absolute",
                left: NPC_POS.col * TILE,
                top: NPC_POS.row * TILE,
                width: TILE, height: TILE,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: NPC_POS.row * 10,
                filter: Math.abs(NPC_POS.col - pos.col) <= 1 && Math.abs(NPC_POS.row - pos.row) <= 1 && phase === "free" ? "drop-shadow(0 0 6px rgba(244,232,208,0.6))" : "none",
                transition: "filter 0.2s",
              }}>
                <SaadSprite direction="down" />
              </div>

              <div style={{ position: "absolute", left: pos.col * TILE, top: pos.row * TILE, transition: "left 0.14s linear, top 0.14s linear", width: TILE, height: TILE, display: "flex", alignItems: "center", justifyContent: "center", zIndex: pos.row * 10 + 5 }}><PlayerSprite direction={facing} stepping={stepping} costume="casual" /></div>
            </div>
            {/* Dawn Overlays */}
            <div style={{ position: "absolute", inset: 0, background: "#ff8a50", mixBlendMode: "multiply", opacity: 0.4, pointerEvents: "none", zIndex: 899 }} />
            <div style={{ position: "absolute", inset: 0, background: "#603080", mixBlendMode: "overlay", opacity: 0.3, pointerEvents: "none", zIndex: 900 }} />
          </div>
          <button onClick={() => changeScene('village')} style={{ position: "absolute", top: 8, right: 8, fontFamily: "'Micro 5', monospace", fontSize: 12, background: "#222", color: "#fff", border: "2px solid #fff", padding: "4px 8px", cursor: "pointer", pointerEvents: "auto", zIndex: 500 }}><div style={{ display: "flex", alignItems: "center", gap: 4 }}><ArrowLeft size={6} /> VILLAGE</div></button>
          {(phase === "intro" || phase === "talking") && (
            <DialogueBox lines={dynamicDialogue || INTRO_DIALOGUE} lineIndex={dialogueIndex} onAdvance={() => { playBlip(); setDialogueIndex(i => i + 1); }} onDismiss={() => { setPhase("free"); setDynamicDialogue(null); }} speaker={dynamicDialogue ? null : "SAAD IBRA"} theme="home" lastButtonLabel="GOT IT" />
          )}

          {openResume && (
            <div
              onClick={() => setOpenResume(false)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600,
              }}
            >
              <div
                ref={resumeScrollRef}
                onClick={e => e.stopPropagation()}
                className="resume-scroll"
                style={{
                  background: "#fcfaf5", border: "2px solid #111",
                  width: 480, maxWidth: "95%", maxHeight: internalH - 20,
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.8)",
                  overflow: "auto", display: "flex", flexDirection: "column",
                  fontFamily: "'Micro 5', monospace", padding: "20px",
                  color: "#111", fontSize: "16px", lineHeight: "1.6",
                  textAlign: "left"
                }}
              >
                {/* Header (Left Aligned) */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #111", paddingBottom: "8px", marginBottom: "12px", position: "sticky", top: "-20px", background: "#fcfaf5", zIndex: 5 }}>
                  <div>
                    <div style={{ fontSize: "32px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>Saad Ibra</div>
                    <div style={{ fontSize: "16px", marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <a href="https://linkedin.com/in/saadibrahimkhan" target="_blank" rel="noopener noreferrer" style={{background: "#fff", color: "#111", padding: "3px 5px", textDecoration: "none", border: "1px solid #111", boxShadow: "1px 1px 0 rgba(0,0,0,0.2)", letterSpacing: "0.5px"}}>LINKEDIN</a>
                      <a href="https://github.com/saad-ibra" target="_blank" rel="noopener noreferrer" style={{background: "#fff", color: "#111", padding: "3px 5px", textDecoration: "none", border: "1px solid #111", boxShadow: "1px 1px 0 rgba(0,0,0,0.2)", letterSpacing: "0.5px"}}>GITHUB</a>
                      <button onClick={() => { setOpenResume(false); setOpenTipLine(true); }} style={{background: "#fff", color: "#111", padding: "3px 5px", textDecoration: "none", border: "1px solid #111", boxShadow: "1px 1px 0 rgba(0,0,0,0.2)", letterSpacing: "0.5px", fontFamily: "'Micro 5', monospace", fontSize: "16px", cursor: "pointer"}}>REACH OUT</button>
                    </div>
                  </div>
                  <button onClick={() => setOpenResume(false)} style={{ fontFamily: "'Micro 5', monospace", fontSize: 10, background: "#111", color: "#fff", border: "none", padding: "6px 8px", cursor: "pointer", flexShrink: 0, boxShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>CLOSE</button>
                </div>

                {/* Summary */}
                <div style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Professional Summary</div>
                <div style={{ marginBottom: "12px", textAlign: "left" }}>
                  Cloud and Automation Engineer with experience in Azure integrations, workflow orchestration, and applied AI solutions. Proficient in Azure Functions, Logic Apps, Service Bus, Power Automate, and Dynamics 365 F&O. Delivered enterprise pipelines combining AI-driven validation, anomaly detection, and Teams-based approvals. Full-stack background in Kotlin, Spring Boot, and React.js. Published patent holder and award recipient for Best Project of Social Relevance in DSCE.
                </div>

                {/* Experience */}
                <div style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #ddd", paddingTop: "8px", marginBottom: "6px" }}>Experience</div>
                
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <strong style={{ fontSize: "32px" }}>sa.global</strong>
                    <span style={{ color: "#555" }}>Bengaluru, India</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ color: "#333", fontStyle: "italic" }}>Azure AI Intern</span>
                    <span style={{ color: "#555" }}>Apr 2025 – Oct 2025</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#333", fontStyle: "italic" }}>Software Engineer Trainee – Azure & Applied AI</span>
                    <span style={{ color: "#555" }}>Nov 2025 – May 2026</span>
                  </div>

                  <div style={{ fontWeight: "bold", marginBottom: "2px" }}>D365 F&O Integration with Construction Suite</div>
                  <ul style={{ margin: "0 0 8px 14px", padding: 0 }}>
                    <li style={{ paddingBottom: "3px" }}>Built production bi-directional integration between a construction platform and Dynamics 365 Finance & Operations using <strong>Azure Logic Apps and D365</strong>, handling synchronization of vendor master data, procurement workflows, purchase orders, and project cost structures.</li>
                    <li style={{ paddingBottom: "3px" }}>Implemented schema validation, error handling, and retry logic via <strong>Azure Logic Apps</strong> to ensure data consistency and fault tolerance across both systems.</li>
                  </ul>

                  <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Automated Order Orchestration & Risk Management</div>
                  <ul style={{ margin: "0 0 8px 14px", padding: 0 }}>
                    <li style={{ paddingBottom: "3px" }}>Architected enterprise pipeline for multi-channel order intake (Blob, Outlook, Teams), PDF extraction via <strong>Form Recognizer</strong>, <strong>Azure OpenAI GPT</strong> risk scoring, SLA timers in Azure Tables, and automated <strong>Power Automate</strong> escalation.</li>
                  </ul>

                  <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Marketing Content Automation Pipeline</div>
                  <ul style={{ margin: "0 0 4px 14px", padding: 0 }}>
                    <li style={{ paddingBottom: "3px" }}>Web scraping to SharePoint publishing pipeline using <strong>Azure Functions, Power Automate, and Blob Storage</strong> with AI content/image generation, approval workflows, retry logic, and state tracking.</li>
                  </ul>
                </div>

                {/* Projects */}
                <div style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #ddd", paddingTop: "8px", marginBottom: "6px" }}>Projects</div>
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "2px" }}>Gray Matter - Knowledge Organization App</div>
                  <ul style={{ margin: "0 0 4px 14px", padding: 0 }}>
                    <li style={{ paddingBottom: "3px" }}>Note-taking and PDF reading, annotation and research Android application using <strong>Kotlin, Jetpack Compose, SQLDelight</strong>, custom PDF rendering, and 3D knowledge graph visualization.</li>
                  </ul>
                </div>

                {/* Skills */}
                <div style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #ddd", paddingTop: "8px", marginBottom: "6px" }}>Skills</div>
                <div style={{ marginBottom: "12px", display: "grid", gap: "4px" }}>
                  <div><strong style={{ minWidth: "90px", display: "inline-block" }}>Cloud & Automation:</strong> Azure Functions, Logic Apps, Service Bus, Blob Storage, Azure OpenAI, Form Recognizer, Power Automate, SharePoint, Dynamics 365 F&O, Microsoft Copilot Studio</div>
                  <div><strong style={{ minWidth: "90px", display: "inline-block" }}>Languages:</strong> Python, C#, Java, JavaScript, SQL, Kotlin, C++, HTML/CSS</div>
                </div>

                {/* Education */}
                <div style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #ddd", paddingTop: "8px", marginBottom: "6px" }}>Education</div>
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1px" }}>
                    <strong>Dayananda Sagar College of Engineering</strong>
                    <span style={{ color: "#555" }}>Bengaluru</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#333", fontStyle: "italic" }}>B.E. Computer Science and Design</span>
                    <span style={{ color: "#555" }}>2021 – 2025 | CGPA: 8.43/10</span>
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1px" }}>
                    <strong>Christ Junior College</strong>
                    <span style={{ color: "#555" }}>Bengaluru</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#333", fontStyle: "italic" }}>Pre-University (Science)</span>
                    <span style={{ color: "#555" }}>2019 – 2021 | 84.5%</span>
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1px" }}>
                    <strong>St. Mary's Public School</strong>
                    <span style={{ color: "#555" }}>Bengaluru</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#333", fontStyle: "italic" }}>ICSE</span>
                    <span style={{ color: "#555" }}>2019 | 88.5%</span>
                  </div>
                </div>

                {/* Awards & Patent */}
                <div style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #ddd", paddingTop: "8px", marginBottom: "6px" }}>Awards & Patent</div>
                <ul style={{ margin: "0 0 12px 14px", padding: 0 }}>
                  <li style={{ paddingBottom: "3px" }}><strong>Patent:</strong> Sustainable Energy Monitoring System (SEMS), App. No. 202241069889 (Dec 2022) – IoT-based real-time energy monitoring via Raspberry Pi.</li>
                  <li style={{ paddingBottom: "3px" }}><strong>Best Project of Social Relevance</strong>, DSCE 2024 – ML-based mental health diagnostics using Random Forest and cosine similarity.</li>
                </ul>

                {/* Certifications */}
                <div style={{ fontSize: "24px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", borderTop: "1px solid #ddd", paddingTop: "8px", marginBottom: "6px" }}>Certifications</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <div>
                    <strong style={{ display: "block", marginBottom: "1px" }}>Power Platform & Data</strong>
                    <span style={{ color: "#333" }}>Power Automate Workshop (<em>Pragmatic Works</em>)</span>
                  </div>
                  <div>
                    <strong style={{ display: "block", marginBottom: "1px" }}>Analytics</strong>
                    <span style={{ color: "#333" }}>Big Data Analytics Workshop (<em>DSCE</em>)</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong style={{ display: "block", marginBottom: "1px" }}>Software Engineering</strong>
                    <span style={{ color: "#333" }}>Object-Oriented Analysis, Design, and Programming with UML | Java Essentials (<em>Infosys Springboard</em>)</span>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong style={{ display: "block", marginBottom: "1px" }}>Professional Skills</strong>
                    <span style={{ color: "#333" }}>Communication Skills | Dynamic Skills Program | Leadership EQ (<em>CIL-DSCE</em>)</span>
                  </div>
                </div>
              </div>
              <style>{`.resume-scroll::-webkit-scrollbar { width:8px; background: transparent; } .resume-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }`}</style>
            </div>
          )}

          {openTipLine && (
            <div
              onClick={() => setOpenTipLine(false)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute", top: 16, bottom: 16, left: 16, right: 16,
                  background: "#f4e8d0", border: "2px solid #111", borderTopWidth: "8px",
                  overflowY: "auto",
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.5)",
                  display: "flex", flexDirection: "column", padding: "16px",
                  textAlign: "center"
                }}
              >
                {/* Spiral notebook rings */}
                <div style={{ position: "absolute", top: -12, left: 16, width: 6, height: 12, background: "silver", borderRadius: 3, border: "1px solid #111" }} />
                <div style={{ position: "absolute", top: -12, left: 36, width: 6, height: 12, background: "silver", borderRadius: 3, border: "1px solid #111" }} />
                <div style={{ position: "absolute", top: -12, left: 56, width: 6, height: 12, background: "silver", borderRadius: 3, border: "1px solid #111" }} />
                
                <button onClick={() => setOpenTipLine(false)} style={{
                  position: "absolute", top: 4, right: 4,
                  fontFamily: "'Micro 5', monospace", fontSize: 20,
                  background: "transparent", color: "#111", border: "none",
                  padding: "4px", cursor: "pointer", zIndex: 10
                }}>✕</button>

                <h2 style={{ fontFamily: "'Micro 5', monospace", fontSize: 16, color: "#111", marginBottom: 8, marginTop: 12, letterSpacing: "-0.5px", borderBottom: "2px solid #000", paddingBottom: 8 }}>LEAVE A TIP</h2>
                <div style={{ fontSize: 12, color: "#333", marginBottom: 12, fontFamily: "'Micro 5', monospace" }}>I'll get back to you ASAP!</div>
                
                <TipLineForm onClose={() => setOpenTipLine(false)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <ControlBar />
    </div>
  );
}
