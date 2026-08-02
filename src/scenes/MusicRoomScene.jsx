import React from 'react';

export default function MusicRoomScene({ onBackToVillage }) {
  return (
    <div style={{ color: 'white', padding: 20, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
      <h1>Music Room (Under Construction)</h1>
      <p>Central Turntable & Mixing Desk</p>
      <button onClick={onBackToVillage} style={{ marginTop: 20, cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", fontSize: 8, background: '#6a4a30', color: '#e8d8c0', border: 'none', padding: '8px 14px', borderRadius: 2 }}>VILLAGE</button>
    </div>
  );
}
