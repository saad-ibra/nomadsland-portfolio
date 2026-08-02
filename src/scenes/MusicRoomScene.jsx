import React from 'react';

/**
 * Placeholder for Music Room
 * 
 * A turntable or mixing desk as the central interactive object
 * Two sections: Favorites (a shelf/crate of album art you click through) and Now Learning (a notebook or chalkboard-style log you manually update, similar pattern to Newsroom)
 * Since it updates like Newsroom, could literally reuse that same manual-post data structure/component pattern, just re-skinned
 */
export default function MusicRoomScene({ onBackToLibrary }) {
  return (
    <div style={{ color: 'white', padding: 20, fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
      <h1>Music Room (Under Construction)</h1>
      <p>Central Turntable & Mixing Desk</p>
      <button onClick={onBackToLibrary} style={{ marginTop: 20, cursor: 'pointer' }}>Back to Library</button>
    </div>
  );
}
