import React, { useEffect, useState, memo } from "react";
import { toggleSfxMuted, getSfxMuted } from "../../engine/sfx";
import { useGame } from "../../context/GameContext.jsx";

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

const InfoButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 22, height: 22,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
      transition: "transform 0.1s",
      touchAction: "none",
      WebkitUserSelect: "none", userSelect: "none",
    }}
    onPointerDown={e => e.currentTarget.style.transform = "scale(0.92)"}
    onPointerUp={e => e.currentTarget.style.transform = "scale(1)"}
    onPointerLeave={e => e.currentTarget.style.transform = "scale(1)"}
  >
    <svg width="22" height="22" viewBox="0 0 100 100" style={{ display: "block" }}>
      <defs>
        <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0e0e0" />
          <stop offset="50%" stopColor="#9a9a9a" />
          <stop offset="100%" stopColor="#555555" />
        </linearGradient>
        <linearGradient id="metalInset" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a0a0a0" />
          <stop offset="100%" stopColor="#333333" />
        </linearGradient>
        <radialGradient id="blueOrb" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#4fc3f7" />
          <stop offset="60%" stopColor="#0277bd" />
          <stop offset="100%" stopColor="#01436b" />
        </radialGradient>
        <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      
      {/* Outer metal bezel */}
      <circle cx="50" cy="50" r="48" fill="url(#metal)" stroke="#222" strokeWidth="1" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="url(#metalInset)" strokeWidth="5" />
      
      {/* 8 Rivets */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 50 + 42.5 * Math.cos(rad);
        const cy = 50 + 42.5 * Math.sin(rad);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3" fill="#333" />
            <circle cx={cx-0.5} cy={cy-0.5} r="1.8" fill="#111" />
            <path d={`M ${cx-1} ${cy-1} L ${cx+1} ${cy+1}`} stroke="#555" strokeWidth="1" />
          </g>
        );
      })}

      {/* Blue Glass Orb */}
      <circle cx="50" cy="50" r="35" fill="url(#blueOrb)" />
      
      {/* Gloss Highlight */}
      <ellipse cx="50" cy="26" rx="22" ry="12" fill="url(#gloss)" />
      
      {/* Italic 'i' */}
      <text x="50" y="74" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="bold" fontSize="62" fill="#fff" textAnchor="middle" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.4))">
        i
      </text>
    </svg>
  </button>
);

const KeyBadge = ({ children, minWidth, color = "#d0d0c0" }) => (
  <span style={{ 
    display: "inline-block", 
    background: color, 
    color: "#111", 
    padding: "2px 6px", 
    borderRadius: "4px", 
    borderBottom: "3px solid rgba(0,0,0,0.3)",
    borderRight: "2px solid rgba(0,0,0,0.2)",
    marginRight: "8px",
    fontWeight: "bold",
    textAlign: "center",
    minWidth: minWidth || "auto",
    boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.5)",
    verticalAlign: "middle"
  }}>
    {children}
  </span>
);

const IconNewspaper = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="3" width="12" height="10" fill="#e0e0d0" />
    <rect x="3" y="4" width="6" height="2" fill="#888" />
    <rect x="3" y="7" width="10" height="1" fill="#aaa" />
    <rect x="3" y="9" width="10" height="1" fill="#aaa" />
    <rect x="3" y="11" width="6" height="1" fill="#aaa" />
    <rect x="10" y="4" width="3" height="2" fill="#555" />
  </svg>
);

const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
    <rect x="4" y="8" width="8" height="5" rx="1" fill="#c03030" />
    <rect x="6" y="9" width="4" height="3" fill="#a02020" />
    <circle cx="8" cy="10.5" r="1.5" fill="#eef7f2" />
    <rect x="3" y="4" width="10" height="2" rx="1" fill="#c03030" />
    <rect x="2" y="4" width="2" height="3" fill="#a02020" />
    <rect x="12" y="4" width="2" height="3" fill="#a02020" />
  </svg>
);

const IconComputer = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="3" width="12" height="9" rx="1" fill="#c0c0b0" />
    <rect x="3" y="4" width="10" height="6" fill="#111" />
    <rect x="4" y="5" width="3" height="1" fill="#4f4" />
    <rect x="4" y="7" width="1" height="1" fill="#4f4" />
    <rect x="3" y="13" width="10" height="2" fill="#909080" />
  </svg>
);

const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
    <rect x="2" y="3" width="6" height="10" fill="#a05030" />
    <rect x="8" y="3" width="6" height="10" fill="#c06040" />
    <rect x="3" y="4" width="4" height="8" fill="#e0e0d0" />
    <rect x="9" y="4" width="4" height="8" fill="#e0e0d0" />
    <rect x="4" y="5" width="2" height="1" fill="#aaa" />
    <rect x="4" y="7" width="2" height="1" fill="#aaa" />
    <rect x="10" y="5" width="2" height="1" fill="#aaa" />
    <rect x="10" y="7" width="2" height="1" fill="#aaa" />
    <rect x="7" y="3" width="2" height="10" fill="#603010" />
  </svg>
);

const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
    <rect x="3" y="6" width="10" height="7" rx="1" fill="#805030" />
    <rect x="6" y="4" width="4" height="2" fill="none" stroke="#555" strokeWidth="2" />
    <rect x="3" y="8" width="10" height="1" fill="#603020" />
    <rect x="7" y="7" width="2" height="3" fill="#d0a040" />
  </svg>
);

