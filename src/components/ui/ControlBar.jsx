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

const DpadBtn = ({ gridArea, keyName }) => {
  const [pressed, setPressed] = useState(false);
  
  const press = (e) => {
    handlePress(e, keyName);
    setPressed(true);
  };
  const release = (e) => {
    handleRelease(e, keyName);
    setPressed(false);
  };

  return (
    <button
      onPointerDown={press}
      onPointerEnter={(e) => { if (e.buttons > 0) press(e); }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onTouchStart={press}
      onTouchEnd={release}
      onTouchCancel={release}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        gridArea,
        background: "#1c1c1c",
        border: "none",
        outline: "none",
        color: "#1c1c1c",
        cursor: "pointer", touchAction: "none",
        WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent",
        borderTopLeftRadius: gridArea === "top" || gridArea === "left" ? 8 : 0,
        borderTopRightRadius: gridArea === "top" || gridArea === "right" ? 8 : 0,
        borderBottomLeftRadius: gridArea === "bottom" || gridArea === "left" ? 8 : 0,
        borderBottomRightRadius: gridArea === "bottom" || gridArea === "right" ? 8 : 0,
        boxShadow: pressed ? "inset 0 4px 6px rgba(0,0,0,0.8)" : "inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)",
        filter: pressed ? "brightness(0.8)" : "none",
        transition: "all 0.05s"
      }}
    />
  );
};

const ActionBtn = ({ label, keyName }) => {
  const [pressed, setPressed] = useState(false);
  
  const press = (e) => {
    handlePress(e, keyName);
    setPressed(true);
  };
  const release = (e) => {
    handleRelease(e, keyName);
    setPressed(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button
        onPointerDown={press}
        onPointerEnter={(e) => { if (e.buttons > 0) press(e); }}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onTouchStart={press}
        onTouchEnd={release}
        onTouchCancel={release}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#9a2a3e",
          border: "none",
          outline: "none",
          WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent",
          boxShadow: pressed 
            ? "inset 2px 4px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.2)"
            : "inset -2px -4px 6px rgba(0,0,0,0.3), inset 2px 4px 6px rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.4)",
          transform: pressed ? "translateY(2px)" : "translateY(0)",
          cursor: "pointer", touchAction: "none",
          transition: "all 0.05s"
        }}
      />
      <span style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 11, color: "#8a867c", letterSpacing: 1 }}>{label}</span>
    </div>
  );
};

const PillBtn = ({ label, onClick, active }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: "rotate(-15deg)" }}>
      <button
        onPointerDown={(e) => { e.preventDefault(); setPressed(true); onClick(); }}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onTouchStart={(e) => { e.preventDefault(); setPressed(true); onClick(); }}
        onTouchEnd={() => setPressed(false)}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: 48, height: 16,
          borderRadius: 8,
          background: active ? "#5a5a5a" : "#7a7a7a",
          border: "none",
          outline: "none",
          boxShadow: (active || pressed) ? "inset 0 4px 6px rgba(0,0,0,0.7)" : "inset 0 2px 4px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.3)",
          transform: pressed ? "translateY(1px)" : "translateY(0)",
          cursor: "pointer", touchAction: "none",
          WebkitTapHighlightColor: "transparent",
          transition: "all 0.05s"
        }}
      />
      <span style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 10, color: "#8a867c", letterSpacing: 1 }}>{label}</span>
    </div>
  );
};

const InfoButton = ({ onClick }) => {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: 24, height: 24,
        borderRadius: "50%",
        background: "#2a5aa0",
        border: "none",
        outline: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent",
        boxShadow: pressed 
          ? "inset 1px 2px 4px rgba(0,0,0,0.6), 0 1px 1px rgba(0,0,0,0.2)"
          : "inset -1px -2px 3px rgba(0,0,0,0.3), inset 1px 2px 3px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)",
        transform: pressed ? "translateY(1px)" : "translateY(0)",
        cursor: "pointer", touchAction: "none",
        transition: "all 0.05s"
      }}
    >
      <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", fontWeight: "bold", fontSize: 22, color: "#fff", textShadow: "0 1px 1px rgba(0,0,0,0.4)", marginTop: -1 }}>
        i
      </span>
    </button>
  );
};

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
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3a4a6a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4.5c0.2-0.1 12.8-0.3 13 0v12c-0.1 0.3-12.9 0.2-13 0z" />
    <path d="M5.5 7h4.5" /><path d="M5.5 9.5h8" /><path d="M5.5 12h8" /><path d="M5.5 14.5h5" />
    <path d="M12 6.5c0.1 0 2.8-0.1 3 0v2.5c-0.2 0.1-2.8 0.1-3 0z" fill="#3a4a6a" opacity="0.15" />
  </svg>
);

