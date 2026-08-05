import React from 'react';

export default function GameBoyBezel({ children }) {
  return (
    <div style={{
        padding: "24px 24px 44px 24px",
        background: "#7b7a85",
        borderRadius: "8px 8px 48px 8px",
        border: "3px solid #333",
        boxShadow: "0 8px 16px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.2)",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 24, left: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
           <div style={{ width: 6, height: 6, background: "#ff0000", borderRadius: "50%", boxShadow: "0 0 6px #ff0000" }} />
           <div style={{ fontSize: 4, color: "#ccc", marginTop: 2, fontFamily: "sans-serif" }}>BATTERY</div>
        </div>
        
        <div style={{ position: "absolute", top: 8, left: 32, right: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: 2, flex: 1, background: "linear-gradient(to right, #800040, #200060)" }} />
          <div style={{ fontSize: 5, color: "#ccc", fontFamily: "sans-serif", margin: "0 8px", letterSpacing: 0.5 }}>DOT MATRIX WITH STEREO SOUND</div>
          <div style={{ height: 2, flex: 1, background: "linear-gradient(to left, #800040, #200060)" }} />
        </div>

        {children}
    </div>
  );
}
