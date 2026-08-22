import { useState, useEffect } from 'react';
import VillageScene from './scenes/VillageScene.jsx';
import LibraryScene from './scenes/LibraryScene.jsx';
import ChemistryLabScene from './scenes/ChemistryLabScene.jsx';
import NewsroomScene from './scenes/NewsroomScene.jsx';
import NomadshomeScene from './scenes/NomadshomeScene.jsx';
import MusicRoomScene from './scenes/MusicRoomScene.jsx';
import SceneTransition from './components/ui/SceneTransition.jsx';
import LoadingScreen from './components/ui/LoadingScreen.jsx';
import { GameProvider, useGame } from './context/GameContext.jsx';
import './App.css';

import { getSharedAudioCtx } from './engine/sfx.js';

// ---- Global AudioContext unlock ----
// Browsers block audio until the first user gesture. This ensures the
// AudioContext is created and resumed the instant the user taps/clicks
// ANYTHING on the page — so music plays immediately from the first scene.
let _globalAudioUnlocked = false;
function unlockGlobalAudio() {
  if (_globalAudioUnlocked) return;
  _globalAudioUnlocked = true;
  try {
    const ctx = getSharedAudioCtx();
    // Create a silent buffer and play it to fully unlock on iOS
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    // Do NOT close the ctx; it is now shared by the whole app!
  } catch (e) { /* ignore */ }
  // Remove all listeners after first unlock
  ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(evt =>
    window.removeEventListener(evt, unlockGlobalAudio, true)
  );
}
['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(evt =>
  window.addEventListener(evt, unlockGlobalAudio, true)
);

// Pause all audio when tab is backgrounded
document.addEventListener("visibilitychange", () => {
  try {
    const ctx = getSharedAudioCtx();
    if (document.hidden) {
      ctx.suspend();
    } else if (_globalAudioUnlocked) {
      ctx.resume();
    }
  } catch (e) { /* ignore */ }
});

function AppShell() {
  const { scene, transitionRef } = useGame();

  const [appReady, setAppReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  useEffect(() => {
    const handleReady = () => setAppReady(true);
    const minTimePromise = new Promise(resolve => setTimeout(resolve, 1500));
    const readyPromise = new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve);
    });
    const fontsPromise = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.all([minTimePromise, readyPromise, fontsPromise]).then(handleReady);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a14',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      position: 'relative'
    }}>
      {/* Loading Screen Overlay */}
      {showLoadingScreen && (
        <LoadingScreen 
          ready={appReady} 
          onDone={() => setShowLoadingScreen(false)} 
        />
      )}

      {/* Global CRT Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 1px, transparent 1px, transparent 2px)'
      }} />

      {/* Pixelated Iris-Wipe Transition */}
      <SceneTransition ref={transitionRef} />

      {scene === 'village' && <VillageScene />}
      {scene === 'library' && <LibraryScene />}
      {scene === 'lab' && <ChemistryLabScene />}
      {scene === 'newsroom' && <NewsroomScene />}
      {scene === 'nomadshome' && <NomadshomeScene />}
      {scene === 'musicroom' && <MusicRoomScene />}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}

export default App;
