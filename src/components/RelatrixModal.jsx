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
        width: 300, maxWidth: "95%",
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
          <div style={{ fontSize: 16, color: "#fff", display: "flex", alignItems: "center", gap: 6, fontWeight: "bold" }}>
            Relatrix Protocol
          </div>
          <button onClick={onClose} style={{
            fontSize: 14, fontWeight: "bold",
            background: "#c03030", color: "#fff", border: "2px solid #eef7f2",
            padding: "2px 8px", borderRadius: 2, cursor: "pointer",
          }}>X</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img 
            src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
            alt="Relatrix Logo" 
            style={{ width: 64, height: 64, borderRadius: 12, marginBottom: 16 }} 
          />
          <p style={{ color: "#a0a0a0", fontSize: 14, marginBottom: 20, lineHeight: 1.4 }}>
            Initialize the neural link to access the Gray Matter tutorial.
          </p>
          <button 
            onClick={() => window.location.href = '/relatrix/'}
            style={{
              padding: "10px 20px", background: accent, color: "#fff",
              border: "2px solid #eef7f2", borderRadius: 2, fontWeight: "bold",
              cursor: "pointer", width: "100%", fontSize: 16,
              textTransform: "uppercase"
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
