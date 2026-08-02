import { useEffect, useState } from "react";

export default function ControlBar({
  width,
  musicPlaying,
  musicMuted,
  musicVolume,
  speedMultiplier,
  onTogglePlay,
  onChangeVolume,
  onChangeSpeed
}) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const handleTouch = () => setIsTouch(true);
    window.addEventListener("touchstart", handleTouch, { once: true });
    return () => window.removeEventListener("touchstart", handleTouch);
  }, []);

  const simulateKey = (key, type) => {
    window.dispatchEvent(new KeyboardEvent(type, { key }));
  };

  const ControlBtn = ({ label, keyName, style }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); simulateKey(keyName, "keydown"); }}
      onPointerUp={(e) => { e.preventDefault(); simulateKey(keyName, "keyup"); }}
      onPointerLeave={(e) => { e.preventDefault(); simulateKey(keyName, "keyup"); }}
      style={{
        width: 24, height: 24, background: "#1a1a28", border: "2px solid #eef7f2",
        color: "#eef7f2", fontFamily: "'Press Start 2P', monospace", fontSize: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", borderRadius: 4, userSelect: "none", touchAction: "none",
        ...style
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: width, padding: "6px 10px", boxSizing: "border-box",
      background: "rgba(6,10,14,0.97)", border: "2px solid #eef7f2", borderRadius: 2,
      boxShadow: "inset 0 0 0 4px #162e4c",
      fontSize: 5, marginTop: 8, whiteSpace: "nowrap",
      fontFamily: "'Press Start 2P', monospace"
    }}>
      {/* Settings (Music & Speed) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={onTogglePlay}
            style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 5,
              background: musicPlaying && !musicMuted ? "#1a5a3a" : "#5a1a1a",
              color: "#fff", border: "2px solid #eef7f2",
              padding: "2px 6px", cursor: "pointer", borderRadius: 2,
            }}
          >
            {!musicPlaying ? "♫ PLAY" : musicMuted ? "♫ MUTED" : "♫ ON"}
          </button>
          {musicPlaying && (
            <input
              type="range" min="0" max="1" step="0.05" value={musicVolume}
              onChange={e => onChangeVolume(parseFloat(e.target.value))}
              style={{ width: 36, accentColor: "#eef7f2", cursor: "pointer" }}
            />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ opacity: 0.8 }}>SPEED:</span>
          {[1, 1.5, 2].map(s => (
            <button key={s} onClick={() => onChangeSpeed(s)} style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: 5,
              background: speedMultiplier === s ? "#eef7f2" : "transparent",
              color:      speedMultiplier === s ? "#06090e"  : "#eef7f2",
              border: "2px solid #eef7f2", padding: "2px 4px",
              cursor: "pointer", borderRadius: 2,
            }}>{s}X</button>
          ))}
        </div>
      </div>

      {/* Controls (Instructions / Mobile D-Pad) */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {!isTouch && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, opacity: 0.8, textAlign: "right", fontSize: 5, lineHeight: 1.4 }}>
            <div><span style={{ color: "#d4a520" }}>MOVE:</span> WASD or Arrows</div>
            <div><span style={{ color: "#d4a520" }}>ACTION:</span> Spacebar / Click</div>
          </div>
        )}
        
        {isTouch && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* D-PAD */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
              <div />
              <ControlBtn label="↑" keyName="ArrowUp" />
              <div />
              <ControlBtn label="←" keyName="ArrowLeft" />
              <ControlBtn label="↓" keyName="ArrowDown" />
              <ControlBtn label="→" keyName="ArrowRight" />
            </div>
            {/* ACTION BUTTON */}
            <ControlBtn label="A" keyName=" " style={{ width: 32, height: 32, borderRadius: 16, background: "#8b2222" }} />
          </div>
        )}
      </div>
    </div>
  );
}
