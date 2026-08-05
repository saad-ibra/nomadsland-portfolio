import { useState, useEffect } from 'react';
import VillageScene from './scenes/VillageScene.jsx';
import LibraryScene from './scenes/LibraryScene.jsx';
import ChemistryLabScene from './scenes/ChemistryLabScene.jsx';
import NewsroomScene from './scenes/NewsroomScene.jsx';
import NomadshomeScene from './scenes/NomadshomeScene.jsx';
import MusicRoomScene from './scenes/MusicRoomScene.jsx';
import BlogSpace from './components/BlogSpace.jsx';
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

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isBlog = urlParams.get('view') === 'blog';

  if (isBlog) {
    return <BlogSpace />;
  }

  const [scene, setScene] = useState(() => localStorage.getItem("currentScene") || 'nomadshome');
  const [previousScene, setPreviousScene] = useState(null);
  const [fading, setFading] = useState(false);

  // Global Audio & Speed State
  const [speedMultiplier, setSpeedMultiplier] = useState(() => parseFloat(localStorage.getItem("speedMultiplier") || "1"));
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicMuted, setMusicMuted] = useState(() => JSON.parse(localStorage.getItem("musicMuted") || "false"));
  const [musicVolume, setMusicVolume] = useState(() => parseFloat(localStorage.getItem("musicVolume") || "0.1"));

  const [isLandscape, setIsLandscape] = useState(() => window.innerWidth > window.innerHeight && window.innerWidth >= 1024);

  useEffect(() => {
    if (scene === 'village') document.body.style.backgroundColor = '#2060a0';
    else document.body.style.backgroundColor = '#000';
  }, [scene]);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const changeScene = (newScene) => {
    setFading(true);
    setTimeout(() => {
      setPreviousScene(scene);
      localStorage.removeItem(`pos_${newScene}`);
      localStorage.setItem("currentScene", newScene);
      setScene(newScene);
      setFading(false);
    }, 400); // 400ms fade transition
  };

  const sceneProps = {
    speedMultiplier, setSpeedMultiplier,
    musicPlaying, setMusicPlaying,
    musicMuted, setMusicMuted,
    musicVolume, setMusicVolume,
    isLandscape
  };

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
      {/* Global CRT Overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 1px, transparent 1px, transparent 2px)'
      }} />

      {/* Global Fade Overlay */}
      <div style={{
        position: 'fixed', inset: 0, background: '#000', zIndex: 9999, pointerEvents: 'none',
        opacity: fading ? 1 : 0, transition: 'opacity 0.4s ease-in-out'
      }} />

      {scene === 'village' && (
        <VillageScene
          previousScene={previousScene}
          onGoToLibrary={() => changeScene('library')}
          onGoToLab={() => changeScene('lab')}
          onGoToNewsroom={() => changeScene('newsroom')}
          onGoToNomadshome={() => changeScene('nomadshome')}
          onGoToMusicRoom={() => changeScene('musicroom')}
          {...sceneProps}
        />
      )}
      {scene === 'library' && (
        <LibraryScene onBackToVillage={() => changeScene('village')} {...sceneProps} />
      )}
      {scene === 'lab' && (
        <ChemistryLabScene onBackToVillage={() => changeScene('village')} {...sceneProps} />
      )}
      {scene === 'newsroom' && (
        <NewsroomScene onBackToVillage={() => changeScene('village')} {...sceneProps} />
      )}
      {scene === 'nomadshome' && (
        <NomadshomeScene onBackToVillage={() => changeScene('village')} {...sceneProps} />
      )}
      {scene === 'musicroom' && (
        <MusicRoomScene 
          onBackToVillage={() => changeScene('village')} 
          onGoToNomadshome={() => changeScene('nomadshome')}
          {...sceneProps} 
        />
      )}
    </div>
  );
}

export default App;
