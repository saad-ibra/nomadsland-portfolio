import React from 'react';

export default function NomadshomeScene({ onBackToVillage }) {
  return (
    <div style={{ color: 'white', padding: 20, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
      <h1>Nomadshome (Under Construction)</h1>
      <p>Exterior: Small house with lit window</p>
      <button onClick={onBackToVillage} style={{ marginTop: 20, cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", fontSize: 8, background: '#6a4a30', color: '#e8d8c0', border: 'none', padding: '8px 14px', borderRadius: 2 }}>VILLAGE</button>
    </div>
  );
}
