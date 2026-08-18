import React, { useEffect, useState, memo } from "react";
import { toggleSfxMuted, getSfxMuted } from "../../engine/sfx";

const simulateKey = (key, type) => {
  const e = new KeyboardEvent(type, {
    key: key,
    code: key === " " ? "Space" : key,
    bubbles: true,
    cancelable: true
  });
  window.dispatchEvent(e);
};

const handlePress = (e, keyName) => {
  e.preventDefault();
  if (e.currentTarget.dataset.active === "true") return;
  e.currentTarget.dataset.active = "true";
  simulateKey(keyName, "keydown");
};

const handleRelease = (e, keyName) => {
  e.preventDefault();
  if (e.currentTarget.dataset.active === "true") {
    e.currentTarget.dataset.active = "false";
    simulateKey(keyName, "keyup");
  }
};

const DpadBtn = ({ gridArea, keyName }) => (
  <button
    onPointerDown={(e) => handlePress(e, keyName)}
    onPointerEnter={(e) => {
      if (e.buttons > 0) handlePress(e, keyName);
    }}
    onPointerUp={(e) => handleRelease(e, keyName)}
    onPointerLeave={(e) => handleRelease(e, keyName)}
    onPointerCancel={(e) => handleRelease(e, keyName)}
    onTouchStart={(e) => handlePress(e, keyName)}
    onTouchEnd={(e) => handleRelease(e, keyName)}
    onTouchCancel={(e) => handleRelease(e, keyName)}
    onContextMenu={(e) => e.preventDefault()}
    style={{
      gridArea,
      background: "#1c1c1c",
      border: "none",
      color: "#1c1c1c",
      cursor: "pointer", touchAction: "none",
      WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent",
      borderTopLeftRadius: gridArea === "top" || gridArea === "left" ? 8 : 0,
      borderTopRightRadius: gridArea === "top" || gridArea === "right" ? 8 : 0,
      borderBottomLeftRadius: gridArea === "bottom" || gridArea === "left" ? 8 : 0,
      borderBottomRightRadius: gridArea === "bottom" || gridArea === "right" ? 8 : 0,
      boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)"
    }}
  />
);

const ActionBtn = ({ label, keyName }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <button
      onPointerDown={(e) => handlePress(e, keyName)}
      onPointerEnter={(e) => {
        if (e.buttons > 0) handlePress(e, keyName);
      }}
      onPointerUp={(e) => handleRelease(e, keyName)}
      onPointerLeave={(e) => handleRelease(e, keyName)}
      onPointerCancel={(e) => handleRelease(e, keyName)}
      onTouchStart={(e) => handlePress(e, keyName)}
      onTouchEnd={(e) => handleRelease(e, keyName)}
      onTouchCancel={(e) => handleRelease(e, keyName)}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#9a2a3e",
        border: "none",
        WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent",
        boxShadow: "inset -2px -4px 6px rgba(0,0,0,0.3), inset 2px 4px 6px rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.4)",
        cursor: "pointer", touchAction: "none"
      }}
    />
    <span style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 11, color: "#8a867c", letterSpacing: 1 }}>{label}</span>
  </div>
);

const PillBtn = ({ label, onClick, active }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: "rotate(-15deg)" }}>
    <button
      onPointerDown={(e) => { e.preventDefault(); onClick(); }}
      onTouchStart={(e) => { e.preventDefault(); onClick(); }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: 48, height: 16,
        borderRadius: 8,
        background: active ? "#5a5a5a" : "#7a7a7a",
        border: "none",
        boxShadow: active ? "inset 0 2px 4px rgba(0,0,0,0.5)" : "inset 0 2px 4px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.3)",
        cursor: "pointer", touchAction: "none"
      }}
    />
    <span style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 10, color: "#8a867c", letterSpacing: 1 }}>{label}</span>
  </div>
);

