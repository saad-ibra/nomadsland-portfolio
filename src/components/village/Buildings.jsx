import React, { useState } from "react";
import { DoorOpen } from "lucide-react";
import { TILE } from "../../engine/constants";
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

        {/* ── DOOR: solid with brass handle ── */}
        <div style={{
          position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: TILE - 8, height: TILE - 4, background: "#1a1a1a",
          border: "2px solid #0a0a0a", borderBottom: "none", borderRadius: "2px 2px 0 0",
          boxShadow: active ? "inset 0 0 8px rgba(255,255,255,0.3)" : "inset 0 0 4px rgba(0,0,0,0.6)",
          pointerEvents: "auto", cursor: "pointer",
        }}>
          {/* Vertical inset panels */}
          <div style={{ position: "absolute", left: 2, top: 2, right: 8, bottom: 2, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1 }} />
          {/* Brass door knob */}
          <div style={{ position: "absolute", right: 3, top: "55%", width: 3, height: 3, background: "#D4AF37", borderRadius: "50%" }} />
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

export function Building({ shop, isNear }) {
  const Component = BUILDING_COMPONENTS[shop.id];
  if (!Component) return null;
  return <Component shop={shop} isNear={isNear} />;
}
