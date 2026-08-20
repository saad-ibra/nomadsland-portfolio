import { useState, useEffect, useCallback } from "react";
import { renderControlText, DIALOG_KEYFRAMES } from "../../utils/renderControls";

/**
 * DialogueBox - Reusable retro RPG dialogue overlay.
 *
 * Props:
 *   lines      - string[] of dialogue lines
 *   lineIndex  - current line index
 *   onAdvance  - called when SPACE/A pressed (go to next line)
 *   onDismiss  - called when conversation ends or ESC pressed
 *   speaker    - name badge text (default "SAAD IBRA"), null to hide badge
 *   portrait   - portrait image src (default "/favicon.svg"), null to hide
 *   theme      - color theme string: "home"|"village"|"library"|"lab"|"newsroom"|"music"
 *   lastButtonLabel - label for the dismiss button on the final line (default "GOT IT")
 */

const THEMES = {
  home: {
    bg: "rgba(40,25,15,0.95)",
    border: "2px solid #f4e8d0",
    innerShadow: "inset 0 0 0 2px rgba(40,25,15,0.95), inset 0 0 0 4px #6a4a2e",
    speakerBg: "#5C4033",
    speakerBorder: "2px solid #f4e8d0",
    speakerColor: "#f4e8d0",
    textColor: "#f4e8d0",
    btnBg: "#8B5A2B",
    btnColor: "#fff",
    btnShadow: "0 3px 0 #3E2723",
    hintBg: "rgba(0,0,0,0.2)",
    hintColor: "#cdb99c",
    keycapBg: "#6a4a2e",
    keycapBorder: "#f4e8d0",
    keycapText: "#f8d878",
    keycapShadow: "#3E2723",
    cornerColor: "#f4e8d0",
  },
  village: {
    bg: "#f8f8f8",
    border: "2px solid #302820",
    innerShadow: "0 6px 0 rgba(0,0,0,0.3)",
    speakerBg: "#d84040",
    speakerBorder: "2px solid #302820",
    speakerColor: "#fff",
    textColor: "#302820",
    btnBg: "#408ad8",
    btnColor: "#fff",
    btnShadow: "0 2px 0 #302820",
    hintBg: "rgba(255,255,255,0.4)",
    hintColor: "#302820",
    keycapBg: "#302820",
    keycapBorder: "#504030",
    keycapText: "#fff",
    keycapShadow: "#1a1410",
    cornerColor: "#302820",
  },
  library: {
    bg: "rgba(10,10,20,0.94)",
    border: "2px solid #f4e8d0",
    innerShadow: "inset 0 0 0 2px rgba(10,10,20,0.94), inset 0 0 0 4px #888",
    speakerBg: "#1a1a28",
    speakerBorder: "2px solid #f4e8d0",
    speakerColor: "#f8d878",
    textColor: "#f4e8d0",
    btnBg: "#4a3020",
    btnColor: "#f4e8d0",
    btnShadow: "0 3px 0 #201008",
    hintBg: "rgba(0,0,0,0.2)",
    hintColor: "#a8a080",
    keycapBg: "#2a2a40",
    keycapBorder: "#f4e8d0",
    keycapText: "#f8d878",
    keycapShadow: "#0a0a18",
    cornerColor: "#f4e8d0",
  },
  lab: {
    bg: "rgba(6,10,14,0.97)",
    border: "2px solid #eef7f2",
    innerShadow: "inset 0 0 0 4px #162e4c",
    speakerBg: "#0c1e2e",
    speakerBorder: "2px solid #eef7f2",
    speakerColor: "#80c8a0",
    textColor: "#eef7f2",
    btnBg: "#1a5a3a",
    btnColor: "#fff",
    btnShadow: "0 3px 0 #0a3020",
    hintBg: "rgba(0,0,0,0.2)",
    hintColor: "#a8e8a8",
    keycapBg: "#0c2e1e",
    keycapBorder: "#80c8a0",
    keycapText: "#a8e8a8",
    keycapShadow: "#041810",
    cornerColor: "#eef7f2",
  },
  newsroom: {
    bg: "#fff",
    border: "4px solid #000",
    innerShadow: "none",
    speakerBg: "#000",
    speakerBorder: "2px solid #fff",
    speakerColor: "#fff",
    textColor: "#000",
    btnBg: "#000",
    btnColor: "#fff",
    btnShadow: "4px 4px 0 #888",
    hintBg: "#fff",
    hintColor: "#000",
    keycapBg: "#000",
    keycapBorder: "#555",
    keycapText: "#fff",
    keycapShadow: "#333",
    cornerColor: "#000",
  },
  music: {
    bg: "rgba(20,10,10,0.95)",
    border: "2px solid #DAA520",
    innerShadow: "inset 0 0 0 2px rgba(20,10,10,0.95), inset 0 0 0 4px #4a2020",
    speakerBg: "#8B0000",
    speakerBorder: "2px solid #DAA520",
    speakerColor: "#DAA520",
    textColor: "#fff",
    btnBg: "#8B0000",
    btnColor: "#fff",
    btnShadow: "0 3px 0 #4a0000",
    hintBg: "rgba(0,0,0,0.2)",
    hintColor: "#DAA520",
    keycapBg: "#4a1010",
    keycapBorder: "#DAA520",
    keycapText: "#DAA520",
    keycapShadow: "#2a0808",
    cornerColor: "#DAA520",
  },
};

