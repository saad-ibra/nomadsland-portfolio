"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { DoorOpen } from "lucide-react";
import { TILE, MOVE_COOLDOWN } from "../engine/constants";
import { usePlayerMovement } from "../hooks/usePlayerMovement";
import { playWaterSlosh, playGrassStep, playDirtStep, playWoodStep } from "../engine/sfx";
import PlayerSprite from "../components/sprites/PlayerSprite";
import ControlBar from "../components/ui/ControlBar";
import {
  MAP, MAP_COLS, MAP_ROWS, SHOPS, SHOP_TILES, START_POS,
  PALETTE,
} from "../data/village";

// ============================================================
//  WALKABILITY
// ============================================================
// Walkability is now handled inside VillageScene to access state.

// Deterministic hash for tile variations
function hash(r, c) {
  return (r * 7 + c * 13);
}

// ============================================================
//  BUILDING SHELL — shared wrapper that handles positioning,
//  hover state, and door-glow. Each building plugs into this.
// ============================================================
function BuildingShell({ shop, isNear, children }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;
  const left = (shop.col - 2) * TILE;
  const top  = (shop.row - 2) * TILE;
  const width  = TILE * 5;
  const height = TILE * 3;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left, top, width, height,
        pointerEvents: "none", zIndex: shop.row * 10 + 5,
      }}
    >
      {children({ active, width, height })}

      {/* Hover/Proximity Glow */}
      {active && (
        <div style={{
          position: "absolute", left: "50%", bottom: -4, transform: "translateX(-50%)",
          width: TILE, height: TILE, border: "2px solid #fff", borderRadius: 4,
          boxShadow: "0 0 12px #fff", zIndex: -1,
        }} />
      )}
    </div>
  );
}

// ============================================================
//  ── LIBRARY ──
//  Steep gabled roof, dark slate, arched windows, ivy, lantern
// ============================================================
function LibraryBuilding({ shop, isNear }) {
  return (
    <BuildingShell shop={shop} isNear={isNear}>
      {({ active, width, height }) => (<>
        {/* ── WALL: warm brick with mortar lines ── */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: "100%", height: TILE,
          background: "#8B4A3C", border: "2px solid #302820", borderRadius: 2,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(200,180,160,0.4) 5px, rgba(200,180,160,0.4) 6px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(200,180,160,0.3) 10px, rgba(200,180,160,0.3) 11px)",
        }}>
          {/* Arched windows with bookshelf silhouette */}
          {[TILE * 0.5, width - TILE * 1.3].map((x, i) => (
            <div key={i} style={{
              position: "absolute", left: x, top: 3, width: TILE * 0.8, height: TILE * 0.7,
              background: "#2a1a10", border: "2px solid #504030",
              borderRadius: "50% 50% 2px 2px",
              boxShadow: "inset 0 0 3px rgba(255,200,100,0.3)",
            }}>
              {/* Bookshelf silhouette */}
              <div style={{ position: "absolute", bottom: 2, left: 2, right: 2, height: 3, background: "#5a3a20" }} />
              <div style={{ position: "absolute", bottom: 7, left: 2, right: 2, height: 3, background: "#4a2a18" }} />
              <div style={{ position: "absolute", bottom: 12, left: 3, right: 3, height: 2, background: "#5a3a20" }} />
            </div>
          ))}
        </div>

        {/* ── ROOF: steep gable with dark slate ── */}
        <svg width={width + 16} height={TILE * 2 + 12} style={{ position: "absolute", left: -8, top: -12 }}>
          {/* Main gable shape */}
          <polygon
            points={`0,${TILE * 2 + 10} ${(width + 16) / 2},2 ${width + 16},${TILE * 2 + 10}`}
            fill="#3a3a48" stroke="#1a1a24" strokeWidth="2"
          />
          {/* Slate tile pattern */}
          <polygon
            points={`6,${TILE * 2 + 6} ${(width + 16) / 2},8 ${width + 10},${TILE * 2 + 6}`}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />
          {/* Horizontal slate lines */}
          {[20, 32, 44, 56].map(y => (
            <line key={y} x1="8" y1={y} x2={width + 8} y2={y} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          ))}
          {/* Rose window at gable peak */}
          <circle cx={(width + 16) / 2} cy={22} r={7} fill="#6a3050" stroke="#1a1a24" strokeWidth="2" />
          <circle cx={(width + 16) / 2} cy={22} r={4} fill="#a84878" />
          <circle cx={(width + 16) / 2} cy={22} r={2} fill="#d870a0" />
        </svg>

        {/* ── IVY creeping up left corner ── */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: 8, height: TILE * 0.8 }}>
          {[0, 5, 10, 16, 22].map(y => (
            <div key={y} style={{
              position: "absolute", bottom: y, left: y % 2 === 0 ? 0 : 3,
              width: 5, height: 4, background: "#3a7a30", borderRadius: "50%",
            }} />
          ))}
        </div>

        {/* ── LANTERN beside door ── */}
        <div style={{ position: "absolute", left: "50%", bottom: TILE - 6, marginLeft: TILE * 0.5 }}>
          {/* Bracket */}
          <div style={{ width: 6, height: 2, background: "#2a2a2a" }} />
          {/* Lantern body */}
          <div style={{
            width: 5, height: 7, background: "#1a1a1a", border: "1px solid #3a3a3a",
            borderRadius: 1, marginLeft: 1,
          }}>
            <div style={{ width: 3, height: 3, background: "#f0c040", borderRadius: "50%", margin: "2px auto 0" }} />
          </div>
        </div>

        {/* ── DOOR: aged brass ── */}
        <div style={{
          position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: TILE - 8, height: TILE - 4, background: "#C9A24B",
          border: "2px solid #302820", borderBottom: "none", borderRadius: "6px 6px 0 0",
          boxShadow: active ? "inset 0 0 8px rgba(255,255,255,0.6)" : "inset 0 0 4px rgba(0,0,0,0.3)",
          pointerEvents: "auto", cursor: "pointer",
        }}>
          {/* Book-shaped knocker */}
          <div style={{
            position: "absolute", left: "50%", top: 6, transform: "translateX(-50%)",
            width: 6, height: 8, background: "#7a5a20", border: "1px solid #3a2a10", borderRadius: 1,
          }} />
          {/* Door knob */}
          <div style={{ position: "absolute", right: 3, top: "55%", width: 3, height: 3, background: "#8a6a20", borderRadius: "50%" }} />
        </div>


      </>)}
    </BuildingShell>
  );
}

