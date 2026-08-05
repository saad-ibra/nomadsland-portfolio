import { useEffect, useState } from "react";
import { toggleSfxMuted, getSfxMuted } from "../../engine/sfx";

export default function ControlBar({
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

  const simulateKey = (key, type) => {
    const e = new KeyboardEvent(type, {
      key: key,
      code: key === " " ? "Space" : key,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(e);
  };

  const DpadBtn = ({ gridArea, keyName }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); e.target.setPointerCapture(e.pointerId); simulateKey(keyName, "keydown"); }}
      onPointerUp={(e) => { e.preventDefault(); try { e.target.releasePointerCapture(e.pointerId); } catch(err){} simulateKey(keyName, "keyup"); }}
      onPointerLeave={(e) => { e.preventDefault(); simulateKey(keyName, "keyup"); }}
      onPointerCancel={(e) => { e.preventDefault(); simulateKey(keyName, "keyup"); }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        gridArea,
        background: "#1c1c1c",
        border: "none",
        color: "#1c1c1c", // hidden text
        cursor: "pointer", touchAction: "none",
        borderTopLeftRadius: gridArea === "top" || gridArea === "left" ? 4 : 0,
        borderTopRightRadius: gridArea === "top" || gridArea === "right" ? 4 : 0,
        borderBottomLeftRadius: gridArea === "bottom" || gridArea === "left" ? 4 : 0,
        borderBottomRightRadius: gridArea === "bottom" || gridArea === "right" ? 4 : 0,
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)"
      }}
    />
  );

  const ActionBtn = ({ label, keyName }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button
        onPointerDown={(e) => { e.preventDefault(); e.target.setPointerCapture(e.pointerId); simulateKey(keyName, "keydown"); }}
        onPointerUp={(e) => { e.preventDefault(); try { e.target.releasePointerCapture(e.pointerId); } catch(err){} simulateKey(keyName, "keyup"); }}
        onPointerLeave={(e) => { e.preventDefault(); simulateKey(keyName, "keyup"); }}
        onPointerCancel={(e) => { e.preventDefault(); simulateKey(keyName, "keyup"); }}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: isMobile ? 48 : 56,
          height: isMobile ? 48 : 56,
          borderRadius: "50%",
          background: "#9a2a3e",
          border: "none",
          boxShadow: "inset -2px -4px 6px rgba(0,0,0,0.3), inset 2px 4px 6px rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.4)",
          cursor: "pointer", touchAction: "none"
        }}
      />
      <span style={{ fontFamily: "sans-serif", fontWeight: "bold", fontSize: 12, color: "#8a867c", letterSpacing: 1 }}>{label}</span>
    </div>
  );

  const PillBtn = ({ label, onClick, active }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: "rotate(-15deg)" }}>
      <button
        onPointerDown={(e) => { e.preventDefault(); onClick(); }}
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

  return (
    <div style={{
      position: "relative",
      width: isDesktopLandscape ? "320px" : "100%",
      height: isDesktopLandscape ? "100dvh" : (isMobile ? "40dvh" : "33.33dvh"),
      flexShrink: 0,
      background: "#d0d0c0", // Classic Gameboy Grey/Beige
      borderTop: isDesktopLandscape ? "none" : "4px solid #b0b0a0",
      borderLeft: isDesktopLandscape ? "4px solid #b0b0a0" : "none",
      boxShadow: "inset 0 8px 12px rgba(255,255,255,0.5)",
      display: "flex", flexDirection: "column",
      padding: isDesktopLandscape ? "48px 32px" : (isMobile ? "24px 16px" : "32px 64px"),
      boxSizing: "border-box",
      zIndex: 10000,
      overflow: "hidden",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
    }}>
      
      {/* Decorative Speaker Lines */}
      <div style={{ position: "absolute", bottom: 24, right: 24, display: "flex", gap: 6, transform: "rotate(-15deg)" }}>
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
          display: "flex", gap: isMobile ? 8 : 16, 
          alignSelf: isDesktopLandscape ? "center" : "flex-end", 
          paddingBottom: isDesktopLandscape ? 0 : 16 
        }}>
          <PillBtn 
            label={musicMuted || !musicPlaying ? "MUSIC:OFF" : "MUSIC:ON"} 
            onClick={onTogglePlay} 
            active={musicPlaying && !musicMuted}
          />
          <PillBtn 
            label={sfxMuted ? "SFX:OFF" : "SFX:ON"} 
            onClick={() => setSfxMuted(toggleSfxMuted())} 
            active={!sfxMuted}
          />
          <PillBtn 
            label={`SPD:${speedMultiplier}X`} 
            onClick={() => onChangeSpeed(speedMultiplier === 1 ? 1.5 : speedMultiplier === 1.5 ? 2 : 1)}
            active={speedMultiplier > 1}
          />
        </div>

        {/* A / B Buttons */}
        <div style={{ 
          display: "flex", gap: 16, transform: "rotate(-15deg)", 
          alignSelf: isDesktopLandscape ? "center" : "center", 
          marginRight: isDesktopLandscape || isMobile ? 0 : 24, flexShrink: 0 
        }}>
          <div style={{ marginTop: 32 }}>
            <ActionBtn label="B" keyName="Escape" />
          </div>
          <div style={{ marginBottom: 32 }}>
            <ActionBtn label="A" keyName=" " />
          </div>
        </div>
      </div>
    </div>
  );
}
