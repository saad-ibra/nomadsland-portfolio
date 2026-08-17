import { TILE } from '../../engine/constants';

/**
 * ExitDoor – Renders a distinct exit indicator.
 * Top-wall exits (row 1) render as a dark doorway/archway.
 * Bottom-wall exits render as a pixel-art doormat.
 */
export default function ExitDoor({ col, row }) {
  const isTopWall = row <= 1;

  if (isTopWall) {
    return (
      <div style={{
        position: "absolute",
        left: col * TILE,
        top: row * TILE,
        width: TILE,
        height: TILE,
        zIndex: row * 10 + 1, // Above the wall tile
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width="100%" height="100%" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
          {/* Frame Outline (Darkest) */}
          <rect x="1" y="0" width="14" height="16" fill="#301c10" />
          <rect x="0" y="1" width="16" height="15" fill="#301c10" />
          
          {/* Frame Wood (Medium) */}
          <rect x="1" y="1" width="14" height="15" fill="#5c3826" />
          
          {/* Frame Highlight (Light) */}
          <rect x="1" y="1" width="14" height="1" fill="#8c583c" />
          <rect x="1" y="1" width="1" height="15" fill="#8c583c" />
          
          {/* Door Hole / Inner Shadow */}
          <rect x="2" y="2" width="12" height="14" fill="#301c10" />
          
          {/* Door Base */}
          <rect x="3" y="3" width="10" height="13" fill="#764a30" />
          
          {/* Panels */}
          {/* Top Panel Shadow */}
          <rect x="5" y="4" width="6" height="4" fill="#4a2c1a" />
          {/* Top Panel Base */}
          <rect x="6" y="5" width="4" height="2" fill="#8c583c" />
          {/* Top Panel Highlight */}
          <rect x="6" y="5" width="4" height="1" fill="#a66c4a" />
          
          {/* Bottom Panel Shadow */}
          <rect x="5" y="10" width="6" height="5" fill="#4a2c1a" />
          {/* Bottom Panel Base */}
          <rect x="6" y="11" width="4" height="3" fill="#8c583c" />
          {/* Bottom Panel Highlight */}
          <rect x="6" y="11" width="4" height="1" fill="#a66c4a" />
          
          {/* Knob */}
          <rect x="11" y="9" width="1" height="1" fill="#301c10" />
          <rect x="11" y="8" width="1" height="1" fill="#d4a32a" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute",
      left: col * TILE,
      top: row * TILE,
      width: TILE,
      height: TILE,
      zIndex: 1, // Floor level
      display: "flex",
      alignItems: "flex-end", // Align to the bottom of the tile
      justifyContent: "center",
      pointerEvents: "none",
    }}>
      {/* Pixel-art doormat / exit rug */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "60%", // Covers the bottom portion of the gap
        background: "#b84545", // Reddish-brown mat color
        borderTop: "2px solid #732222",
        borderLeft: "2px solid #732222",
        borderRight: "2px solid #732222",
        boxSizing: "border-box",
        // No bottom border so it feels like it continues out of the room
      }}>
        {/* Subtle inner pattern/texture for the mat */}
        <div style={{
          position: "absolute",
          inset: "2px 2px 0 2px",
          background: "rgba(0,0,0,0.1)",
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        }} />
      </div>
    </div>
  );
}
