import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { playTransition } from '../engine/sfx.js';

const GameContext = createContext();

export function GameProvider({ children }) {
  // ── Audio & Speed State (persisted to localStorage) ──
  const [speedMultiplier, setSpeedMultiplier] = useState(
    () => parseFloat(localStorage.getItem("speedMultiplier") || "1")
  );
  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicMuted, setMusicMuted] = useState(
    () => JSON.parse(localStorage.getItem("musicMuted") || "false")
  );
  const [musicVolume, setMusicVolume] = useState(
    () => parseFloat(localStorage.getItem("musicVolume") || "0.1")
  );

  // ── Viewport ──
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight && window.innerWidth >= 1024
  );
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [isTabActive, setIsTabActive] = useState(!document.hidden);

  // ── Scene Navigation ──
  const [scene, setScene] = useState(
    () => localStorage.getItem("currentScene") || 'nomadshome'
  );
  const [previousScene, setPreviousScene] = useState(null);

  // ── Transition ──
  const transitionRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isTransitioningRef = useRef(false);

  // ── Centralized localStorage Sync ──
  useEffect(() => {
    localStorage.setItem("speedMultiplier", speedMultiplier);
  }, [speedMultiplier]);

  useEffect(() => {
    localStorage.setItem("musicMuted", JSON.stringify(musicMuted));
  }, [musicMuted]);

  useEffect(() => {
    localStorage.setItem("musicVolume", musicVolume);
  }, [musicVolume]);

  // ── Tab Visibility ──
  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Viewport Resize ──
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Body Background Color ──
  useEffect(() => {
    if (scene === 'village') document.body.style.backgroundColor = '#2060a0';
    else document.body.style.backgroundColor = '#000';
  }, [scene]);

  // ── Transition Logic ──
  const triggerTransition = useCallback((callback) => {
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
  }, []);

  // ── Scene Change ──
  const changeScene = useCallback((newScene) => {
    triggerTransition(() => {
      setPreviousScene(scene);
      localStorage.removeItem(`pos_${newScene}`);
      localStorage.setItem("currentScene", newScene);
      setScene(newScene);
    });
  }, [scene, triggerTransition]);

  return (
    <GameContext.Provider value={{
      speedMultiplier, setSpeedMultiplier,
      musicPlaying: musicPlaying && isTabActive,
      setMusicPlaying,
      musicMuted, setMusicMuted,
      musicVolume, setMusicVolume,
      isLandscape,
      isConsoleMinimized, setIsConsoleMinimized,
      isTransitioning, triggerTransition,
      scene, previousScene, changeScene,
      transitionRef,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