function ControlBarInner({
  musicPlaying,
  musicMuted,
  musicVolume,
  speedMultiplier,
  onTogglePlay,
  onChangeVolume,
  onChangeSpeed
}) {
  const [sfxMuted, setSfxMuted] = useState(() => getSfxMuted());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDesktopLandscape, setIsDesktopLandscape] = useState(window.innerWidth > window.innerHeight && window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsDesktopLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Removed components to top-level scope

  // Per-button stagger for the diagonal A/B layout
  const stagger = isMobile ? 14 : 18;

  return (
    <div style={{
      position: "relative",
      width: isDesktopLandscape ? "320px" : "100%",
      height: isDesktopLandscape ? "100dvh" : (isMobile ? "40dvh" : "33.33dvh"),
      flexShrink: 0,
      background: "#d0d0c0",
      borderTop: isDesktopLandscape ? "none" : "4px solid #b0b0a0",
      borderLeft: isDesktopLandscape ? "4px solid #b0b0a0" : "none",
      boxShadow: "inset 0 8px 12px rgba(255,255,255,0.5)",
      display: "flex", flexDirection: "column",
      padding: isDesktopLandscape ? "48px 32px" : (isMobile ? "24px 16px" : "32px 64px"),
      boxSizing: "border-box",
      zIndex: 10000,
      overflow: "visible",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
      touchAction: "none"
    }}>
      
      {/* Decorative Speaker Lines — always bottom-right, like a real Gameboy */}
      <div style={{
        position: "absolute",
        bottom: isDesktopLandscape ? 32 : (isMobile ? 12 : 24),
        right: isDesktopLandscape ? 32 : (isMobile ? 16 : 24),
        display: "flex", gap: 6,
        transform: "rotate(-15deg)",
        pointerEvents: "none",
        zIndex: 1,
      }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ width: 4, height: 48, background: "#a0a090", borderRadius: 2, boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.3)" }} />
        ))}
      </div>

      <div style={{ 
        display: "flex", 
        flexDirection: isDesktopLandscape ? "column" : "row",
        justifyContent: isDesktopLandscape ? "space-evenly" : "space-between", 
        alignItems: "center", 
        flex: 1, position: "relative", zIndex: 10 
      }}>
        
        {/* D-PAD */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          width: isMobile ? 120 : 160,
          height: isMobile ? 120 : 160,
          flexShrink: 0,
          gridTemplateAreas: `
            ". top ."
            "left center right"
            ". bottom ."
          `,
          filter: "drop-shadow(0 6px 4px rgba(0,0,0,0.2))"
        }}>
          <DpadBtn gridArea="top" keyName="ArrowUp" />
          <DpadBtn gridArea="left" keyName="ArrowLeft" />
          <div style={{ gridArea: "center", background: "#1c1c1c" }} />
          <DpadBtn gridArea="right" keyName="ArrowRight" />
          <DpadBtn gridArea="bottom" keyName="ArrowDown" />
        </div>

        {/* Start / Select Settings */}
        <div style={{ 
          display: "flex", gap: isMobile ? 16 : 16, 
          position: isMobile ? "absolute" : "static",
          bottom: isMobile ? -10 : "auto",
          left: isMobile ? "50%" : "auto",
          transform: isMobile ? "translateX(-50%)" : "none",
          alignSelf: isDesktopLandscape ? "center" : "flex-end", 
          paddingBottom: isDesktopLandscape ? 0 : (isMobile ? 0 : 16)
        }}>
          <PillBtn 
            label={musicMuted || !musicPlaying ? "AUDIO:OFF" : "AUDIO:ON"} 
            onClick={() => {
              const audioWasOff = musicMuted || !musicPlaying;
              onTogglePlay();
              if (audioWasOff && sfxMuted) {
                 setSfxMuted(toggleSfxMuted());
              } else if (!audioWasOff && !sfxMuted) {
                 setSfxMuted(toggleSfxMuted());
              }
            }} 
            active={musicPlaying && !musicMuted}
          />
          <PillBtn 
            label={`SPD:${speedMultiplier}X`} 
            onClick={() => onChangeSpeed(speedMultiplier === 1 ? 1.5 : speedMultiplier === 1.5 ? 2 : 1)}
            active={speedMultiplier > 1}
          />
        </div>

        {/* A / B Buttons — each button rotated individually, no container rotation */}
        <div style={{ 
          display: "flex", gap: isMobile ? 16 : 20,
          alignSelf: isDesktopLandscape ? "center" : "center", 
          flexShrink: 0
        }}>
          <div style={{ transform: `translateY(${stagger}px) rotate(-15deg)` }}>
            <ActionBtn label="B" keyName="Escape" />
          </div>
          <div style={{ transform: `translateY(-${stagger}px) rotate(-15deg)` }}>
            <ActionBtn label="A" keyName=" " />
          </div>
        </div>
      </div>
    </div>
  );
}

const ControlBar = memo(ControlBarInner);
export default ControlBar;
