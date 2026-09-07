import React from 'react';

export default function RelatrixModal({ onClose }) {
  const accent = "#f06292"; // pink
  
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100000
    }} onClick={onClose}>
      <div style={{
        width: 240, maxWidth: "90%",
        background: "#0a1218", border: "4px solid #eef7f2", borderRadius: 2,
        boxShadow: `0 0 0 2px #0a1218, 0 0 0 6px ${accent}, 0 12px 32px rgba(0,0,0,0.95)`,
        color: "#fff", display: "flex", flexDirection: "column",
        textAlign: "center", overflow: "hidden"
      }} onClick={e => e.stopPropagation()}>
        
        {/* Modal header */}
        <div style={{
          padding: "8px 12px",
          background: accent,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 12.5, color: "#fff", display: "flex", alignItems: "center", gap: 6, fontWeight: "bold" }}>
            Relatrix
          </div>
          <button onClick={onClose} style={{
            fontFamily: "'Micro 5', monospace", fontSize: 12,
            background: "#c03030", color: "#fff", border: "2px solid #eef7f2",
            padding: "2px 5px", borderRadius: 2, cursor: "pointer",
          }}>X</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <img 
            src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
            alt="Relatrix Logo" 
            style={{ width: 48, height: 48, borderRadius: 8 }} 
          />
          <p style={{ color: "#90b8c8", fontSize: 9.5, lineHeight: "11px", margin: 0 }}>
            A 3D spatial knowledge base.
          </p>
          <button 
            onClick={() => window.open('/relatrix/', '_blank')}
            style={{
              padding: "6px 12px", background: accent, color: "#fff",
              border: "2px solid #eef7f2", borderRadius: 2,
              cursor: "pointer", width: "100%", fontSize: 14, fontFamily: "'Micro 5', monospace",
              textTransform: "uppercase", marginTop: 4
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
