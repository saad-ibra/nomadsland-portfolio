import { TILE } from '../../engine/constants';

export default function ExitDoor({ col, row }) {
  return (
    <div style={{
      position: "absolute", left: col * TILE, top: row * TILE, width: TILE, height: TILE,
      background: "#8b2222", border: "2px solid #3a1c1c", borderRadius: 2,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: row * 10,
      boxShadow: "inset 0 0 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)"
    }}>
      {/* Pattern on the rug */}
      <div style={{ width: TILE-8, height: TILE-8, border: "1px dashed #d4af37", opacity: 0.6 }} />
    </div>
  );
}
