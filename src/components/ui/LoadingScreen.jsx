"use client";
import { useState, useEffect, memo } from "react";

/* ─── Pixel-art loading screen ───────────────────────────────────────
   Pure CSS/JSX — no images. Matches the game's retro aesthetic.
   Shows while fonts + assets load, then fades out.                   */

const BAR_BLOCKS = 10;

export default function LoadingScreenWrapper({ ready, onDone }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (ready && !fadeOut) {
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
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(212,175,55,0.3)); }
          50% { filter: drop-shadow(0 0 16px rgba(212,175,55,0.6)); }
        }
        @keyframes subtitleFade {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes compassSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>

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

      {/* Decorative twinkling dots */}
      {[
        { left: "15%", top: "20%", delay: "0s", dur: "3s" },
        { left: "80%", top: "15%", delay: "1.2s", dur: "4s" },
        { left: "10%", top: "70%", delay: "0.5s", dur: "3.5s" },
        { left: "85%", top: "65%", delay: "2s", dur: "2.8s" },
        { left: "50%", top: "10%", delay: "0.8s", dur: "3.2s" },
        { left: "25%", top: "80%", delay: "1.5s", dur: "4.2s" },
        { left: "70%", top: "85%", delay: "0.3s", dur: "3.8s" },
      ].map((s, i) => (
        <div key={i} style={{
          position: "absolute", left: s.left, top: s.top,
          width: 2, height: 2, background: "#d4af37", borderRadius: "50%",
          animation: `starTwinkle ${s.dur} ease-in-out ${s.delay} infinite`,
          pointerEvents: "none", zIndex: 1,
        }} />
      ))}

      {/* ═══ MAIN LOGO BLOCK ═══ */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        zIndex: 2,
        marginBottom: 48,
        transform: "scale(1.2)",
        position: "relative"
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 300, height: 100, background: "radial-gradient(ellipse, rgba(212,175,55,0.15) 0%, transparent 70%)",
          zIndex: 0, pointerEvents: "none", animation: "logoGlow 4s ease-in-out infinite"
        }} />

        {/* Pixel Art Compass/Star */}
        <div style={{
          position: "absolute", top: -16, right: -16, zIndex: 3,
          animation: "floatBoat 6s ease-in-out infinite"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))" }}>
            <polygon points="12,0 14,10 12,8 10,10" fill="#ffd700" />
            <polygon points="12,24 14,14 12,16 10,14" fill="#b8860b" />
            <polygon points="24,12 14,14 16,12 14,10" fill="#ffd700" />
            <polygon points="0,12 10,14 8,12 10,10" fill="#b8860b" />
            <rect x="11" y="11" width="2" height="2" fill="#fff" />
          </svg>
        </div>

        {/* ── "saad-ibra's" ── */}
        <div style={{
          fontFamily: "'Micro 5', monospace",
          fontSize: 30,
          letterSpacing: 2,
          color: "#d4af37", // Warm gold
          textShadow: "1px 1px 0 #000, 2px 2px 0 #222",
          marginBottom: -4,
          marginLeft: 4,
          zIndex: 3,
          textTransform: "lowercase",
        }}>
          saad-ibra's
        </div>

        {/* ── "Nomad's Land" ── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}>
          <div style={{
            fontFamily: "'Micro 5', monospace",
            fontSize: 48,
            letterSpacing: 4,
            color: "#f4f0e6", // Off-white
            textShadow:
              "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, " +
              "0 4px 0 #8b6914, " + // Gold 3D extrusion
              "0 5px 0 #6b5010, " +
              "0 6px 0 #4a3800, " +
              "0 8px 24px rgba(212,175,55,0.4)", // Golden glow drop shadow
            lineHeight: 1.1,
            textAlign: "center",
          }}>
            Nomad's<br/>Land
          </div>
        </div>
      </div>

      {/* Animated progress bar */}
      <ProgressBar />

      {/* Loading text */}
      <div
        style={{
          fontFamily: "'Micro 5', monospace",
          fontSize: 24,
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
