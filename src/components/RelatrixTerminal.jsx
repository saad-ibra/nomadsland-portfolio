import React from 'react';

const TILE = 32;

export default function RelatrixTerminal({ station, isNear }) {
  const active = isNear;
  const glow = "#f06292"; // visual pink
  const zIdx = station.row * 10;
  
  return (
    <div style={{
      position: "absolute",
      left: station.col * TILE + 2,
      top: (station.row - 1) * TILE + 8, // Taller structure
      width: TILE - 4, height: TILE * 2 - 8,
      zIndex: zIdx,
      cursor: "pointer",
    }}>
      {active && (
        <div style={{
          position: "absolute", inset: -3,
          border: `2px solid ${glow}`,
          borderRadius: 8,
          boxShadow: `0 0 12px ${glow}`,
          pointerEvents: "none",
          zIndex: zIdx + 2,
        }} />
      )}
      
      {/* Relatrix Mainframe Pod */}
      <div style={{
        width: "100%", height: "100%",
        background: "linear-gradient(180deg, #1c202a 0%, #0d111a 100%)",
        border: "2px solid #2a3441",
        borderRadius: "8px 8px 4px 4px",
        display: "flex", flexDirection: "column", alignItems: "center",
        boxShadow: "inset 0 4px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.8)",
        overflow: "hidden", position: "relative"
      }}>
        {/* Glass Dome */}
        <div style={{
          width: "80%", height: "35%", marginTop: "10%",
          background: "rgba(240, 98, 146, 0.15)", // pinkish fluid
          border: "2px solid rgba(240, 98, 146, 0.4)",
          borderRadius: "50% 50% 10% 10%",
          position: "relative",
          overflow: "hidden",
          boxShadow: "inset 0 0 8px rgba(240, 98, 146, 0.8)"
        }}>
          {/* Floating brain / neural core */}
          <div style={{
            position: "absolute", left: "20%", top: "20%", right: "20%", bottom: "20%",
            background: "radial-gradient(circle, #f06292 0%, #e91e63 100%)",
            borderRadius: "40%",
            animation: "floatBoat 3s ease-in-out infinite",
            boxShadow: "0 0 10px #f06292"
          }} />
          {/* Bubbles */}
          <div style={{ position: "absolute", bottom: 2, left: 4, width: 2, height: 2, background: "#fff", borderRadius: "50%", animation: "dialogBlink 1.5s infinite" }} />
          <div style={{ position: "absolute", bottom: 6, right: 6, width: 3, height: 3, background: "#fff", borderRadius: "50%", animation: "dialogBlink 2.2s infinite" }} />
        </div>
        
        {/* Data lines */}
        <div style={{ width: "60%", height: 2, background: "#2a3441", marginTop: "15%" }} />
        <div style={{ width: "40%", height: 2, background: "#2a3441", marginTop: "5%" }} />
        
        {/* Active light */}
        <div style={{
          position: "absolute", bottom: 6, width: 6, height: 2,
          background: "#4dd0e1",
          boxShadow: "0 0 4px #4dd0e1",
          animation: "dialogBlink 0.8s infinite"
        }} />
      </div>
    </div>
  );
}