/** Build an inline keycap style from a theme's keycap colors */
function keycapStyle(t) {
  return {
    display: "inline-block",
    background: t.keycapBg,
    border: `1px solid ${t.keycapBorder}`,
    borderBottomWidth: 2,
    borderBottomColor: t.keycapShadow,
    padding: "1px 4px",
    borderRadius: 2,
    fontFamily: "'Micro 5', monospace",
    color: t.keycapText,
    boxShadow: `0 1px 0 ${t.keycapShadow}`,
    margin: "0 2px",
    whiteSpace: "nowrap",
    animation: "keycapGlow 2s ease-in-out infinite",
  };
}

function useTypewriter(text, speed = 24) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const skipToEnd = () => {
    setShown(text);
    setDone(true);
  };

  return { shown, done, skipToEnd };
}

export default function DialogueBox({
  lines,
  lineIndex = 0,
  onAdvance,
  onDismiss,
  speaker = "SAAD IBRA",
  portrait = "/favicon.svg",
  theme = "home",
  lastButtonLabel = "GOT IT",
}) {
  const t = THEMES[theme] || THEMES.home;
  const currentLine = lines[lineIndex] || "";
  const isLastLine = lineIndex >= lines.length - 1;
  const { shown, done, skipToEnd } = useTypewriter(currentLine);
  const kcStyle = keycapStyle(t);

  const handleAction = useCallback(() => {
    if (!done) {
      skipToEnd();
      return;
    }
    if (isLastLine) {
      if (onDismiss) onDismiss();
    } else {
      if (onAdvance) onAdvance();
    }
  }, [done, isLastLine, onDismiss, onAdvance, skipToEnd]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") {
        e.preventDefault();
        e.stopPropagation();
        handleAction();
      } else if (k === "escape") {
        e.preventDefault();
        e.stopPropagation();
        if (onDismiss) onDismiss();
      }
    };
    // Use capture phase to prevent other elements (like player movement) from handling the event
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handleAction, onDismiss]);

  return (
    <>
      <style>{DIALOG_KEYFRAMES}</style>
      <div style={{
        position: "absolute", top: 16, left: 8, right: 8,
        padding: "18px 14px 10px",
        background: t.bg, border: t.border, borderRadius: 2,
        boxShadow: t.innerShadow,
        zIndex: 650,
        animation: "dialogSlideIn 0.3s ease-out",
      }}>
        {/* Corner decorations */}
        <div style={{ position: "absolute", top: 3, right: 3, width: 4, height: 4, borderRight: `2px solid ${t.cornerColor}`, borderTop: `2px solid ${t.cornerColor}`, opacity: 0.35, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 3, left: 3, width: 4, height: 4, borderLeft: `2px solid ${t.cornerColor}`, borderBottom: `2px solid ${t.cornerColor}`, opacity: 0.35, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 3, right: 3, width: 4, height: 4, borderRight: `2px solid ${t.cornerColor}`, borderBottom: `2px solid ${t.cornerColor}`, opacity: 0.35, pointerEvents: "none" }} />

        {/* Speaker badge */}
        {speaker && (
          <div style={{
            position: "absolute", top: -12, left: portrait ? 54 : 10,
            background: t.badgeBg || t.speakerBg || "#d84040", border: t.border || t.speakerBorder,
            padding: "2px 8px", fontSize: 14, color: t.badgeColor || t.speakerColor || "#fff", borderRadius: 2,
          }}>
            {speaker}
          </div>
        )}

        {/* Content: portrait + text */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {portrait && (
            <img src={portrait} alt="" draggable={false} style={{
              width: 30, height: 30, minWidth: 30,
              imageRendering: "pixelated",
              borderRadius: 2,
              marginTop: 1,
            }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Text with typewriter cursor and styled keycaps */}
            <div style={{ fontSize: 16, lineHeight: 2.2, minHeight: 32, color: t.textColor }}>
              {renderControlText(shown, kcStyle)}
              <span style={{
                opacity: done ? 0 : 1,
                animation: "dialogBlink 0.5s step-end infinite",
              }}>&#x258A;</span>
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              {!isLastLine && (
                <button
                  onPointerDown={(e) => { e.preventDefault(); if (onDismiss) onDismiss(); }}
                  style={{
                    fontFamily: "'Micro 5', monospace", fontSize: 14,
                    background: t.btnBg, color: t.btnColor, border: "none",
                    padding: "8px 14px", borderRadius: 2, cursor: "pointer",
                    boxShadow: t.btnShadow, display: "flex", alignItems: "center", opacity: 0.8
                  }}
                >
                  <span style={{
                    fontSize: 10, color: t.hintColor, marginRight: 8,
                    background: t.hintBg, padding: "2px 4px", borderRadius: 2,
                  }}>ESC/B</span>
                  SKIP
                </button>
              )}
              <button
                onPointerDown={(e) => { e.preventDefault(); handleAction(); }}
                style={{
                  fontFamily: "'Micro 5', monospace", fontSize: 14,
                  background: t.btnBg, color: t.btnColor, border: "none",
                  padding: "8px 14px", borderRadius: 2, cursor: "pointer",
                  boxShadow: t.btnShadow, display: "flex", alignItems: "center",
                }}
              >
                <span style={{
                  fontSize: 10, color: t.hintColor, marginRight: 8,
                  background: t.hintBg, padding: "2px 4px", borderRadius: 2,
                }}>SPACE/A</span>
                {done && isLastLine ? lastButtonLabel : done ? "NEXT" : "FAST"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
