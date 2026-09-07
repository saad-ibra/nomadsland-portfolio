import React from 'react';

export default function RelatrixModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100000
    }} onClick={onClose}>
      <div style={{
        width: 320, padding: 24,
        background: "linear-gradient(180deg, #1c202a 0%, #0d111a 100%)",
        border: "2px solid #2a3441", borderRadius: 16,
        color: "#fff", display: "flex", flexDirection: "column", alignItems: "center",
        boxShadow: "0 10px 40px rgba(240, 98, 146, 0.2)",
        textAlign: "center"
      }} onClick={e => e.stopPropagation()}>
        <img 
          src="https://raw.githubusercontent.com/saad-ibra/gray-matter/main/core/designsystem/src/main/res/drawable/app_logo_full.png" 
          alt="Relatrix Logo" 
          style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 16 }} 
        />
        <h2 style={{ margin: "0 0 8px 0", color: "#f06292", fontFamily: "sans-serif" }}>Relatrix Protocol</h2>
        <p style={{ color: "#a0a0a0", fontSize: 14, marginBottom: 24, fontFamily: "sans-serif" }}>
          Initialize the neural link to access the Gray Matter tutorial and repository links.
        </p>
        <button 
          onClick={() => window.location.href = '/relatrix/'}
          style={{
            padding: "12px 24px", background: "#f06292", color: "#fff",
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