// ============================================================
//  ── LAB ──
//  Flat-topped corrugated metal, portholes, reinforced hatch
// ============================================================
function LabBuilding({ shop, isNear }) {
  return (
    <BuildingShell shop={shop} isNear={isNear}>
      {({ active, width }) => (<>
        {/* ── WALL: riveted gunmetal panels ── */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: "100%", height: TILE,
          background: "#4A5560", border: "2px solid #1a1f24", borderRadius: 1,
          backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(0,0,0,0.15) 18px, rgba(0,0,0,0.15) 20px)",
        }}>
          {/* Rivets along top edge */}
          {[8, 24, 40, 56, 72, 88, 104, 120, 136, 152].map(x => (
            <div key={x} style={{
              position: "absolute", left: x, top: 2, width: 3, height: 3,
              background: "#6a7580", borderRadius: "50%",
              boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.4)",
            }} />
          ))}
          {/* Circular portholes with green bubbling liquid */}
          {[TILE * 0.7, width - TILE * 1.1].map((x, i) => (
            <div key={i} style={{
              position: "absolute", left: x, top: 5, width: TILE * 0.65, height: TILE * 0.65,
              background: "#0a2a10", border: "3px solid #2E353D",
              borderRadius: "50%", overflow: "hidden",
            }}>
              {/* Green liquid */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "70%",
                background: "linear-gradient(0deg, #3a8a4a, #7FFF9F)",
                borderRadius: "0 0 50% 50%",
              }} />
              {/* Bubbles */}
              <div style={{ position: "absolute", bottom: 4, left: 5, width: 3, height: 3, background: "rgba(127,255,159,0.6)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", bottom: 8, left: 10, width: 2, height: 2, background: "rgba(127,255,159,0.5)", borderRadius: "50%" }} />
            </div>
          ))}
        </div>

        {/* ── ROOF: flat corrugated metal ── */}
        <div style={{
          position: "absolute", left: -4, top: 0, width: width + 8, height: TILE * 2,
          background: "#2E353D", border: "2px solid #1a1f24", borderRadius: "2px 2px 0 0",
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 8px)",
        }}>
          {/* Satellite dish */}
          <svg width="18" height="16" style={{ position: "absolute", right: 12, top: -10 }}>
            <ellipse cx="9" cy="10" rx="8" ry="5" fill="none" stroke="#6a7580" strokeWidth="2" />
            <line x1="9" y1="10" x2="9" y2="16" stroke="#4a5560" strokeWidth="2" />
            <circle cx="9" cy="8" r="2" fill="#8a9aa0" />
          </svg>
          {/* Vent pipe */}
          <div style={{
            position: "absolute", left: 16, top: -8, width: 8, height: 12,
            background: "#5a6570", border: "1px solid #2a3038", borderRadius: "2px 2px 0 0",
          }}>
            <div style={{ position: "absolute", top: -3, left: -2, width: 12, height: 4, background: "#6a7580", borderRadius: 1 }} />
          </div>
        </div>

        {/* ── WARNING LIGHT above door ── */}
        <div style={{
          position: "absolute", left: "50%", bottom: TILE + 2, transform: "translateX(-50%)",
          width: 8, height: 8, background: active ? "#ff4040" : "#aa2020",
          borderRadius: "50%", border: "1px solid #1a1a1a",
          boxShadow: active ? "0 0 8px #ff4040" : "none",
        }} />

        {/* ── DOOR: reinforced hatch with caution stripes ── */}
        <div style={{
          position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: TILE - 6, height: TILE - 4,
          background: "repeating-linear-gradient(135deg, #E8C93B, #E8C93B 3px, #1a1a1a 3px, #1a1a1a 6px)",
          border: "2px solid #1a1f24", borderBottom: "none", borderRadius: "2px 2px 0 0",
          boxShadow: active ? "inset 0 0 8px rgba(255,255,255,0.5)" : "inset 0 0 4px rgba(0,0,0,0.4)",
          pointerEvents: "auto", cursor: "pointer",
        }}>
          {/* Hatch handle */}
          <div style={{
            position: "absolute", right: 3, top: "40%", width: 5, height: 3,
            background: "#8a9aa0", borderRadius: 1, border: "1px solid #3a4048",
          }} />
        </div>


      </>)}
    </BuildingShell>
  );
}

// ============================================================
//  ── HOME ──
//  Rounded thatched roof, Tudor timber-frame, flower boxes
// ============================================================
function HomeBuilding({ shop, isNear }) {
  return (
    <BuildingShell shop={shop} isNear={isNear}>
      {({ active, width }) => (<>
        {/* ── WALL: whitewashed plaster with timber beams ── */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: "100%", height: TILE,
          background: "#EDE3D0", border: "2px solid #302820", borderRadius: 2,
        }}>
          {/* Tudor timber beams */}
          {/* Horizontal beam */}
          <div style={{ position: "absolute", left: 0, top: TILE * 0.4, width: "100%", height: 3, background: "#4A3324" }} />
          {/* Vertical beams */}
          {[TILE * 0.8, TILE * 2.2, TILE * 3.2, width - TILE * 0.8].map((x, i) => (
            <div key={i} style={{
              position: "absolute", left: x, top: 0, width: 3, height: "100%",
              background: "#4A3324",
            }} />
          ))}
          {/* Diagonal beam */}
          <div style={{
            position: "absolute", left: TILE * 0.8, top: 0, width: 3, height: TILE,
            background: "#4A3324", transform: "rotate(25deg)", transformOrigin: "top left",
          }} />

          {/* Square pane windows with flower boxes */}
          {[TILE * 0.35, width - TILE * 1.3].map((x, i) => (
            <div key={i} style={{ position: "absolute", left: x, top: 3 }}>
              {/* Window */}
              <div style={{
                width: TILE * 0.7, height: TILE * 0.55,
                background: "#a8d8e8", border: "2px solid #4A3324", borderRadius: 1,
              }}>
                {/* Pane cross */}
                <div style={{ position: "absolute", left: "50%", top: 0, width: 2, height: "100%", background: "#4A3324", marginLeft: -1 }} />
                <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 2, background: "#4A3324", marginTop: -1 }} />
              </div>
              {/* Flower box */}
              <div style={{
                width: TILE * 0.75, height: 5, background: "#6a4a2a",
                border: "1px solid #3a2a10", borderRadius: "0 0 1px 1px", marginTop: -1,
              }}>
                {[2, 7, 12].map(fx => (
                  <div key={fx} style={{
                    position: "absolute", left: fx, top: -3,
                    width: 4, height: 4, background: i === 0 ? "#e85070" : "#f0c040",
                    borderRadius: "50%",
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── ROOF: rounded thatch ── */}
        <svg width={width + 20} height={TILE * 2 + 8} style={{ position: "absolute", left: -10, top: -8 }}>
          {/* Main thatch shape — rounded */}
          <ellipse cx={(width + 20) / 2} cy={TILE * 2 + 6} rx={(width + 20) / 2} ry={TILE * 2} fill="#C99A4A" stroke="#6a4a20" strokeWidth="2" />
          {/* Clip to top half */}
          <rect x="0" y={TILE + 2} width={width + 20} height={TILE + 10} fill="#C99A4A" stroke="none" />
          {/* Thatch texture lines */}
          {[8, 16, 24, 32, 40].map(y => (
            <line key={y} x1="6" y1={y} x2={width + 14} y2={y} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
          ))}
          {/* Thatch edge scallops */}
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse key={i} cx={10 + i * 14} cy={TILE * 2 + 4} rx={7} ry={3} fill="#b88a3a" stroke="#6a4a20" strokeWidth="1" />
          ))}
        </svg>

        {/* ── CHIMNEY ── */}
        <div style={{
          position: "absolute", right: TILE * 0.8, top: -14, width: 12, height: 18,
          background: "#8a4a3c", border: "2px solid #4a2a20", borderRadius: "2px 2px 0 0",
        }}>
          {/* Chimney cap */}
          <div style={{ position: "absolute", top: -3, left: -2, width: 16, height: 4, background: "#6a3a2c", borderRadius: 1 }} />
          {/* Mortar line */}
          <div style={{ position: "absolute", top: 8, left: 1, right: 1, height: 1, background: "rgba(200,180,160,0.5)" }} />
        </div>

        {/* ── PICKET FENCE along base (left & right) ── */}
        <div style={{
          position: "absolute", left: -6, bottom: -4, height: 8,
          display: "flex", alignItems: "flex-end", gap: 3, paddingLeft: 2,
        }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{
              width: 3, height: i % 2 === 0 ? 8 : 6, background: "#f0e8d8",
              border: "1px solid #c0b8a0", borderRadius: "1px 1px 0 0",
            }} />
          ))}
        </div>
        <div style={{
          position: "absolute", right: -6, bottom: -4, height: 8,
          display: "flex", alignItems: "flex-end", gap: 3, paddingRight: 2,
        }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{
              width: 3, height: i % 2 === 0 ? 8 : 6, background: "#f0e8d8",
              border: "1px solid #c0b8a0", borderRadius: "1px 1px 0 0",
            }} />
          ))}
        </div>

        {/* ── DOOR: barn red ── */}
        <div style={{
          position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: TILE - 8, height: TILE - 4, background: "#A63D2F",
          border: "2px solid #302820", borderBottom: "none", borderRadius: "4px 4px 0 0",
          boxShadow: active ? "inset 0 0 8px rgba(255,255,255,0.6)" : "inset 0 0 4px rgba(0,0,0,0.3)",
          pointerEvents: "auto", cursor: "pointer",
        }}>
          {/* Plank lines */}
          <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(0,0,0,0.15)" }} />
          {/* Round iron knocker */}
          <div style={{
            position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)",
            width: 7, height: 7, borderRadius: "50%",
            border: "2px solid #2a2a2a", background: "transparent",
          }} />
        </div>


      </>)}
    </BuildingShell>
  );
}

