import { TILE } from '../../engine/constants';

/**
 * ExitDoor – rendered as a black square hole cut into the bottom wall.
 * Visually looks like an archway/passage into darkness with a slight depth shadow.
 */
export default function ExitDoor({ col, row }) {
  return (
    <div style={{
      position: "absolute",
      left: col * TILE,
      top: row * TILE,
      width: TILE,
      height: TILE,
      zIndex: row * 10 + 1,
      // The "hole" — pure black interior
      background: "#000",
      // Inset shadow to suggest depth
      boxShadow: "inset 0 4px 8px rgba(0,0,0,0.9), inset 0 -2px 4px rgba(60,60,60,0.3)",
      // Wall-color border on top & sides, none on bottom so it blends into floor
      borderTop: "2px solid #2a1a0e",
      borderLeft: "2px solid #2a1a0e",
      borderRight: "2px solid #2a1a0e",
      borderRadius: "4px 4px 0 0",
    }}>
      {/* Subtle arc highlight at top to suggest a rounded arch */}
      <div style={{
        position: "absolute",
        top: 1,
        left: "50%",
        transform: "translateX(-50%)",
        width: TILE - 6,
        height: 3,
        background: "rgba(255,255,255,0.06)",
        borderRadius: "50%",
      }} />
      {/* Depth gradient — lighter deep grey at top fading to black */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, rgba(30,20,10,0.4) 0%, rgba(0,0,0,0) 60%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
