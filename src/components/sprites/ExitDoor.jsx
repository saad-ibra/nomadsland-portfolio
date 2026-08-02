import { TILE } from '../../engine/constants';

export default function ExitDoor({ col, row }) {
  return (
    <div style={{
      position: "absolute", left: col * TILE, top: row * TILE, width: TILE, height: TILE,
      background: "#3a2210", border: "2px solid #201008", borderRadius: "4px 4px 0 0",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: row * 10,
      boxShadow: "inset 0 4px 0 rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.6)"
    }}>
      <div style={{ position: "absolute", right: 4, top: "50%", width: 3, height: 3, background: "#d4af37", borderRadius: "50%" }} />
      <div style={{
        position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
        fontSize: 5, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "2px 4px",
        borderRadius: 2, pointerEvents: "none", fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap"
      }}>
        EXIT
      </div>
    </div>
  );
}