// ============================================================
//  ── MUSIC ROOM ──
//  Piano-lid roof, treble-clef windows, vinyl-record sign
// ============================================================
function MusicRoomBuilding({ shop, isNear }) {
  return (
    <BuildingShell shop={shop} isNear={isNear}>
      {({ active, width }) => (<>
        {/* ── WALL: deep plum with piano-key strip ── */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: "100%", height: TILE,
          background: "#5C2A4D", border: "2px solid #1a0a18", borderRadius: 2,
        }}>
          {/* Piano-key strip along the base */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 6,
            display: "flex",
          }}>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} style={{
                flex: 1, background: i % 2 === 0 ? "#f0f0f0" : "#1a1a1a",
                borderRight: "1px solid rgba(0,0,0,0.2)",
              }} />
            ))}
          </div>

          {/* F-hole / treble-clef shaped windows */}
          {[TILE * 0.6, width - TILE * 1.2].map((x, i) => (
            <div key={i} style={{ position: "absolute", left: x, top: 3 }}>
              <svg width={TILE * 0.6} height={TILE * 0.65} viewBox="0 0 20 22">
                {/* f-hole shape */}
                <path d="M 10 1 C 14 1 16 5 16 8 C 16 11 14 13 10 14 C 6 13 4 11 4 8 C 4 5 6 1 10 1 Z M 8 7 C 8 9 9 10 10 10 C 11 10 12 9 12 7" fill="#E85D9E" stroke="#3a1a2a" strokeWidth="1.5" fillOpacity="0.7" />
                {/* Inner glow */}
                <ellipse cx="10" cy="8" rx="3" ry="4" fill="#E85D9E" fillOpacity="0.4" />
              </svg>
            </div>
          ))}
        </div>

        {/* ── ROOF: curved piano lid ── */}
        <svg width={width + 16} height={TILE * 2 + 8} style={{ position: "absolute", left: -8, top: -6 }}>
          {/* Piano lid curve */}
          <path d={`M 2,${TILE * 2 + 6} Q ${(width + 16) * 0.3},${-4} ${width + 14},${TILE * 0.6}`} fill="#1A1A1A" stroke="#0a0a0a" strokeWidth="2" />
          <path d={`M 2,${TILE * 2 + 6} L ${width + 14},${TILE * 2 + 6} L ${width + 14},${TILE * 0.6} Q ${(width + 16) * 0.3},${-4} 2,${TILE * 2 + 6}`} fill="#1A1A1A" stroke="#0a0a0a" strokeWidth="2" />
          {/* Gold trim along the curve */}
          <path d={`M 2,${TILE * 2 + 6} Q ${(width + 16) * 0.3},${-4} ${width + 14},${TILE * 0.6}`} fill="none" stroke="#D4AF37" strokeWidth="2" />
          {/* Glossy highlight */}
          <path d={`M 20,${TILE * 1.5} Q ${(width + 16) * 0.35},${8} ${width - 10},${TILE * 0.8}`} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        </svg>

        {/* ── VINYL RECORD SIGN above door ── */}
        <div style={{
          position: "absolute", left: "50%", top: 4, transform: "translateX(-50%)",
          pointerEvents: "auto",
        }}>
          <svg width="30" height="30" viewBox="0 0 30 30">
            {/* Outer disc */}
            <circle cx="15" cy="15" r="14" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="1" />
            {/* Grooves */}
            <circle cx="15" cy="15" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <circle cx="15" cy="15" r="9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <circle cx="15" cy="15" r="7" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            {/* Label */}
            <circle cx="15" cy="15" r="5" fill="#D4AF37" />
            {/* Center hole */}
            <circle cx="15" cy="15" r="1.5" fill="#1a1a1a" />
            {/* Highlight glint */}
            <path d="M 8 8 Q 15 6 22 10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* ── DOOR: piano-key pattern ── */}
        <div style={{
          position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: TILE - 8, height: TILE - 4,
          border: "2px solid #1a0a18", borderBottom: "none", borderRadius: "2px 2px 0 0",
          boxShadow: active ? "inset 0 0 8px rgba(255,255,255,0.5)" : "inset 0 0 4px rgba(0,0,0,0.4)",
          pointerEvents: "auto", cursor: "pointer",
          display: "flex", overflow: "hidden",
        }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
              flex: 1, background: i % 2 === 0 ? "#f0f0f0" : "#1a1a1a",
              borderRight: i < 5 ? "1px solid rgba(0,0,0,0.2)" : "none",
            }} />
          ))}
        </div>
      </>)}
    </BuildingShell>
  );
}

// ============================================================
//  ── NEWSLETTER ──
//  Mansard copper roof, navy clapboard, mailbox, newspaper sign
// ============================================================
function NewsletterBuilding({ shop, isNear }) {
  return (
    <BuildingShell shop={shop} isNear={isNear}>
      {({ active, width }) => (<>
        {/* ── WALL: navy clapboard with white trim ── */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: "100%", height: TILE,
          background: "#2A3F5C", border: "2px solid #0a1a2c", borderRadius: 2,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(255,255,255,0.06) 5px, rgba(255,255,255,0.06) 6px)",
        }}>
          {/* White trim strips */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#F2F0E9" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#F2F0E9" }} />

          {/* Windows showing newspaper stacks inside */}
          {[TILE * 0.5, width - TILE * 1.3].map((x, i) => (
            <div key={i} style={{
              position: "absolute", left: x, top: 4, width: TILE * 0.8, height: TILE * 0.55,
              background: "#1a1820", border: "2px solid #F2F0E9", borderRadius: 1,
              overflow: "hidden",
            }}>
              {/* Newspaper stack silhouette */}
              <div style={{ position: "absolute", bottom: 1, left: 2, right: 2, height: 3, background: "#d0c8b0" }} />
              <div style={{ position: "absolute", bottom: 5, left: 3, right: 1, height: 2, background: "#c8c0a8" }} />
              <div style={{ position: "absolute", bottom: 8, left: 1, right: 3, height: 2, background: "#d0c8b0" }} />
              {/* Press roller silhouette */}
              <div style={{ position: "absolute", top: 2, left: 4, width: 8, height: 4, background: "#3a3838", borderRadius: 2 }} />
            </div>
          ))}
        </div>

        {/* ── ROOF: mansard / pressed-tin, copper-green ── */}
        <svg width={width + 12} height={TILE * 2 + 6} style={{ position: "absolute", left: -6, top: -4 }}>
          {/* Mansard shape — steep lower slope, shallow upper */}
          <polygon
            points={`0,${TILE * 2 + 4} 10,${TILE * 0.8} ${width + 2},${TILE * 0.8} ${width + 12},${TILE * 2 + 4}`}
            fill="#6B8F71" stroke="#2a4a30" strokeWidth="2"
          />
          {/* Upper flat portion */}
          <rect x="10" y={2} width={width - 8} height={TILE * 0.8} fill="#5a7a60" stroke="#2a4a30" strokeWidth="2" rx="1" />
          {/* Pressed-tin texture */}
          {[TILE * 0.5, TILE, TILE * 1.5].map(y => (
            <line key={y} x1="4" y1={y} x2={width + 8} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          ))}
          {/* Flagpole */}
          <line x1={width * 0.7} y1={-8} x2={width * 0.7} y2={6} stroke="#4a4a4a" strokeWidth="2" />
          {/* Red flag */}
          <polygon points={`${width * 0.7},${-8} ${width * 0.7 + 10},${-5} ${width * 0.7},${-2}`} fill="#d84040" stroke="#8a2020" strokeWidth="1" />
        </svg>

        {/* ── MAILBOX with red flag ── */}
        <div style={{
          position: "absolute", right: TILE * 0.3, bottom: -2,
        }}>
          {/* Post */}
          <div style={{ position: "absolute", bottom: 0, left: 4, width: 3, height: 12, background: "#4a4a4a" }} />
          {/* Box */}
          <div style={{
            position: "absolute", bottom: 10, left: 0, width: 12, height: 8,
            background: "#3060a0", border: "1px solid #1a3050", borderRadius: "3px 3px 1px 1px",
          }}>
            {/* Mail slot */}
            <div style={{ position: "absolute", top: 3, left: 2, right: 2, height: 1.5, background: "#0a1a2c" }} />
          </div>
          {/* Red flag on mailbox */}
          <div style={{
            position: "absolute", bottom: 14, right: -3, width: 2, height: 8, background: "#4a4a4a",
          }}>
            <div style={{ position: "absolute", top: 0, left: 2, width: 5, height: 4, background: "#d84040", borderRadius: "0 1px 1px 0" }} />
          </div>
        </div>

        {/* ── DOOR: white with brass mail slot ── */}
        <div style={{
          position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: TILE - 8, height: TILE - 4, background: "#F2F0E9",
          border: "2px solid #0a1a2c", borderBottom: "none", borderRadius: "2px 2px 0 0",
          boxShadow: active ? "inset 0 0 8px rgba(100,150,255,0.5)" : "inset 0 0 4px rgba(0,0,0,0.2)",
          pointerEvents: "auto", cursor: "pointer",
        }}>
          {/* Mail slot */}
          <div style={{
            position: "absolute", left: "50%", top: "45%", transform: "translateX(-50%)",
            width: 12, height: 3, background: "#C9A24B", border: "1px solid #8a6a20", borderRadius: 1,
          }} />
          {/* Door knob */}
          <div style={{ position: "absolute", right: 3, top: "55%", width: 3, height: 3, background: "#C9A24B", borderRadius: "50%" }} />
        </div>


      </>)}
    </BuildingShell>
  );
}

