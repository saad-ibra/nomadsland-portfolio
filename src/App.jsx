import { useState, useEffect, useRef } from 'react';
import VillageScene from './scenes/VillageScene.jsx';
import LibraryScene from './scenes/LibraryScene.jsx';
import ChemistryLabScene from './scenes/ChemistryLabScene.jsx';
import NewsroomScene from './scenes/NewsroomScene.jsx';
import NomadshomeScene from './scenes/NomadshomeScene.jsx';
import MusicRoomScene from './scenes/MusicRoomScene.jsx';
import SceneTransition from './components/ui/SceneTransition.jsx';
import LoadingScreen from './components/ui/LoadingScreen.jsx';
import './App.css';

import { getSharedAudioCtx, playTransition } from './engine/sfx.js';

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
  const [appReady, setAppReady] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  useEffect(() => {
    // Wait for fonts and load event
    const handleReady = () => setAppReady(true);
    
    // Ensure we wait at least 1.5 seconds so the loading screen is visible
    const minTimePromise = new Promise(resolve => setTimeout(resolve, 1500));
    const readyPromise = new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve);
    });
    const fontsPromise = document.fonts ? document.fonts.ready : Promise.resolve();

    Promise.all([minTimePromise, readyPromise, fontsPromise]).then(handleReady);
  }, []);

  const [scene, setScene] = useState(() => localStorage.getItem("currentScene") || 'nomadshome');
  const [previousScene, setPreviousScene] = useState(null);
  const transitionRef = useRef(null);

  // Global Audio & Speed State
  const [speedMultiplier, setSpeedMultiplier] = useState(() => parseFloat(localStorage.getItem("speedMultiplier") || "1"));
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicMuted, setMusicMuted] = useState(() => JSON.parse(localStorage.getItem("musicMuted") || "false"));
  const [musicVolume, setMusicVolume] = useState(() => parseFloat(localStorage.getItem("musicVolume") || "0.1"));

  const [isTabActive, setIsTabActive] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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

  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTransitioningRef = useRef(false);

  const triggerTransition = (callback) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);
    
    playTransition();
    if (transitionRef.current) {
      transitionRef.current.play(callback);
    } else {
      callback();
    }
    
    setTimeout(() => {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }, 1000);
  };

  const changeScene = (newScene) => {
    triggerTransition(() => {
      setPreviousScene(scene);
      localStorage.removeItem(`pos_${newScene}`);
      localStorage.setItem("currentScene", newScene);
      setScene(newScene);
    });
  };

  const sceneProps = {
    speedMultiplier, setSpeedMultiplier,
    musicPlaying: musicPlaying && isTabActive, 
    setMusicPlaying,
    musicMuted, setMusicMuted,
    musicVolume, setMusicVolume,
    isLandscape,
    triggerTransition,
    isTransitioning
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
