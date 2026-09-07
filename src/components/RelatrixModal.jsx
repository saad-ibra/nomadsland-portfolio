import React from 'react';

export default function RelatrixModal({ onClose }) {
  const glow = "#8E9E5A";
  
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100000
    }} onClick={onClose}>
      <div style={{
        width: 260, padding: 20,
        background: "linear-gradient(180deg, #16161a 0%, #0d0d0f 100%)",
        border: "1px solid #2a2a35", borderRadius: 12,
        color: "#fff", display: "flex", flexDirection: "column", alignItems: "center",
        boxShadow: `0 10px 40px rgba(142, 158, 90, 0.15)`,
        textAlign: "center"
      }} onClick={e => e.stopPropagation()}>
        <img 
          src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
          alt="Relatrix Logo" 
          style={{ width: 64, height: 64, borderRadius: 12, marginBottom: 16 }} 
        />
        <h2 style={{ margin: "0 0 8px 0", color: glow, fontSize: 20 }}>Relatrix Protocol</h2>
        <p style={{ color: "#a0a0a0", fontSize: 14, marginBottom: 20, lineHeight: 1.4 }}>
          Initialize the neural link to access the Gray Matter tutorial.
        </p>
        <button 
          onClick={() => window.location.href = '/relatrix/'}
          style={{
            padding: "10px 20px", background: glow, color: "#000",
            border: "none", borderRadius: 8, fontWeight: "bold",
            cursor: "pointer", width: "100%", fontSize: 16
          }}
        >
          Go to Website
        </button>
      </div>
    </div>
  );
}