const RetroLink = ({ label, url, icon }) => {
  const [hover, setHover] = useState(false);
  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onPointerDown={e => e.stopPropagation()}
      onPointerUp={handleOpen}
      onClick={e => { e.preventDefault(); e.stopPropagation(); }}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        color: hover ? "#f4d03f" : "#f4e8d0",
        textDecoration: "none",
        padding: "6px 8px",
        background: hover ? "rgba(244,208,63,0.1)" : "rgba(0,0,0,0.2)",
        border: hover ? "2px solid #f4d03f" : "2px solid #2a2a3e",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.1s",
        boxShadow: hover ? "inset 0 0 10px rgba(244,208,63,0.2)" : "none",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, filter: hover ? "drop-shadow(0 0 4px rgba(244,208,63,0.5))" : "none", transition: "filter 0.1s" }}>
        {icon}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1 }}>{label}</div>
    </a>
  );
};

const InfoPanel = ({ onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 99999,
      fontFamily: "'Micro 5', monospace",
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      style={{
        background: "#1a1a2e",
        border: "4px solid #4a4a5e",
        borderRadius: 8,
        padding: "24px",
        maxWidth: 380, width: "90%",
        boxShadow: "0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)",
        color: "#f4e8d0",
        position: "relative",
      }}
    >
      {/* Decorative corners */}
      <div style={{ position: "absolute", top: 4, left: 4, width: 8, height: 8, borderTop: "2px solid #f4d03f", borderLeft: "2px solid #f4d03f" }} />
      <div style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderTop: "2px solid #f4d03f", borderRight: "2px solid #f4d03f" }} />
      <div style={{ position: "absolute", bottom: 4, left: 4, width: 8, height: 8, borderBottom: "2px solid #f4d03f", borderLeft: "2px solid #f4d03f" }} />
      <div style={{ position: "absolute", bottom: 4, right: 4, width: 8, height: 8, borderBottom: "2px solid #f4d03f", borderRight: "2px solid #f4d03f" }} />

      <button onClick={onClose} style={{
        position: "absolute", top: 8, right: 12,
        background: "transparent", border: "none",
        color: "#8a8a9e", fontSize: 24, cursor: "pointer",
        fontFamily: "'Micro 5', monospace",
        transition: "color 0.2s"
      }} onMouseEnter={e => e.target.style.color = "#f4d03f"} onMouseLeave={e => e.target.style.color = "#8a8a9e"}>x</button>

      {/* Header with Favicon */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, borderBottom: "2px solid #3a3a4e", paddingBottom: 12 }}>
        <img src="/favicon.svg" alt="Logo" style={{ width: 40, height: 40, imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />
        <div>
          <div style={{ fontSize: 24, color: "#f4d03f", letterSpacing: 1, textShadow: "2px 2px 0 #000" }}>SAAD IBRA</div>
          <div style={{ fontSize: 14, color: "#8a8a9e" }}>NOMADSLAND OS v1.0</div>
        </div>
      </div>

      {/* Controls Section */}
      <div style={{ fontSize: 18, color: "#fff", letterSpacing: 1, marginBottom: 12, textShadow: "1px 1px 0 #000" }}>
        // CONTROLS
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={36}>W</KeyBadge><KeyBadge minWidth={36}>A</KeyBadge><KeyBadge minWidth={36}>S</KeyBadge><KeyBadge minWidth={36}>D</KeyBadge>
          <span style={{ marginLeft: 8, color: "#c0b8a0" }}>MOVE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={175}>TAP / CLICK</KeyBadge>
          <span style={{ marginLeft: 8, color: "#c0b8a0" }}>MOVE</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={70} color="#e0a0a0">A</KeyBadge><KeyBadge minWidth={95} color="#e0a0a0">SPACE</KeyBadge>
          <span style={{ marginLeft: 8, color: "#c0b8a0" }}>INTERACT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={70} color="#a0c0e0">B</KeyBadge><KeyBadge minWidth={95} color="#a0c0e0">ESC</KeyBadge>
          <span style={{ marginLeft: 8, color: "#c0b8a0" }}>BACK</span>
        </div>
      </div>

      {/* Links Section */}
      <div style={{ fontSize: 18, color: "#fff", letterSpacing: 1, marginBottom: 12, textShadow: "1px 1px 0 #000" }}>
        // NETWORK
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
        <RetroLink label="BLOG" url="/blogs/" icon={<IconNewspaper />} />
        <RetroLink label="CONTACT" url="/contact/" icon={<IconPhone />} />
        <RetroLink label="GITHUB" url="https://github.com/saad-ibra" icon={<IconComputer />} />
        <RetroLink label="LINKEDIN" url="https://linkedin.com/in/saad-ibra" icon={<IconBriefcase />} />
        <RetroLink label="GOODREADS" url="https://www.goodreads.com/user/show/155498817-saad-ibra" icon={<IconBook />} />
      </div>
    </div>
  </div>
);

function ControlBarInner() {
  const { speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted } = useGame();
  const [sfxMuted, setSfxMuted] = useState(() => getSfxMuted());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDesktopLandscape, setIsDesktopLandscape] = useState(window.innerWidth > window.innerHeight && window.innerWidth >= 1024);
  const [showInfo, setShowInfo] = useState(false);

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
        
        {/* D-PAD + Info Button */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {/* Info button — top-left of D-pad */}
          <div style={{ position: "absolute", top: -16, left: -16, zIndex: 20 }}>
            <InfoButton onClick={() => setShowInfo(true)} />
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr 1fr",
            width: isMobile ? 120 : 160,
            height: isMobile ? 120 : 160,
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
              musicPlaying ? setMusicMuted(!musicMuted) : setMusicPlaying(true);
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
            onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 1.5 : speedMultiplier === 1.5 ? 2 : 1)}
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

      {/* Info Panel Overlay */}
      {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}
    </div>
  );
}

const ControlBar = memo(ControlBarInner);
export default ControlBar;
