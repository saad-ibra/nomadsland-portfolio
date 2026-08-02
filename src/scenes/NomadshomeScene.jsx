import React from 'react';

/**
 * Placeholder for Nomadshome
 * 
 * Exterior: small house with lit window, maybe a chimney with idle smoke animation
 * Interaction: walk up, "door opens" → overlay/modal (not a full room map, since it's mostly static content) showing your story, photo, background
 * Low maintenance — no sync needed, unlike Newsroom/Lab
 */
export default function NomadshomeScene({ onBackToLibrary }) {
  return (
    <div style={{ color: 'white', padding: 20, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
      <h1>Nomadshome (Under Construction)</h1>
      <p>Exterior: Small house with lit window</p>
      <button onClick={onBackToLibrary} style={{ marginTop: 20, cursor: 'pointer' }}>Back to Library</button>
    </div>
  );
}
