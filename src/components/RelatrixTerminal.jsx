import React from 'react';

const TILE = 32;

export default function RelatrixTerminal({ station, isNear }) {
  const active = isNear;
  const glow = "#8E9E5A"; // opinion green
  const zIdx = station.row * 10;
  
  return (
    <div style={{
      position: "absolute",
      left: station.col * TILE + 4,
      top: station.row * TILE + 4,
      width: TILE - 8, height: TILE - 8,
      zIndex: zIdx,
      cursor: "pointer",
    }}>
      {active && (
        <div style={{
          position: "absolute", inset: -4,
          border: `2px solid ${glow}`,
          borderRadius: 8,
          boxShadow: `0 0 12px ${glow}`,
          pointerEvents: "none",
          zIndex: zIdx + 2,
        }} />
      )}
      
      {/* Minimal Relatrix Terminal */}
      <div style={{
        width: "100%", height: "100%",
        background: "#111",
        border: `2px solid ${glow}`,
        borderRadius: "4px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 6px rgba(0,0,0,0.5)",
        position: "relative"
      }}>
        <div style={{
          width: "10px", height: "10px",
          background: glow,
          borderRadius: "50%",
          boxShadow: `0 0 8px ${glow}`,
          animation: "dialogBlink 1.5s infinite"
        }} />
      </div>
    </div>
  );
}