const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3a4a6a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4c0.5 0 2-0.2 3 0.5 0.8 0.6 1.2 1.5 1 2.5l-0.5 1.5c1.2 1.8 2.8 3.2 4.5 4.2l1.5-0.8c1-0.3 2 0 2.8 0.7 0.8 0.8 1 2 0.7 3-0.5 1.5-2 2.5-3.5 2.5C8 18 4 14.5 2.5 10 1.5 7 1.5 5 3 4z" />
  </svg>
);

const IconComputer = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3a4a6a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4c0.2-0.1 13.8-0.1 14 0v9c-0.1 0.2-13.8 0.2-14 0z" />
    <path d="M4.5 5.5h11v6.5h-11z" fill="#3a4a6a" opacity="0.08" />
    <path d="M6 8h2.5" stroke="#2a8a2a" strokeWidth="1" />
    <path d="M6 10h1" stroke="#2a8a2a" strokeWidth="1" />
    <path d="M7 15h6" /><path d="M5.5 17h9" />
  </svg>
);

const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3a4a6a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 5c-2-1.5-4-2-6-1.5v11c2-0.3 4 0.2 6 1.5" />
    <path d="M10 5c2-1.5 4-2 6-1.5v11c-2-0.3-4 0.2-6 1.5" />
    <path d="M6 7h2" /><path d="M6 9.5h2.5" /><path d="M12 7h2" /><path d="M12 9.5h2.5" />
  </svg>
);

const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3a4a6a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8c0.1-0.2 13.8-0.2 14 0v7c-0.2 0.2-13.8 0.2-14 0z" />
    <path d="M7 8V6c0.1-0.3 5.8-0.3 6 0v2" />
    <path d="M3 11h14" />
    <path d="M9 10.5v2h2v-2" />
  </svg>
);

const DiaryLink = ({ label, url, icon }) => {
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
        display: "flex", alignItems: "center", gap: 6,
        color: hover ? "#1a3a6a" : "#4a4a4a",
        textDecoration: "none",
        padding: "5px 8px",
        background: hover ? "rgba(70,130,200,0.06)" : "transparent",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.15s",
        pointerEvents: "auto",
        fontFamily: "'Just Another Hand', cursive",
      }}
    >
      {/* Squiggly hand-drawn border */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
        <defs>
          <filter id={`squig-${label}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" seed={label.length * 7} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect x="1" y="1" width="98%" height="90%" rx="3"
          fill="none" stroke={hover ? "#4a6a9a" : "#9a9a8a"} strokeWidth="1.2" strokeDasharray={hover ? "none" : "5 3"}
          filter={`url(#squig-${label})`}
          style={{ transition: "stroke 0.15s" }}
        />
      </svg>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, filter: hover ? "drop-shadow(0 0 3px rgba(70,130,200,0.4))" : "none", transition: "filter 0.15s" }}>
        {icon}
      </div>
      <div style={{ fontSize: 22, lineHeight: 1.1 }}>{label}</div>
    </a>
  );
};

