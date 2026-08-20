"use client";
import { useState, useEffect, memo } from "react";

/* ─── Pixel-art loading screen ───────────────────────────────────────
   Pure CSS/JSX — no images. Matches the game's retro aesthetic.
   Shows while fonts + assets load, then fades out.                   */

const BAR_BLOCKS = 10;

const LoadingScreen = memo(function LoadingScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [filledBlocks, setFilledBlocks] = useState(0);

  // Animate the progress bar blocks
  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setFilledBlocks(Math.min(frame, BAR_BLOCKS));
      if (frame >= BAR_BLOCKS) clearInterval(id);
    }, 150);
    return () => clearInterval(id);
  }, []);

  // When parent says we're ready, start fade-out
  useEffect(() => {
    if (fadeOut) {
      const t = setTimeout(() => onDone?.(), 500);
      return () => clearTimeout(t);
    }
  }, [fadeOut, onDone]);

  // Exposed via parent: call setReady(true) to trigger fade
  // We use a simple prop-driven approach instead
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a14",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        imageRendering: "pixelated",
      }}
    >
      {/* Pixel grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(255,255,255,0.015) 7px, rgba(255,255,255,0.015) 8px)," +
            "repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(255,255,255,0.015) 7px, rgba(255,255,255,0.015) 8px)",
          pointerEvents: "none",
        }}
      />

      {/* CRT scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: 48,
          color: "#e8e0d4",
          letterSpacing: 4,
          marginBottom: 40,
          textShadow: "2px 2px 0 #000, -1px -1px 0 #000",
          zIndex: 1,
        }}
      >
        Nomad's Land
      </div>

      {/* Progress bar container */}
      <div
        style={{
          display: "flex",
          gap: 3,
          padding: "6px 8px",
          border: "2px solid #3a3a4a",
          background: "#12121e",
          zIndex: 1,
        }}
      >
        {Array.from({ length: BAR_BLOCKS }, (_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              background: i < filledBlocks ? "#4ade80" : "#1a1a2e",
              border: `1px solid ${i < filledBlocks ? "#22c55e" : "#2a2a3e"}`,
              transition: "background 0.1s, border-color 0.1s",
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: "#6b7280",
          marginTop: 16,
          zIndex: 1,
        }}
      >
        LOADING
        <span style={{ animation: "loadingDots 1.5s step-end infinite" }}>...</span>
      </div>

      {/* Keyframes for blinking dots */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

        @keyframes loadingDots {
          0%, 25%   { content: '.'; }
          25%, 50%  { content: '..'; }
          50%, 75%  { content: '...'; }
          75%, 100% { content: ''; }
        }
      `}</style>
    </div>
  );
});

// Wrapper that manages the ready/fade lifecycle
export default function LoadingScreenWrapper({ ready, onDone }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (ready && !fadeOut) {
      // Small delay so user sees the full bar before fade
      const t = setTimeout(() => setFadeOut(true), 300);
      return () => clearTimeout(t);
    }
  }, [ready, fadeOut]);

  useEffect(() => {
    if (fadeOut) {
      const t = setTimeout(() => onDone?.(), 500);
      return () => clearTimeout(t);
    }
  }, [fadeOut, onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a14",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        imageRendering: "pixelated",
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Pixel grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(255,255,255,0.015) 7px, rgba(255,255,255,0.015) 8px)," +
            "repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(255,255,255,0.015) 7px, rgba(255,255,255,0.015) 8px)",
          pointerEvents: "none",
        }}
      />

      {/* CRT scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 1px, transparent 1px, transparent 2px)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: 48,
          color: "#e8e0d4",
          letterSpacing: 4,
          marginBottom: 40,
          textShadow: "2px 2px 0 #000, -1px -1px 0 #000",
          zIndex: 1,
        }}
      >
        Nomad's Land
      </div>

      {/* Animated progress bar */}
      <ProgressBar />

      {/* Loading text */}
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          color: "#6b7280",
          marginTop: 16,
          zIndex: 1,
        }}
      >
        LOADING...
      </div>
    </div>
  );
}

function ProgressBar() {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setFilled(Math.min(frame, BAR_BLOCKS));
      if (frame >= BAR_BLOCKS) clearInterval(id);
    }, 140);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        padding: "6px 8px",
        border: "2px solid #3a3a4a",
        background: "#12121e",
        zIndex: 1,
      }}
    >
      {Array.from({ length: BAR_BLOCKS }, (_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            background: i < filled ? "#4ade80" : "#1a1a2e",
            border: `1px solid ${i < filled ? "#22c55e" : "#2a2a3e"}`,
            transition: "background 0.1s, border-color 0.1s",
          }}
        />
      ))}
    </div>
  );
}