// ============================================================
//  BUILDING DISPATCHER — routes shop.id to the correct component
// ============================================================
const BUILDING_COMPONENTS = {
  library:    LibraryBuilding,
  lab:        LabBuilding,
  nomadshome: HomeBuilding,
  musicroom:  MusicRoomBuilding,
  newsroom:   NewsletterBuilding,
};

function Building({ shop, isNear }) {
  const Component = BUILDING_COMPONENTS[shop.id];
  if (!Component) return null;
  return <Component shop={shop} isNear={isNear} />;
}

// ============================================================
//  MAIN VILLAGE SCENE
// ============================================================
export default function VillageScene({ isLandscape, previousScene,
  onGoToLibrary, onGoToLab, onGoToNewsroom,
  onGoToNomadshome, onGoToMusicRoom,
  speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume  }) {
  const [nearShop, setNearShop]   = useState(null);
  const [phase, setPhase]         = useState(previousScene ? "free" : "intro");
  const [scale, setScale] = useState(1);
  const [internalW, setInternalW] = useState(384);
  const [internalH, setInternalH] = useState(288);
        
  const [isSailing, setIsSailing] = useState(false);
  const [boatPos, setBoatPos] = useState({ col: 27.5, row: 28 });
  const [wakes, setWakes] = useState([]);

  useEffect(() => {
    if (wakes.length > 0) {
      const timer = setTimeout(() => setWakes(w => w.slice(1)), 50);
      return () => clearTimeout(timer);
    }
  }, [wakes]);

  const canWalk = useCallback((c, r) => {
    if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return false;
    if (!isSailing && SHOP_TILES.has(`${c},${r}`)) return false; // doors

    const t = MAP[r][c];
    if (isSailing) {
      return t === 4 || t === 10; // Allow water and bridge while sailing
    } else {
      if (t === 0 || t === 1 || t === 6 || t === 9 || t === 10) return true;
      if (r === boatPos.row && Math.abs(c - boatPos.col) <= 1) return true; // Walk on parked boat
      return false;
    }
  }, [isSailing, boatPos]);

  const sceneCallbacks = {
    library: onGoToLibrary, lab: onGoToLab, newsroom: onGoToNewsroom,
    nomadshome: onGoToNomadshome, musicroom: onGoToMusicRoom,
  };

  const initialPos = (() => {
    if (previousScene && SHOPS.some(s => s.scene === previousScene)) {
      const shop = SHOPS.find(s => s.scene === previousScene);
      return { col: shop.col, row: shop.row + 1 };
    }
    return START_POS;
  })();

  const { pos, setPos, facing, stepping } = usePlayerMovement({
    initialPos,
    canWalk,
    speedMultiplier,
    isActive: phase === "free",
    isSailing,
    onMove: (nc, nr) => {
      const tile = MAP[nr][nc];
      if (isSailing) {
        setWakes(prev => [...prev.slice(-7), { c: nc, r: nr, id: Date.now() }]);
        playWoodStep();
      } else {
        if (tile === 4) playWoodStep();
        else if (tile === 0 || tile === 6) playGrassStep(); // Grass & flowers
        else if (tile === 1 || tile === 9) playDirtStep(); // Trail & stairs
        else if (tile === 10) playWoodStep(); // Bridge
      }
      let isNear = null;
      for (const shop of SHOPS) {
        const dc = Math.abs(shop.col - nc);
        const dr = Math.abs(shop.row - nr);
        if ((dc + dr) === 1 || (dc === 0 && dr === 0)) {
          isNear = shop;
          break;
        }
      }
      setNearShop(isNear ? isNear.id : null);
      return false; // don't cancel move
    },
    onAction: () => {
      if (!isSailing) {
        if (pos.row === boatPos.row && Math.abs(pos.col - boatPos.col) <= 1) {
          setIsSailing(true);
          return;
        }
        if (nearShop) {
          const shop = SHOPS.find(s => s.id === nearShop);
          if (shop && sceneCallbacks[shop.scene]) sceneCallbacks[shop.scene]();
        }
      } else {
        // Drop anchor if next to a dock (Bridge = 10)
        const adjs = [
          { c: pos.col, r: pos.row - 1 }, { c: pos.col, r: pos.row + 1 },
          { c: pos.col - 1, r: pos.row }, { c: pos.col + 1, r: pos.row },
        ];
        for (const adj of adjs) {
          if (MAP[adj.r]?.[adj.c] === 10) {
            setBoatPos({ col: pos.col - 0.5, row: pos.row });
            setIsSailing(false);
            return;
          }
        }
      }
    },
    onCancel: () => setNearShop(null)
  });

  const [cam, setCam] = useState({ x: initialPos.col * TILE - internalW/2, y: initialPos.row * TILE - internalH/2 });

  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const musicRef     = useRef({ audioCtx: null, interval: null });
  const containerRef = useRef(null);
  const rafRef       = useRef();

  // ---- Synth engine: Richer 16-bit RPG Overworld Theme ----
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      // Cheerful major scale melody (C Major Pentatonic + F & B for passing)
      const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major
      const t = ctx.currentTime;

      // Bassline (Triangle wave - warmer, rounder bass)
      if (idx % 4 === 0 || idx % 4 === 2) {
        const bass = ctx.createOscillator();
        const bG = ctx.createGain();
        bass.type = "triangle";
        // Alternating root notes for a walking bass feel
        const roots = [130.81, 130.81, 174.61, 196.00]; // C, C, F, G
        const root = roots[Math.floor(idx / 16) % roots.length];
        bass.frequency.setValueAtTime(root, t);
        
        bG.gain.setValueAtTime(vol * 0.15, t);
        bG.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        bass.connect(bG); bG.connect(ctx.destination);
        bass.start(t); bass.stop(t + 0.35);
      }

      // Arpeggiated Melody (Square wave with lowpass filter for 16-bit "flute/synth" tone)
      if (idx % 2 === 0) {
        const mel = ctx.createOscillator();
        const mG = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        mel.type = "square";
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, t); // Cut off harsh high frequencies
        
        // A slightly more complex, cheerful sequence
        const pattern = [0, 2, 4, 7, 4, 5, 2, -1];
        const noteIdx = pattern[(idx / 2) % 8];
        
        if (noteIdx !== -1) {
          // Add some octave variation
          const octave = (idx % 32 > 16) ? 2 : 1.5;
          mel.frequency.setValueAtTime(scale[noteIdx] * octave, t);
          
          mG.gain.setValueAtTime(vol * 0.05, t);
          // Slightly longer decay for smoother melody
          mG.gain.setTargetAtTime(0.001, t + 0.1, 0.05);
          
          mel.connect(filter); filter.connect(mG); mG.connect(ctx.destination);
          mel.start(t); mel.stop(t + 0.25);
        }
      }
      
      // Counter-melody (Sine wave for a glassy pad sound)
      if (idx % 8 === 0) {
        const pad = ctx.createOscillator();
        const pG = ctx.createGain();
        pad.type = "sine";
        const padNote = scale[Math.floor(idx / 16) % scale.length];
        pad.frequency.setValueAtTime(padNote * 2, t); // High register
        
        pG.gain.setValueAtTime(0, t);
        pG.gain.linearRampToValueAtTime(vol * 0.03, t + 0.2);
        pG.gain.linearRampToValueAtTime(0, t + 0.6);
        
        pad.connect(pG); pG.connect(ctx.destination);
        pad.start(t); pad.stop(t + 0.65);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(180 / speedMultiplier); // faster, upbeat tempo
    musicRef.current.interval = setInterval(() => {
      playStep(step++, musicVolume, musicMuted);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);

  useEffect(() => {
    const resize = () => {
      // Force integer scaling (1x, 2x, 3x) for pixel-perfect retro rendering
      const isMobile = window.innerWidth < 768;
      const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
      const availableHeight = window.innerHeight - consoleHeight;
      const newScale = Math.max(1, Math.floor(Math.min(window.innerWidth / INTERNAL_W, availableHeight / INTERNAL_H)));
      setScale(newScale);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);


  useEffect(() => {
    const resume = () => {
      if (!musicRef.current.audioCtx) musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (musicRef.current.audioCtx.state === "suspended") musicRef.current.audioCtx.resume();
    };
    const onIntroDismiss = (e) => {
      if (phase === "intro" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setPhase("free");
      }
    };

    window.addEventListener("keydown", resume);
    window.addEventListener("click", resume);
    window.addEventListener("keydown", onIntroDismiss);

    return () => {
      window.removeEventListener("keydown", resume);
      window.removeEventListener("click", resume);
      window.removeEventListener("keydown", onIntroDismiss);
    };
  }, [phase]);

  // Smooth Camera Lerp
  useEffect(() => {
    let lastTime = performance.now();
    const updateCam = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      const targetX = pos.col * TILE + TILE / 2 - internalW / 2;
      const targetY = pos.row * TILE + TILE / 2 - internalH / 2;
      
      const clampedTX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - internalW), targetX));
      const clampedTY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - internalH), targetY));

      setCam(prev => {
        const lerpFactor = 1.0 - Math.pow(0.001, dt * speedMultiplier);
        return {
          x: prev.x + (clampedTX - prev.x) * lerpFactor,
          y: prev.y + (clampedTY - prev.y) * lerpFactor
        };
      });
      rafRef.current = requestAnimationFrame(updateCam);
    };
    rafRef.current = requestAnimationFrame(updateCam);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pos, speedMultiplier]);

  // Virtualization
  const startCol = Math.max(0, Math.floor(cam.x / TILE) - 2);
  const endCol = Math.min(MAP_COLS, Math.floor((cam.x + INTERNAL_W) / TILE) + 3);
  const startRow = Math.max(0, Math.floor(cam.y / TILE) - 2);
  const endRow = Math.min(MAP_ROWS, Math.floor((cam.y + INTERNAL_H) / TILE) + 3);

  const activeShop = SHOPS.find(s => s.id === nearShop);
  const isOnBoat = !isSailing && pos.row === boatPos.row && Math.abs(pos.col - boatPos.col) <= 1;
  const isNearDockWhileSailing = isSailing && [
    { c: pos.col, r: pos.row - 1 }, { c: pos.col, r: pos.row + 1 },
    { c: pos.col - 1, r: pos.row }, { c: pos.col + 1, r: pos.row },
  ].some(adj => MAP[adj.r]?.[adj.c] === 10);

  const getBoatTransform = () => {
    if (!isSailing) return "none";
    if (facing === "left") return "scaleX(-1)";
    return "none";
  };

  // Render Virtualized Grid
  const visibleTiles = [];
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const tile = MAP[r][c];
      
      const h = hash(r, c);
      let bg = PALETTE.grass[h % PALETTE.grass.length]; // default grass base
      let content = null;

      if (tile === 0 || tile === 6) { // Grass / Flowers
        // Pixel grass detail — small hard-edged squares
        content = (
          <>
            {h % 3 === 0 && <div style={{ position: "absolute", left: h % 14 + 4, top: h % 10 + 6, width: 2, height: 4, background: "#50a840" }} />}
            {h % 5 === 0 && <div style={{ position: "absolute", left: h % 8 + 16, top: h % 12 + 2, width: 2, height: 3, background: "#48a038" }} />}
            {tile === 6 && <>
              <div style={{ position: "absolute", left: 6, top: 6, width: 4, height: 4, background: "#f878a0" }} />
              <div style={{ position: "absolute", left: 8, top: 8, width: 2, height: 2, background: "#f0c040" }} />
              <div style={{ position: "absolute", left: 20, top: 18, width: 4, height: 4, background: "#f0c040" }} />
              <div style={{ position: "absolute", left: 22, top: 20, width: 2, height: 2, background: "#f878a0" }} />
              <div style={{ position: "absolute", left: 12, top: 22, width: 3, height: 3, background: "#fff" }} />
            </>}
          </>
        );
      } else if (tile === 1) { // Path
        bg = PALETTE.path[h % PALETTE.path.length];
        // Pixel path edge — 1px solid border, no anti-aliasing
        content = <div style={{ position: "absolute", inset: 0, borderBottom: "1px solid rgba(0,0,0,0.08)", borderRight: "1px solid rgba(0,0,0,0.06)" }} />;
      } else if (tile === 2) { // Tree
        bg = PALETTE.grass[h % PALETTE.grass.length]; // base grass
        
        // Render a detailed pixel-art Pokémon-style RPG tree
        const SPECIES = [
          ["#1a4d24", "#5db34a", "#a3e37e", "#2f7d3a"], // broadleaf
          ["#173d1f", "#4f9c3c", "#87c95f", "#26622c"], // oak
          ["#0f3322", "#2f7d4a", "#5cae74", "#1c5433"], // pine
        ];
        const VARIANTS = [
          [{cx:28,cy:25,r:15},{cx:15,cy:27,r:11},{cx:41,cy:27,r:11},{cx:21,cy:14,r:10},{cx:35,cy:14,r:10},{cx:28,cy:35,r:12}],
          [{cx:28,cy:40,r:14},{cx:28,cy:28,r:12},{cx:28,cy:17,r:10},{cx:28,cy:8,r:7}],
          [{cx:17,cy:27,r:13},{cx:39,cy:27,r:13},{cx:28,cy:18,r:11},{cx:28,cy:35,r:12}],
        ];

        const uid = `${r}-${h}`; // swap for a true row/col key if available, must be unique per tile
        const circles = VARIANTS[h % VARIANTS.length];
        const [outline, base, hi, sh] = SPECIES[h % SPECIES.length];
        const flip = h % 2 === 0;
        const circleTags = circles.map(c => <circle key={c.cx+","+c.cy} cx={c.cx} cy={c.cy} r={c.r} />);

        content = (
          <div style={{
            position: "absolute", left: -8, top: -22, width: TILE + 16, height: TILE + 24,
            zIndex: r * 10 + 2, display: "flex", alignItems: "flex-end", justifyContent: "center"
          }}>
            <svg viewBox="0 0 56 66" width="56" height="66"
                 style={{ transform: flip ? "scaleX(-1)" : "none", overflow: "visible" }}>
              <defs>
                <clipPath id={`clip-${uid}`}>{circleTags}</clipPath>
                <filter id={`outline-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="dilated" />
                  <feFlood floodColor={outline} result="outlineColor" />
                  <feComposite in="outlineColor" in2="dilated" operator="in" result="outlinePart" />
                  <feMerge>
                    <feMergeNode in="outlinePart" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ground shadow */}
              <ellipse cx="28" cy="60" rx="15" ry="4.5" fill="#000" opacity="0.28" />

              {/* two-tone trunk */}
              <rect x="23" y="46" width="5" height="13" fill="#6b4423" stroke="#2e1c0e" strokeWidth="1.6" />
              <rect x="28" y="46" width="5" height="13" fill="#4a2f18" stroke="#2e1c0e" strokeWidth="1.6" />

              {/* canopy: circle union + filter = chunky pixel outline, free */}
              <g filter={`url(#outline-${uid})`} fill={base}>{circleTags}</g>

              {/* cel-shading */}
              <ellipse cx="20" cy="17" rx="11" ry="9" fill={hi} opacity="0.55" clipPath={`url(#clip-${uid})`} />
              <ellipse cx="37" cy="33" rx="12" ry="10" fill={sh} opacity="0.45" clipPath={`url(#clip-${uid})`} />

              {/* gloss chips */}
              <rect x="17" y="12" width="3" height="3" fill="#fff" opacity="0.85" clipPath={`url(#clip-${uid})`} />

              {/* fruit, same hash rules as before */}
              {h % 5 === 0 && <circle cx="16" cy="22" r="2.6" fill="#e0524a" stroke="#7a1f1c" strokeWidth="1.2" clipPath={`url(#clip-${uid})`} />}
              {h % 7 === 0 && <circle cx="37" cy="20" r="2.6" fill="#e0524a" stroke="#7a1f1c" strokeWidth="1.2" clipPath={`url(#clip-${uid})`} />}
              {h % 13 === 0 && <circle cx="28" cy="31" r="3.4" fill="#ffd75e" stroke="#8a6a10" strokeWidth="1.4" clipPath={`url(#clip-${uid})`} />}
            </svg>
          </div>
        );
      } else if (tile === 3) { // House Base
        bg = PALETTE.grass[0]; // House rendered over this
      } else if (tile === 4) { // Water
        bg = PALETTE.water[h % PALETTE.water.length];
        // Pixel wave highlights — hard rectangles, no border-radius
        content = (
          <>
            {h % 3 === 0 && <div style={{ position: "absolute", left: h % 8 + 2, top: h % 10 + 6, width: 8, height: 2, background: "#4090c0" }} />}
            {h % 4 === 0 && <div style={{ position: "absolute", left: h % 12 + 14, top: h % 8 + 16, width: 6, height: 2, background: "#3888b8" }} />}
            {h % 7 === 0 && <div style={{ position: "absolute", left: h % 6 + 8, top: h % 14 + 2, width: 4, height: 1, background: "#5098c8" }} />}
          </>
        );
      } else if (tile === 5) { // Pine Tree — conical layered circles
        bg = PALETTE.grass[h % PALETTE.grass.length];
        const PINE_PALETTES = [
          ["#0d3a1f", "#1a5c2a", "#3a8a4a", "#0f4a22"],
          ["#0a3018", "#166628", "#2d7a3c", "#0c3a1a"],
          ["#0f3322", "#1e6830", "#40905a", "#134428"],
        ];
        const PINE_SHAPES = [
          [{cx:20,cy:36,r:13},{cx:20,cy:26,r:11},{cx:20,cy:17,r:9},{cx:20,cy:9,r:6}],
          [{cx:20,cy:38,r:12},{cx:20,cy:28,r:10},{cx:20,cy:19,r:8},{cx:20,cy:11,r:5.5}],
          [{cx:20,cy:37,r:14},{cx:20,cy:27,r:11},{cx:20,cy:18,r:8},{cx:20,cy:10,r:5}],
        ];
        const puid = `p${r}-${c}`;
        const pCircles = PINE_SHAPES[h % PINE_SHAPES.length];
        const [pOutline, pBase, pHi, pSh] = PINE_PALETTES[h % PINE_PALETTES.length];
        const pFlip = h % 2 === 0;
        const pTags = pCircles.map(ci => <circle key={ci.cy} cx={ci.cx} cy={ci.cy} r={ci.r} />);
        content = (
          <div style={{
            position: "absolute", left: -4, top: -24, width: TILE + 8, height: TILE + 26,
            zIndex: r * 10 + 2, display: "flex", alignItems: "flex-end", justifyContent: "center"
          }}>
            <svg viewBox="0 0 40 62" width="40" height="62"
                 style={{ transform: pFlip ? "scaleX(-1)" : "none", overflow: "visible" }}>
              <defs>
                <clipPath id={`pclip-${puid}`}>{pTags}</clipPath>
                <filter id={`pout-${puid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology in="SourceAlpha" operator="dilate" radius="1.8" result="d" />
                  <feFlood floodColor={pOutline} result="oc" />
                  <feComposite in="oc" in2="d" operator="in" result="op" />
                  <feMerge><feMergeNode in="op" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <ellipse cx="20" cy="58" rx="10" ry="3.5" fill="#000" opacity="0.22" />
              <rect x="17" y="46" width="3" height="12" fill="#6b4423" stroke="#2e1c0e" strokeWidth="1.4" />
              <rect x="20" y="46" width="3" height="12" fill="#4a2f18" stroke="#2e1c0e" strokeWidth="1.4" />
              <g filter={`url(#pout-${puid})`} fill={pBase}>{pTags}</g>
              <ellipse cx="16" cy="14" rx="6" ry="5" fill={pHi} opacity="0.5" clipPath={`url(#pclip-${puid})`} />
              <ellipse cx="24" cy="30" rx="7" ry="6" fill={pSh} opacity="0.4" clipPath={`url(#pclip-${puid})`} />
              <rect x="15" y="8" width="2" height="2" fill="#fff" opacity="0.7" clipPath={`url(#pclip-${puid})`} />
            </svg>
          </div>
        );
      } else if (tile === 7) { // Oak Tree — wide rounded circle clusters
        bg = PALETTE.grass[h % PALETTE.grass.length];
        const OAK_PALETTES = [
          ["#1a4d22", "#2d6a36", "#5aa060", "#1f5a28"],
          ["#174420", "#28603a", "#4a9050", "#1c5030"],
          ["#1a5028", "#38783e", "#60b068", "#245a30"],
        ];
        const OAK_SHAPES = [
          [{cx:24,cy:24,r:17},{cx:12,cy:26,r:12},{cx:36,cy:26,r:12},{cx:18,cy:14,r:10},{cx:30,cy:14,r:10},{cx:24,cy:34,r:13}],
          [{cx:24,cy:22,r:18},{cx:10,cy:28,r:11},{cx:38,cy:28,r:11},{cx:24,cy:12,r:10},{cx:24,cy:36,r:12}],
          [{cx:24,cy:25,r:16},{cx:14,cy:22,r:13},{cx:34,cy:22,r:13},{cx:20,cy:12,r:9},{cx:28,cy:12,r:9},{cx:24,cy:36,r:11}],
        ];
        const ouid = `o${r}-${c}`;
        const oCircles = OAK_SHAPES[h % OAK_SHAPES.length];
        const [oOutline, oBase, oHi, oSh] = OAK_PALETTES[h % OAK_PALETTES.length];
        const oFlip = h % 2 === 0;
        const oTags = oCircles.map(ci => <circle key={`${ci.cx},${ci.cy}`} cx={ci.cx} cy={ci.cy} r={ci.r} />);
        content = (
          <div style={{
            position: "absolute", left: -8, top: -22, width: TILE + 16, height: TILE + 24,
            zIndex: r * 10 + 2, display: "flex", alignItems: "flex-end", justifyContent: "center"
          }}>
            <svg viewBox="0 0 48 62" width="48" height="62"
                 style={{ transform: oFlip ? "scaleX(-1)" : "none", overflow: "visible" }}>
              <defs>
                <clipPath id={`oclip-${ouid}`}>{oTags}</clipPath>
                <filter id={`oout-${ouid}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d" />
                  <feFlood floodColor={oOutline} result="oc" />
                  <feComposite in="oc" in2="d" operator="in" result="op" />
                  <feMerge><feMergeNode in="op" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <ellipse cx="24" cy="58" rx="14" ry="4" fill="#000" opacity="0.25" />
              <rect x="20" y="44" width="4" height="14" fill="#6b4423" stroke="#2e1c0e" strokeWidth="1.5" />
              <rect x="24" y="44" width="4" height="14" fill="#4a2f18" stroke="#2e1c0e" strokeWidth="1.5" />
              <g filter={`url(#oout-${ouid})`} fill={oBase}>{oTags}</g>
              <ellipse cx="16" cy="15" rx="10" ry="8" fill={oHi} opacity="0.5" clipPath={`url(#oclip-${ouid})`} />
              <ellipse cx="32" cy="30" rx="10" ry="8" fill={oSh} opacity="0.4" clipPath={`url(#oclip-${ouid})`} />
              <rect x="14" y="10" width="3" height="3" fill="#fff" opacity="0.7" clipPath={`url(#oclip-${ouid})`} />
              {h % 4 === 0 && <circle cx="14" cy="28" r="2.5" fill="#8a6a30" stroke="#5a4020" strokeWidth="1" clipPath={`url(#oclip-${ouid})`} />}
              {h % 9 === 0 && <circle cx="34" cy="24" r="2.5" fill="#8a6a30" stroke="#5a4020" strokeWidth="1" clipPath={`url(#oclip-${ouid})`} />}
            </svg>
          </div>
        );
      } else if (tile === 8) { // Cliff
        bg = PALETTE.cliff[h % PALETTE.cliff.length];
        // Pixel rock texture — hard-edged lines and cracks
        content = (
          <>
            <div style={{ position: "absolute", left: 2, top: h % 8 + 2, width: 10, height: 2, background: "#4a3525" }} />
            <div style={{ position: "absolute", right: 4, bottom: h % 6 + 4, width: 8, height: 2, background: "#4a3525" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#6a5040" }} />
            {h % 3 === 0 && <div style={{ position: "absolute", left: 10, top: 6, width: 1, height: 10, background: "#3a2a1a" }} />}
            {h % 5 === 0 && <div style={{ position: "absolute", left: 20, top: 14, width: 1, height: 8, background: "#3a2a1a" }} />}
          </>
        );
      } else if (tile === 9) { // Stairs
        bg = PALETTE.stairs[0];
        // Pixel stone steps — flat rectangles, no rounding
        content = (
          <>
            {[2, 10, 18, 26].map(y => (
              <div key={y} style={{
                position: "absolute", left: 0, right: 0, top: y,
                height: 6, background: PALETTE.stairs[1],
                borderTop: "1px solid #a0a0a0", borderBottom: "1px solid #707070",
              }} />
            ))}
          </>
        );
      } else if (tile === 10) { // Bridge
        bg = PALETTE.bridge[h % PALETTE.bridge.length];
        // Pixel wooden planks — vertical slat lines
        content = (
          <>
            {[0, 8, 16, 24].map(x => (
              <div key={x} style={{ position: "absolute", left: x, top: 0, width: 1, height: TILE, background: "#5c3a18" }} />
            ))}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#5c3a18" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#5c3a18" }} />
          </>
        );
      }

      visibleTiles.push(
        <div key={`${r}-${c}`} style={{
          position: "absolute", left: c * TILE, top: r * TILE,
          width: TILE, height: TILE, background: bg,
          zIndex: (isSailing && tile === 10) ? r * 10 + 20 : undefined,
        }}>
          {content}
        </div>
      );
    }
  }

  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#000", overflow: "hidden",
      fontFamily: "'Press Start 2P', monospace", userSelect: "none",
      
      boxSizing: "border-box", height: "100dvh", width: "100dvw", }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes glowPulse { from { opacity: 0.5; transform: translateX(-50%) scale(1); } to { opacity: 1; transform: translateX(-50%) scale(1.1); } }
        @keyframes floatBoat { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-3px) rotate(2deg); } }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: `scale(${scale})`, transformOrigin: "center",
        imageRendering: "pixelated",
      }}>

        {/* ── GAME VIEWPORT ── */}
        <div style={{
          position: "relative", width: internalW, height: internalH,
          overflow: "hidden", background: PALETTE.water[0],
          boxShadow: "0 0 0 4px #1a5580",
          imageRendering: "pixelated",
        }}>

          {/* Scrolling world layer */}
          <div style={{
            position: "absolute",
            width: MAP_COLS * TILE, height: MAP_ROWS * TILE,
            left: -Math.round(cam.x), top: -Math.round(cam.y),
          }}>
            
            {visibleTiles}

            {/* Render Buildings */}
            {SHOPS.map(shop => (
              <Building key={shop.id} shop={shop} isNear={nearShop === shop.id} />
            ))}

            {/* Player */}
            <div style={{
              position: "absolute", left: pos.col * TILE, top: pos.row * TILE, width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
            }}>
              {/* Pixel drop shadow */}
              <div style={{ position: "absolute", bottom: 2, left: "50%", marginLeft: -7, width: 14, height: 4, background: "rgba(0,0,0,0.25)", zIndex: -1 }} />
              <PlayerSprite direction={facing} stepping={stepping} costume="casual" />
            </div>
            
            {/* Wakes */}
            {wakes.map((w, i) => {
              const age = wakes.length - i;
              return (
                <div key={w.id} style={{
                  position: "absolute", left: (w.c + 0.5) * TILE - 3, top: (w.r + 0.5) * TILE - 3,
                  width: 6, height: 6, background: "#fff", borderRadius: "50%",
                  opacity: Math.max(0, 0.25 - (age / 7) * 0.25),
                  transform: `scale(${1 + (age / 7) * 1.5})`,
                  zIndex: 1, pointerEvents: "none"
                }} />
              );
            })}

            {/* ── MOORED BOAT (HULL) ── */}
            <div style={{
              position: "absolute",
              left: (isSailing ? pos.col - 0.5 : boatPos.col) * TILE,
              top: (isSailing ? pos.row : boatPos.row) * TILE,
              width: TILE * 2, height: TILE * 1.5,
              animation: "floatBoat 4s ease-in-out infinite",
              zIndex: (isSailing ? pos.row : boatPos.row) * 10 + 2, // Sort behind player on boat (285)
              pointerEvents: "auto", cursor: "pointer",
            }} onClick={() => { if (!isSailing) alert("Press SPACE to Sail!"); }}>
              <div style={{ transform: getBoatTransform(), width: "100%", height: "100%", transition: "transform 0.2s" }}>
                {(!isSailing || facing === "left" || facing === "right") && (
                  <div style={{ position: "absolute", bottom: 4, left: 4, width: TILE*2 - 8, height: 14, background: "#a05a2c", border: "2px solid #3a1c0a", borderRadius: "4px 4px 14px 14px", boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.3)" }} />
                )}
                {isSailing && facing === "down" && (
                  <div style={{ position: "absolute", bottom: 4, left: TILE - 10, width: 20, height: 18, background: "#a05a2c", border: "2px solid #3a1c0a", borderRadius: "4px 4px 18px 18px", boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.3)" }} />
                )}
                {isSailing && facing === "up" && (
                  <div style={{ position: "absolute", bottom: 4, left: TILE - 10, width: 20, height: 14, background: "#a05a2c", border: "2px solid #3a1c0a", borderRadius: "4px", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.3)" }} />
                )}
              </div>
            </div>

            {/* ── MOORED BOAT (SAIL & MAST) ── */}
            <div style={{
              position: "absolute",
              left: (isSailing ? pos.col - 0.5 : boatPos.col) * TILE,
              top: (isSailing ? pos.row : boatPos.row) * TILE,
              width: TILE * 2, height: TILE * 1.5,
              animation: "floatBoat 4s ease-in-out infinite",
              zIndex: (isSailing ? pos.row : boatPos.row) * 10 + 8, // Sort in front of player on boat (285)
              pointerEvents: "none",
            }}>
              <div style={{ transform: getBoatTransform(), width: "100%", height: "100%", transition: "transform 0.2s" }}>
                {(!isSailing || facing === "left" || facing === "right") && (
                  <>
                    <div style={{ position: "absolute", bottom: 18, left: TILE - 2, width: 4, height: 32, background: "#d4a520", border: "2px solid #3a1c0a", borderRadius: 2 }} />
                    <div style={{ position: "absolute", bottom: 22, left: TILE, width: 22, height: 20, background: "#f8f8f8", border: "2px solid #3a1c0a", borderRadius: "0 16px 16px 0", boxShadow: "inset -4px 0 0 rgba(0,0,0,0.1)" }} />
                  </>
                )}
                {isSailing && facing === "down" && (
                  <>
                    <div style={{ position: "absolute", bottom: 18, left: TILE - 2, width: 4, height: 32, background: "#d4a520", border: "2px solid #3a1c0a", borderRadius: 2 }} />
                    <div style={{ position: "absolute", bottom: 22, left: TILE - 14, width: 28, height: 20, background: "#f8f8f8", border: "2px solid #3a1c0a", borderRadius: "14px 14px 4px 4px", boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.1)" }} />
                  </>
                )}
                {isSailing && facing === "up" && (
                  <>
                    <div style={{ position: "absolute", bottom: 22, left: TILE - 14, width: 28, height: 20, background: "#e8e8e8", border: "2px solid #3a1c0a", borderRadius: "14px 14px 4px 4px", boxShadow: "inset 0 4px 0 rgba(0,0,0,0.05)" }} />
                    <div style={{ position: "absolute", bottom: 42, left: TILE - 2, width: 4, height: 8, background: "#d4a520", border: "2px solid #3a1c0a", borderRadius: "2px 2px 0 0" }} />
                  </>
                )}
              </div>
            </div>


          </div>

          {/* ── NIGHT OVERLAY ── */}
          <div style={{
            position: "absolute", inset: 0,
            background: "#182040", mixBlendMode: "multiply", opacity: 0.8,
            pointerEvents: "none", zIndex: 4000,
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "#08102a", mixBlendMode: "overlay", opacity: 0.4,
            pointerEvents: "none", zIndex: 4001,
          }} />

          {/* ── MINIMAP ── */}
          {phase === "free" && (
            <div style={{
              position: "absolute", top: 6, right: 6, zIndex: 5000,
              background: "rgba(0,0,0,0.7)", border: "2px solid rgba(255,255,255,0.3)",
              borderRadius: 4, padding: 3, pointerEvents: "auto",
            }}>
              <svg
                width={MAP_COLS * 2} height={MAP_ROWS * 2}
                viewBox={`0 0 ${MAP_COLS} ${MAP_ROWS}`}
                style={{ display: "block", imageRendering: "pixelated" }}
              >
                {/* Map tiles */}
                {MAP.map((row, ry) => row.map((t, cx) => {
                  let fill;
                  if (t === 0 || t === 6) fill = "#5a9a44";
                  else if (t === 1) fill = "#d0b870";
                  else if (t === 2 || t === 5 || t === 7) fill = "#1a4a22";
                  else if (t === 3) fill = "#6a6a6a";
                  else if (t === 4) fill = "#2060a0";
                  else if (t === 8) fill = "#5a4030";
                  else if (t === 9) fill = "#8a8a8a";
                  else if (t === 10) fill = "#8a5a2a";
                  else fill = "#2060a0";
                  return <rect key={`${ry}-${cx}`} x={cx} y={ry} width={1} height={1} fill={fill} />;
                }))}
                {/* Building markers — clickable */}
                {SHOPS.map(shop => {
                  const colors = {
                    newsroom: "#d84040", library: "#8a40d8",
                    musicroom: "#d88a40", lab: "#40d860",
                    nomadshome: "#408ad8",
                  };
                  return (
                    <rect
                      key={shop.id}
                      x={shop.col - 2} y={shop.row - 2}
                      width={5} height={3}
                      fill={colors[shop.id] || "#fff"}
                      stroke="#fff" strokeWidth={0.3}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setPos({ col: shop.col, row: shop.row + 1 });
                        setNearShop(shop.id);
                      }}
                    />
                  );
                })}
                {/* Player dot */}
                <circle cx={pos.col + 0.5} cy={pos.row + 0.5} r={0.8} fill="#fff" stroke="#000" strokeWidth={0.3} />
              </svg>
            </div>
          )}

          {/* Proximity prompt */}
          {phase === "free" && (activeShop || isOnBoat || isNearDockWhileSailing) && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", padding: "5px 12px",
              background: "#f8f8f8", border: `2px solid #302820`, borderRadius: 4,
              zIndex: 6000, pointerEvents: "none", display: "flex", gap: 8, alignItems: "center",
              boxShadow: `0 4px 0 rgba(0,0,0,0.2)`, whiteSpace: "nowrap", color: "#302820"
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 5.5, color: "#302820" }}>
                {activeShop && <><DoorOpen size={8} /><span>ENTER {activeShop.label}</span></>}
                {isOnBoat && <span>SAIL BOAT</span>}
                {isNearDockWhileSailing && <span>DROP ANCHOR</span>}
              </div>
              <div style={{ fontSize: 5, color: "#fff", background: "#302820", padding: "2px 5px", borderRadius: 2 }}>SPACE</div>
            </div>
          )}

          {/* Intro dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", bottom: 8, left: 8, right: 8, padding: "18px 14px 10px",
              background: "#f8f8f8", border: "2px solid #302820", borderRadius: 4,
              boxShadow: "0 6px 0 rgba(0,0,0,0.3)", zIndex: 6000,
            }}>
              <div style={{
                position: "absolute", top: -10, left: 10, background: "#d84040", border: "2px solid #302820",
                padding: "2px 8px", fontSize: 6, color: "#fff", borderRadius: 2,
              }}>NOMADSLAND</div>
              <div style={{ fontSize: 8, lineHeight: 2.4, minHeight: 28, color: "#302820" }}>
                Welcome to Nomadsland! A peaceful town full of ideas and projects.
                <span style={{ animation: "dialogBlink 0.5s step-end infinite" }}>▊</span>
              </div>
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setPhase("free")} style={{
                  fontFamily: "'Press Start 2P', monospace", fontSize: 6, background: "#408ad8", color: "#fff",
                  border: "2px solid #302820", padding: "6px 12px", borderRadius: 4, cursor: "pointer",
                  boxShadow: "0 2px 0 #302820", display: "flex", alignItems: "center",
                }}>
                  <span style={{ fontSize: 5, color: "#302820", marginRight: 8, background: "rgba(255,255,255,0.4)", padding: "2px 4px", borderRadius: 2 }}>SPACE</span>
                  LET'S GO!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      </div>
      <ControlBar
        musicPlaying={musicPlaying} musicMuted={musicMuted}
        musicVolume={musicVolume} speedMultiplier={speedMultiplier}
        onTogglePlay={() => musicPlaying ? setMusicMuted(!musicMuted) : setMusicPlaying(true)}
        onChangeVolume={setMusicVolume} onChangeSpeed={setSpeedMultiplier}
      />
    </div>
  );
}