const InfoPanel = ({ onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 99999,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      style={{
        background: "#f5f0e0",
        borderRadius: "4px 12px 4px 4px",
        padding: "28px 24px 24px 24px",
        maxWidth: 400, width: "92%",
        boxShadow: "4px 6px 20px rgba(0,0,0,0.4), inset 0 0 60px rgba(180,160,120,0.15)",
        color: "#3a3020",
        position: "relative",
        overflow: "hidden",
        /* Notebook paper ruled lines */
        backgroundImage: `
          repeating-linear-gradient(
            transparent,
            transparent 27px,
            rgba(180,160,140,0.25) 27px,
            rgba(180,160,140,0.25) 28px
          )
        `,
        backgroundSize: "100% 28px",
        backgroundPosition: "0 16px",
      }}
    >
      {/* Left margin red line */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 36, width: 1, background: "rgba(200,100,100,0.25)", pointerEvents: "none" }} />

      {/* Dog-eared corner */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 24, height: 24,
        background: "linear-gradient(225deg, #d8d0c0 50%, #e8e0d0 50%)",
        boxShadow: "-1px 1px 3px rgba(0,0,0,0.1)",
        pointerEvents: "none"
      }} />



      {/* Tape strip at top */}
      <div style={{
        position: "absolute", top: -4, left: "50%", transform: "translateX(-50%) rotate(-1deg)",
        width: 80, height: 18,
        background: "rgba(255,250,200,0.6)",
        border: "1px solid rgba(200,190,150,0.4)",
        borderRadius: 2,
        pointerEvents: "none"
      }} />



      {/* Close button */}
      <button onClick={onClose} style={{
        position: "absolute", top: 6, right: 28,
        background: "transparent", border: "none",
        color: "#b0a090", fontSize: 26, cursor: "pointer",
        fontFamily: "'Just Another Hand', cursive",
        transition: "color 0.2s",
      }} onMouseEnter={e => e.target.style.color = "#6a4a30"} onMouseLeave={e => e.target.style.color = "#b0a090"}>x</button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: "1.5px solid rgba(0,0,0,0.08)", position: "relative", zIndex: 1 }}>
        <img src="/favicon.svg" alt="Logo" style={{ width: 32, height: 32, imageRendering: "pixelated", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }} />
        <div>
          <div style={{ fontFamily: "'Just Another Hand', cursive", fontSize: 36, color: "#2a3a5a", letterSpacing: 0.5, lineHeight: 1 }}>Saad Ibra</div>
          <div style={{ fontFamily: "'Micro 5', monospace", fontSize: 11, color: "#8a8070", letterSpacing: 1 }}>NOMADSLAND OS v1.0</div>
        </div>
      </div>

      {/* Controls Section */}
      <div style={{ fontFamily: "'Just Another Hand', cursive", fontSize: 26, color: "#4a5a7a", marginBottom: 8, position: "relative", zIndex: 1 }}>
        Controls ~
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14, marginBottom: 18, fontFamily: "'Micro 5', monospace", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={30}>W</KeyBadge><KeyBadge minWidth={30}>A</KeyBadge><KeyBadge minWidth={30}>S</KeyBadge><KeyBadge minWidth={30}>D</KeyBadge>
          <span style={{ marginLeft: 6, color: "#6a6050", fontFamily: "'Just Another Hand', cursive", fontSize: 22 }}>move</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={140}>TAP / CLICK</KeyBadge>
          <span style={{ marginLeft: 6, color: "#6a6050", fontFamily: "'Just Another Hand', cursive", fontSize: 22 }}>move</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={55} color="#e8c0c0">A</KeyBadge><KeyBadge minWidth={78} color="#e8c0c0">SPACE</KeyBadge>
          <span style={{ marginLeft: 6, color: "#6a6050", fontFamily: "'Just Another Hand', cursive", fontSize: 22 }}>interact</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <KeyBadge minWidth={55} color="#c0d0e8">B</KeyBadge><KeyBadge minWidth={78} color="#c0d0e8">ESC</KeyBadge>
          <span style={{ marginLeft: 6, color: "#6a6050", fontFamily: "'Just Another Hand', cursive", fontSize: 22 }}>back</span>
        </div>
      </div>

      {/* Links Section */}
      <div style={{ fontFamily: "'Just Another Hand', cursive", fontSize: 26, color: "#4a5a7a", marginBottom: 8, position: "relative", zIndex: 1 }}>
        Places to find me ~
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", position: "relative", zIndex: 1 }}>
        <DiaryLink label="Blog" url="/blogs/" icon={<IconNewspaper />} />
        <DiaryLink label="Contact" url="/contact/" icon={<IconPhone />} />
        <DiaryLink label="GitHub" url="https://github.com/saad-ibra" icon={<IconComputer />} />
        <DiaryLink label="LinkedIn" url="https://linkedin.com/in/saad-ibra" icon={<IconBriefcase />} />
        <DiaryLink label="Goodreads" url="https://www.goodreads.com/user/show/198640001" icon={<IconBook />} />
      </div>

      {/* Doodles Section (flowing naturally at bottom to avoid overlapping buttons) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32, paddingBottom: 10, position: "relative", zIndex: 0 }}>
        <img src="/doodle-brain.png" alt="" style={{ width: 75, height: 85, objectFit: "contain", transform: "rotate(-8deg)", opacity: 0.9, filter: "brightness(0.9) contrast(1.2)" }} />
        <img src="/doodle-island.png" alt="" style={{ width: 85, height: 65, objectFit: "contain", transform: "rotate(2deg)", opacity: 1, filter: "brightness(0.8) contrast(1.4)", paddingBottom: 10 }} />
        <img src="/doodle-butterflies.png" alt="" style={{ width: 170, height: 90, objectFit: "contain", transform: "rotate(-2deg)", opacity: 0.85, filter: "brightness(1.15)" }} />
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
      
      {/* Info button — top-left of the entire console */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 20 }}>
        <InfoButton onClick={() => setShowInfo(true)} />
      </div>

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
        <div style={{ position: "relative", flexShrink: 0 }}>
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
