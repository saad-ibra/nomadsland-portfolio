"use client";
(() => {
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });

  // src/scenes/LibraryScene.jsx
  var import_react3 = __require("react");
  var import_lucide_react = __require("lucide-react");

  // src/components/ui/ControlBar.jsx
  var import_react = __require("react");

  // src/engine/sfx.js
  var audioCtx = null;
  var isSfxMuted = false;
  function toggleSfxMuted() {
    isSfxMuted = !isSfxMuted;
    localStorage.setItem("sfxMuted", JSON.stringify(isSfxMuted));
    return isSfxMuted;
  }
  function getSfxMuted() {
    return isSfxMuted;
  }
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }
  function playOscillator(type = "sine", freq = 440, volume = 0.5, duration = 0.1) {
    if (isSfxMuted) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + duration);
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playWoodStep(volume = 0.015) {
    playOscillator("triangle", 120, volume, 0.1);
  }

  // src/components/ui/ControlBar.jsx
  function ControlBar({
    musicPlaying,
    musicMuted,
    musicVolume,
    speedMultiplier,
    onTogglePlay,
    onChangeVolume,
    onChangeSpeed
  }) {
    const [sfxMuted, setSfxMuted] = (0, import_react.useState)(() => getSfxMuted());
    const [isMobile, setIsMobile] = (0, import_react.useState)(window.innerWidth < 768);
    const [isDesktopLandscape, setIsDesktopLandscape] = (0, import_react.useState)(window.innerWidth > window.innerHeight && window.innerWidth >= 1024);
    (0, import_react.useEffect)(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        setIsDesktopLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 1024);
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
    const simulateKey = (key, type) => {
      const e = new KeyboardEvent(type, {
        key,
        code: key === " " ? "Space" : key,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(e);
    };
    const DpadBtn = ({ gridArea, keyName }) => /* @__PURE__ */ React.createElement(
      "button",
      {
        onPointerDown: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keydown");
        },
        onPointerUp: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keyup");
        },
        onPointerLeave: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keyup");
        },
        onPointerCancel: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keyup");
        },
        style: {
          gridArea,
          background: "#1c1c1c",
          border: "none",
          color: "#1c1c1c",
          // hidden text
          cursor: "pointer",
          touchAction: "none",
          borderTopLeftRadius: gridArea === "top" || gridArea === "left" ? 4 : 0,
          borderTopRightRadius: gridArea === "top" || gridArea === "right" ? 4 : 0,
          borderBottomLeftRadius: gridArea === "bottom" || gridArea === "left" ? 4 : 0,
          borderBottomRightRadius: gridArea === "bottom" || gridArea === "right" ? 4 : 0,
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)"
        }
      }
    );
    const ActionBtn = ({ label, keyName }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onPointerDown: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keydown");
        },
        onPointerUp: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keyup");
        },
        onPointerLeave: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keyup");
        },
        onPointerCancel: (e) => {
          e.preventDefault();
          simulateKey(keyName, "keyup");
        },
        style: {
          width: isMobile ? 56 : 56,
          height: isMobile ? 56 : 56,
          borderRadius: "50%",
          background: "#9a2a3e",
          border: "none",
          boxShadow: "inset -2px -4px 6px rgba(0,0,0,0.3), inset 2px 4px 6px rgba(255,255,255,0.2), 0 4px 6px rgba(0,0,0,0.4)",
          cursor: "pointer",
          touchAction: "none"
        }
      }
    ), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "sans-serif", fontWeight: "bold", fontSize: 12, color: "#8a867c", letterSpacing: 1 } }, label));
    const PillBtn = ({ label, onClick, active }) => /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: "rotate(-15deg)" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onPointerDown: (e) => {
          e.preventDefault();
          onClick();
        },
        style: {
          width: 48,
          height: 16,
          borderRadius: 8,
          background: active ? "#5a5a5a" : "#7a7a7a",
          border: "none",
          boxShadow: active ? "inset 0 2px 4px rgba(0,0,0,0.5)" : "inset 0 2px 4px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.3)",
          cursor: "pointer",
          touchAction: "none"
        }
      }
    ), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "sans-serif", fontWeight: "bold", fontSize: 10, color: "#8a867c", letterSpacing: 1 } }, label));
    return /* @__PURE__ */ React.createElement("div", { style: {
      position: "relative",
      width: isDesktopLandscape ? "320px" : "100%",
      height: isDesktopLandscape ? "100dvh" : isMobile ? "40dvh" : "33.33dvh",
      flexShrink: 0,
      background: "#d0d0c0",
      // Classic Gameboy Grey/Beige
      borderTop: isDesktopLandscape ? "none" : "4px solid #b0b0a0",
      borderLeft: isDesktopLandscape ? "4px solid #b0b0a0" : "none",
      boxShadow: "inset 0 8px 12px rgba(255,255,255,0.5)",
      display: "flex",
      flexDirection: "column",
      padding: isDesktopLandscape ? "48px 32px" : isMobile ? "24px 16px" : "32px 64px",
      boxSizing: "border-box",
      zIndex: 1e4,
      overflow: "hidden"
    } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", bottom: 24, right: 24, display: "flex", gap: 6, transform: "rotate(-15deg)" } }, [1, 2, 3, 4, 5, 6].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 4, height: 48, background: "#a0a090", borderRadius: 2, boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.3)" } }))), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      flexDirection: isDesktopLandscape ? "column" : "row",
      justifyContent: isDesktopLandscape ? "space-evenly" : "space-between",
      alignItems: "center",
      flex: 1,
      position: "relative",
      zIndex: 10
    } }, /* @__PURE__ */ React.createElement("div", { style: {
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
    } }, /* @__PURE__ */ React.createElement(DpadBtn, { gridArea: "top", keyName: "ArrowUp" }), /* @__PURE__ */ React.createElement(DpadBtn, { gridArea: "left", keyName: "ArrowLeft" }), /* @__PURE__ */ React.createElement("div", { style: { gridArea: "center", background: "#1c1c1c" } }), /* @__PURE__ */ React.createElement(DpadBtn, { gridArea: "right", keyName: "ArrowRight" }), /* @__PURE__ */ React.createElement(DpadBtn, { gridArea: "bottom", keyName: "ArrowDown" })), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      gap: isMobile ? 8 : 16,
      alignSelf: isDesktopLandscape ? "center" : "flex-end",
      paddingBottom: isDesktopLandscape ? 0 : 16
    } }, /* @__PURE__ */ React.createElement(
      PillBtn,
      {
        label: musicMuted || !musicPlaying ? "MUSIC:OFF" : "MUSIC:ON",
        onClick: onTogglePlay,
        active: musicPlaying && !musicMuted
      }
    ), /* @__PURE__ */ React.createElement(
      PillBtn,
      {
        label: sfxMuted ? "SFX:OFF" : "SFX:ON",
        onClick: () => setSfxMuted(toggleSfxMuted()),
        active: !sfxMuted
      }
    ), /* @__PURE__ */ React.createElement(
      PillBtn,
      {
        label: `SPD:${speedMultiplier}X`,
        onClick: () => onChangeSpeed(speedMultiplier === 1 ? 1.5 : speedMultiplier === 1.5 ? 2 : 1),
        active: speedMultiplier > 1
      }
    )), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      gap: 16,
      transform: "rotate(-15deg)",
      alignSelf: isDesktopLandscape ? "center" : "center",
      marginRight: isDesktopLandscape || isMobile ? 0 : 24,
      flexShrink: 0
    } }, /* @__PURE__ */ React.createElement("div", { style: { marginTop: 32 } }, /* @__PURE__ */ React.createElement(ActionBtn, { label: "B", keyName: "Escape" })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 32 } }, /* @__PURE__ */ React.createElement(ActionBtn, { label: "A", keyName: " " })))));
  }

  // src/engine/constants.js
  var TILE = 32;
  var MOVE_COOLDOWN = 140;

  // src/components/sprites/PlayerSprite.jsx
  var COSTUMES = {
    casual: {
      hair: "#3a1c08",
      hairLight: "#5a3018",
      shirt: "#e04040",
      shirtShade: "#b83030",
      pants: "#2850a0",
      pantsStripe: "#183878",
      shoe: "#282828",
      accessories: () => null
    },
    labcoat: {
      hair: "#4a4a4a",
      hairLight: "#6a6a6a",
      shirt: "#f4f4f6",
      shirtShade: "#f4f4f6",
      pants: "#304050",
      pantsStripe: null,
      shoe: "#1a1a1a",
      accessories: (px, direction) => {
        if (direction === "down") return /* @__PURE__ */ React.createElement(React.Fragment, null, px(6, 10, 1, 1, "#aaa"), px(6, 12, 1, 1, "#aaa"));
        return null;
      },
      sideAccessories: (px) => /* @__PURE__ */ React.createElement(React.Fragment, null, px(13, 11, 1, 2, "#ffffff"), px(13, 12, 1, 1, "#00ffcc"))
    },
    newsroom: {
      hair: "#2c1b18",
      hairLight: "#4a3828",
      shirt: "#8b4513",
      shirtShade: "#8b4513",
      pants: "#2a2a3a",
      pantsStripe: null,
      shoe: "#1a1a1a",
      accessories: () => null
    },
    village: {
      hair: "#3a1c08",
      hairLight: "#5a3018",
      shirt: "#c09060",
      shirtShade: "#a07040",
      pants: "#6a4a30",
      pantsStripe: null,
      shoe: "#302010",
      accessories: () => null
    }
  };
  function PlayerSprite({ direction, stepping, costume = "casual" }) {
    const frame = stepping ? 1 : 0;
    const skin = "#fcd8b4", skinShade = "#e8b888";
    const eye = "#181818", white = "#ffffff";
    const c = COSTUMES[costume] || COSTUMES.casual;
    const px = (x, y, w, h, color) => /* @__PURE__ */ React.createElement("rect", { key: `${x}-${y}-${color}`, x, y, width: w, height: h, fill: color });
    const renderDown = () => {
      const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
      return /* @__PURE__ */ React.createElement(React.Fragment, null, px(4, 0, 8, 2, c.hair), px(3, 1, 10, 1, c.hair), px(3, 2, 10, 2, c.hair), px(4, 4, 8, 5, skin), px(3, 4, 1, 4, skin), px(12, 4, 1, 4, skin), px(5, 5, 2, 2, white), px(9, 5, 2, 2, white), px(6, 6, 1, 1, eye), px(10, 6, 1, 1, eye), px(7, 8, 2, 1, skinShade), px(3, 9, 10, 4, c.shirt), px(2, 10, 1, 3, c.shirt), px(13, 10, 1, 3, c.shirt), c.shirtShade !== c.shirt && px(4, 9, 8, 1, c.shirtShade), px(1, 10, 2, 3, skin), px(13, 10, 2, 3, skin), c.accessories && c.accessories(px, "down"), px(4, 13, 3, 2, c.pants), px(9, 13, 3, 2, c.pants), c.pantsStripe && px(7, 13, 2, 1, c.pantsStripe), px(4, 15 + lL, 3, 1, c.shoe), px(9, 15 + lR, 3, 1, c.shoe));
    };
    const renderUp = () => {
      const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
      return /* @__PURE__ */ React.createElement(React.Fragment, null, px(4, 0, 8, 2, c.hair), px(3, 1, 10, 1, c.hair), px(3, 2, 10, 6, c.hair), px(4, 7, 8, 2, c.hairLight), px(3, 9, 10, 4, c.shirt), px(2, 10, 1, 3, c.shirt), px(13, 10, 1, 3, c.shirt), px(1, 10, 2, 3, skin), px(13, 10, 2, 3, skin), px(4, 13, 3, 2, c.pants), px(9, 13, 3, 2, c.pants), c.pantsStripe && px(7, 13, 2, 1, c.pantsStripe), px(4, 15 + lL, 3, 1, c.shoe), px(9, 15 + lR, 3, 1, c.shoe));
    };
    const renderSide = (flip) => {
      const lo = frame ? 1 : 0;
      return /* @__PURE__ */ React.createElement("g", { transform: flip ? "translate(16,0) scale(-1,1)" : void 0 }, px(5, 0, 7, 2, c.hair), px(4, 1, 9, 1, c.hair), px(4, 2, 9, 2, c.hair), px(3, 3, 2, 3, c.hair), px(5, 4, 7, 5, skin), px(4, 5, 1, 3, skin), px(12, 5, 1, 3, skin), px(10, 5, 2, 2, white), px(11, 6, 1, 1, eye), px(10, 8, 2, 1, skinShade), px(4, 9, 9, 4, c.shirt), px(3, 10, 1, 3, c.shirt), px(12, 10, 2, 3, skin), c.sideAccessories && c.sideAccessories(px), px(5, 13, 3, 2, c.pants), px(9, 13, 3, 2, c.pants), px(5, 15, 3, 1 + lo, c.shoe), px(9, 15, 3, 1, c.shoe));
    };
    return /* @__PURE__ */ React.createElement("svg", { width: TILE, height: TILE + 2, viewBox: "0 0 16 17", style: { imageRendering: "pixelated", overflow: "visible" } }, /* @__PURE__ */ React.createElement("ellipse", { cx: "8", cy: "16.5", rx: "5", ry: "1.5", fill: "rgba(0,0,0,0.3)" }), direction === "down" && renderDown(), direction === "up" && renderUp(), direction === "left" && renderSide(true), direction === "right" && renderSide(false));
  }

  // src/components/sprites/ExitDoor.jsx
  function ExitDoor({ col, row }) {
    return /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: col * TILE,
      top: row * TILE,
      width: TILE,
      height: TILE,
      zIndex: row * 10 + 1,
      // The "hole" — pure black interior
      background: "#000",
      // Inset shadow to suggest depth
      boxShadow: "inset 0 4px 8px rgba(0,0,0,0.9), inset 0 -2px 4px rgba(60,60,60,0.3)",
      // Wall-color border on top & sides, none on bottom so it blends into floor
      borderTop: "2px solid #2a1a0e",
      borderLeft: "2px solid #2a1a0e",
      borderRight: "2px solid #2a1a0e",
      borderRadius: "4px 4px 0 0"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      top: 1,
      left: "50%",
      transform: "translateX(-50%)",
      width: TILE - 6,
      height: 3,
      background: "rgba(255,255,255,0.06)",
      borderRadius: "50%"
    } }), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, rgba(30,20,10,0.4) 0%, rgba(0,0,0,0) 60%)",
      pointerEvents: "none"
    } }));
  }

  // src/hooks/usePlayerMovement.js
  var import_react2 = __require("react");
  function usePlayerMovement({
    initialPos,
    canWalk: canWalk2,
    speedMultiplier = 1,
    isActive = true,
    isSailing = false,
    onMove,
    onAction,
    onCancel
  }) {
    const [pos, setPos] = (0, import_react2.useState)(() => initialPos);
    const [facing, setFacing2] = (0, import_react2.useState)("down");
    const [stepping, setStepping2] = (0, import_react2.useState)(false);
    const keysRef = (0, import_react2.useRef)({});
    const lastMoveRef = (0, import_react2.useRef)(0);
    const momentumRef = (0, import_react2.useRef)({ dc: 0, dr: 0, stepsLeft: 0 });
    const onMoveRef = (0, import_react2.useRef)(onMove);
    const onActionRef = (0, import_react2.useRef)(onAction);
    const onCancelRef = (0, import_react2.useRef)(onCancel);
    (0, import_react2.useEffect)(() => {
      onMoveRef.current = onMove;
      onActionRef.current = onAction;
      onCancelRef.current = onCancel;
    }, [onMove, onAction, onCancel]);
    (0, import_react2.useEffect)(() => {
      const down = (e) => {
        const k = e.key.toLowerCase();
        keysRef.current[k] = true;
        if (!isActive) return;
        if (k === " " || k === "enter") {
          if (onActionRef.current) {
            e.preventDefault();
            onActionRef.current();
          }
        }
        if (k === "escape") {
          if (onCancelRef.current) {
            e.preventDefault();
            onCancelRef.current();
          }
        }
      };
      const up = (e) => {
        keysRef.current[e.key.toLowerCase()] = false;
      };
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      return () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
      };
    }, [isActive]);
    (0, import_react2.useEffect)(() => {
      if (!isActive) {
        setStepping2(false);
        return;
      }
      const id = setInterval(() => {
        const now = Date.now();
        const currentSpeed = isSailing ? speedMultiplier * 1.5 : speedMultiplier;
        if (now - lastMoveRef.current < MOVE_COOLDOWN / currentSpeed) return;
        const k = keysRef.current;
        let dc = 0, dr = 0;
        if (k["arrowup"] || k["w"]) dr = -1;
        else if (k["arrowdown"] || k["s"]) dr = 1;
        else if (k["arrowleft"] || k["a"]) dc = -1;
        else if (k["arrowright"] || k["d"]) dc = 1;
        if (dc === 0 && dr === 0) {
          if (isSailing && momentumRef.current.stepsLeft > 0) {
            dc = momentumRef.current.dc;
            dr = momentumRef.current.dr;
            momentumRef.current.stepsLeft--;
          } else {
            setStepping2(false);
            return;
          }
        } else {
          if (isSailing) {
            momentumRef.current = { dc, dr, stepsLeft: 1 };
          } else {
            momentumRef.current = { dc: 0, dr: 0, stepsLeft: 0 };
          }
        }
        const dir = dr < 0 ? "up" : dr > 0 ? "down" : dc < 0 ? "left" : "right";
        setFacing2(dir);
        setPos((p) => {
          const nc = p.col + dc;
          const nr = p.row + dr;
          if (canWalk2(nc, nr)) {
            setStepping2(true);
            lastMoveRef.current = now;
            const newPos = { col: nc, row: nr };
            setTimeout(() => setStepping2(false), 90);
            if (onMoveRef.current) {
              const cancelMove = onMoveRef.current(nc, nr);
              if (cancelMove) return p;
            }
            return newPos;
          } else {
            momentumRef.current.stepsLeft = 0;
          }
          return p;
        });
      }, 30);
      return () => clearInterval(id);
    }, [isActive, speedMultiplier, canWalk2, isSailing]);
    return { pos, setPos, facing, setFacing: setFacing2, stepping };
  }

  // src/data/library.js
  var MAP_COLS = 20;
  var MAP_ROWS = 18;
  var MAP = [
    // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    // 0
    [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0],
    // 1
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // 2
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // 3
    [0, 1, 1, 1, 3, 3, 3, 3, 3, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // 4
    [0, 1, 1, 1, 3, 3, 3, 3, 3, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // 5
    [0, 1, 1, 1, 3, 3, 3, 3, 3, 3, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // 6
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    // 7
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 0],
    // 8
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    // 9
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    // 10
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 0],
    // 11
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 0],
    // 12
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 3, 1, 1, 0],
    // 13
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    // 14
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    // 15
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    // 16 ← door opening
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    // 17
  ];
  var SHELF_LAYOUT = [
    { id: "all", col: 2, row: 2, tourCol: 2, tourRow: 3, line: "This is the whole collection, all together." },
    { id: "currently-reading", col: 2, row: 7, tourCol: 3, tourRow: 7, line: "This one is open right now, a book in progress." },
    { id: "want-to-read", col: 11, row: 2, tourCol: 11, tourRow: 3, line: "Over here, these are waiting their turn." },
    { id: "read", col: 17, row: 9, tourCol: 17, tourRow: 10, line: "The finished shelf. Those that made it all the way through." },
    { id: "did-not-finish", col: 13, row: 14, tourCol: 14, tourRow: 14, line: "And here, those that didn't stick around. No shame in that." }
  ];
  var SHELF_TILES = new Set(SHELF_LAYOUT.map((s) => `${s.col},${s.row}`));
  var DECOR_TILES = /* @__PURE__ */ new Set(["10,3", "5,7", "3,8"]);
  var TOUR_MOVE_MS = 220;
  var TOUR_PAUSE_MS = 2200;
  var TYPE_COLORS = {
    normal: { primary: "#a8a878", dark: "#8a8a58", light: "#c8c898", bg: "#d8d8b0" },
    psychic: { primary: "#f85888", dark: "#c03060", light: "#ff90b0", bg: "#ffc0d0" },
    fire: { primary: "#f08030", dark: "#c05818", light: "#f8a860", bg: "#f8d0a0" },
    grass: { primary: "#78c850", dark: "#48a018", light: "#a0e070", bg: "#c8f0a0" },
    poison: { primary: "#a040a0", dark: "#702070", light: "#c870c8", bg: "#e0a0e0" }
  };
  var BOOK_SPINE_PALETTES = {
    normal: ["#8b4513", "#a0522d", "#d2691e", "#cd853f", "#deb887", "#6b3a1f", "#c4a882", "#947254"],
    psychic: ["#8b008b", "#9932cc", "#ba55d3", "#da70d6", "#c71585", "#db7093", "#a0486e", "#7a3060"],
    fire: ["#b22222", "#dc143c", "#ff4500", "#ff6347", "#cd5c5c", "#e25822", "#cc4422", "#993311"],
    grass: ["#006400", "#228b22", "#2e8b57", "#3cb371", "#556b2f", "#6b8e23", "#4a7c3f", "#2d5a1e"],
    poison: ["#4b0082", "#6a0dad", "#7b68ee", "#9370db", "#800080", "#663399", "#5a2d82", "#8b3a8b"]
  };
  var START_POS = { col: 9, row: 15 };
  var EXIT_DOOR_COL = 9;
  var EXIT_DOOR_ROW = 16;

  // src/scenes/LibraryScene.jsx
  var getShelfIcon = (id, size = 10) => {
    switch (id) {
      case "all":
        return /* @__PURE__ */ React.createElement(import_lucide_react.Library, { size });
      case "currently-reading":
        return /* @__PURE__ */ React.createElement(import_lucide_react.BookOpen, { size });
      case "want-to-read":
        return /* @__PURE__ */ React.createElement(import_lucide_react.Clock, { size });
      case "read":
        return /* @__PURE__ */ React.createElement(import_lucide_react.CheckCircle, { size });
      case "did-not-finish":
        return /* @__PURE__ */ React.createElement(import_lucide_react.XCircle, { size });
      default:
        return /* @__PURE__ */ React.createElement(import_lucide_react.Library, { size });
    }
  };
  function isWalkable(col, row) {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
    const t = MAP[row][col];
    return t === 1 || t === 3;
  }
  function canWalk(col, row) {
    const coord = `${col},${row}`;
    if (SHELF_TILES.has(coord) || DECOR_TILES.has(coord)) return false;
    return isWalkable(col, row);
  }
  function PixelShelf({ shelf, isNear, onClick }) {
    const [hovered, setHovered] = (0, import_react3.useState)(false);
    const active = isNear || hovered;
    const colors = TYPE_COLORS[shelf.type];
    const spines = BOOK_SPINE_PALETTES[shelf.type];
    const rows = [[], [], []];
    let curX = [2, 2, 2];
    shelf.books.slice(0, 18).forEach((b, i) => {
      const r = Math.floor(i / 6);
      if (curX[r] >= 13) return;
      const len = b.title.length;
      const bh = 4 + len % 3;
      const bw = len % 2 === 0 ? 2 : 1;
      if (curX[r] + bw > 14) return;
      const by = (r === 0 ? 7 : r === 1 ? 14 : 21) - bh;
      const color = spines[i % spines.length];
      rows[r].push(
        /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("rect", { x: curX[r], y: by, width: bw, height: bh, fill: color }), bw > 1 && /* @__PURE__ */ React.createElement("rect", { x: curX[r], y: by, width: "1", height: bh, fill: "rgba(255,255,255,0.2)" }), bw > 1 && /* @__PURE__ */ React.createElement("rect", { x: curX[r] + bw - 1, y: by, width: "1", height: bh, fill: "rgba(0,0,0,0.25)" }), /* @__PURE__ */ React.createElement("rect", { x: curX[r], y: by, width: bw, height: "1", fill: "rgba(255,255,255,0.4)" }))
      );
      curX[r] += bw + (len % 3 === 0 ? 1 : 0);
    });
    const renderDecor = () => {
      switch (shelf.type) {
        case "grass":
          return /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "-3", width: "4", height: "3", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "-6", width: "6", height: "3", fill: "#5a8a3a" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "-8", width: "2", height: "2", fill: "#6a9a4a" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "-7", width: "2", height: "2", fill: "#6a9a4a" }));
        case "fire":
          return /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("rect", { x: "10", y: "-3", width: "2", height: "3", fill: "#e8e0c0" }), /* @__PURE__ */ React.createElement("rect", { x: "10", y: "-4", width: "1", height: "1", fill: "#888" }), /* @__PURE__ */ React.createElement("rect", { x: "11", y: "-5", width: "1", height: "2", fill: "#ff4500" }), /* @__PURE__ */ React.createElement("rect", { x: "11", y: "-6", width: "1", height: "1", fill: "#ffda00" }));
        case "psychic":
          return /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("rect", { x: "5", y: "-1", width: "6", height: "1", fill: "#743f39" }), /* @__PURE__ */ React.createElement("rect", { x: "6", y: "-5", width: "4", height: "4", rx: "2", fill: "#ba55d3" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "-4", width: "1", height: "1", fill: "#fff", opacity: "0.6" }));
        case "poison":
          return /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("rect", { x: "11", y: "-3", width: "3", height: "3", rx: "1", fill: "#4b0082" }), /* @__PURE__ */ React.createElement("rect", { x: "12", y: "-5", width: "1", height: "2", fill: "#8b3a8b" }), /* @__PURE__ */ React.createElement("rect", { x: "12", y: "-6", width: "1", height: "1", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "11", y: "-2", width: "1", height: "1", fill: "#fff", opacity: "0.4" }));
        case "normal":
        default:
          return /* @__PURE__ */ React.createElement("g", null, /* @__PURE__ */ React.createElement("rect", { x: "6", y: "-4", width: "4", height: "4", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "-3", width: "2", height: "2", fill: "#e8e0c0" }), /* @__PURE__ */ React.createElement("rect", { x: "8", y: "-3", width: "1", height: "1", fill: "#2c1b18" }));
      }
    };
    return /* @__PURE__ */ React.createElement("div", { onClick, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), style: {
      position: "absolute",
      left: shelf.col * TILE,
      top: shelf.row * TILE - 16,
      width: TILE,
      height: TILE + 16,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      cursor: "pointer",
      filter: active ? `brightness(1.1) drop-shadow(0 0 6px ${colors.primary}88)` : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
      transition: "filter 0.15s",
      zIndex: shelf.row * 10
    } }, /* @__PURE__ */ React.createElement("svg", { width: "32", height: "56", viewBox: "0 -4 16 28", style: { imageRendering: "pixelated", overflow: "visible" } }, renderDecor(), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "2", width: "12", height: "20", fill: "#2c1b18" }), /* @__PURE__ */ React.createElement("path", { d: "M0,0 h16 v24 h-16 Z M2,2 v20 h12 v-20 Z", fill: "#743f39", fillRule: "evenodd" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "15", height: "1", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "0", width: "1", height: "23", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "7", width: "12", height: "1", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "14", width: "12", height: "1", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "21", width: "12", height: "1", fill: "#a25b44" }), /* @__PURE__ */ React.createElement("rect", { x: "15", y: "1", width: "1", height: "23", fill: "#502621" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "23", width: "15", height: "1", fill: "#502621" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "8", width: "12", height: "1", fill: "#502621" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "15", width: "12", height: "1", fill: "#502621" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "22", width: "12", height: "1", fill: "#502621" }), rows.map((row, r) => /* @__PURE__ */ React.createElement("g", { key: r }, row))));
  }
  function useTypewriter(text, speed = 28) {
    const [shown, setShown] = (0, import_react3.useState)("");
    (0, import_react3.useEffect)(() => {
      setShown("");
      if (!text) return;
      let i = 0;
      const id = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(id);
      }, speed);
      return () => clearInterval(id);
    }, [text, speed]);
    return shown;
  }
  function PixelBookCover({ book, typeColors }) {
    return /* @__PURE__ */ React.createElement("a", { href: book.link || "#", target: "_blank", rel: "noopener noreferrer", style: { display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", background: "rgba(0,0,0,0.25)", borderRadius: 2, border: "2px solid rgba(255,255,255,0.1)", textDecoration: "none", transition: "transform 0.1s, background 0.1s" }, onMouseEnter: (e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
      e.currentTarget.style.transform = "translateX(2px)";
    }, onMouseLeave: (e) => {
      e.currentTarget.style.background = "rgba(0,0,0,0.25)";
      e.currentTarget.style.transform = "translateX(0)";
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: 28,
      height: 40,
      flexShrink: 0,
      imageRendering: "auto",
      borderRadius: 1,
      border: "1px solid #1a1b2e",
      background: book.coverUrl ? `url(${book.coverUrl}) center/cover no-repeat` : `linear-gradient(180deg, ${typeColors.primary} 0%, ${typeColors.dark} 100%)`,
      position: "relative",
      boxShadow: "1px 1px 0 rgba(0,0,0,0.4)"
    } }, !book.coverUrl && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 2, left: 2, right: 2, height: 1, background: "rgba(255,255,255,0.4)" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: 5, left: 3, right: 3, height: 1, background: "rgba(255,255,255,0.25)" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", bottom: 3, left: 2, right: 2, height: 1, background: "rgba(255,255,255,0.3)" } }))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Press Start 2P', monospace", fontSize: 6, color: "#f4e8d0", lineHeight: 1.6, wordWrap: "break-word" } }, book.title), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Press Start 2P', monospace", fontSize: 5, opacity: 0.6, color: "#f4e8d0", marginTop: 4 } }, book.author)));
  }
  function PixelLantern({ col, row }) {
    return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: col * TILE + 8, top: row * TILE - 4, imageRendering: "pixelated", zIndex: row * 10 } }, /* @__PURE__ */ React.createElement("svg", { width: "16", height: "32", viewBox: "0 0 8 16", style: { imageRendering: "pixelated", overflow: "visible" } }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "10", width: "2", height: "4", fill: "#111" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "9", width: "4", height: "1", fill: "#222" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "2", height: "5", fill: "#f4e8d0" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "1", height: "5", fill: "#fff" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "1", width: "2", height: "3", fill: "#ff4500" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "2", width: "1", height: "2", fill: "#ffd700" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "3", width: "1", height: "1", fill: "#fff" })), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -8, left: "50%", width: 64, height: 64, marginLeft: -32, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,160,0,0.25) 0%, transparent 60%)", pointerEvents: "none", animation: "lanternFlicker 0.2s ease-in-out infinite alternate" } }));
  }
  function WallBookcase({ col, row, flip }) {
    return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: col * TILE, top: row * TILE - 8, imageRendering: "pixelated", transform: flip ? "scaleX(-1)" : void 0, zIndex: row * 10 } }, /* @__PURE__ */ React.createElement("svg", { width: "32", height: "40", viewBox: "0 0 16 20", style: { imageRendering: "pixelated", overflow: "visible" } }, /* @__PURE__ */ React.createElement("rect", { x: "0", y: "20", width: "16", height: "2", fill: "rgba(0,0,0,0.4)" }), /* @__PURE__ */ React.createElement("path", { d: "M0,20 L0,2 C0,0.8 1,0 2,0 L14,0 C15,0 16,0.8 16,2 L16,20 Z", fill: "#3a2210" }), /* @__PURE__ */ React.createElement("path", { d: "M1,20 L1,2 C1,1.5 1.5,1 2,1 L14,1 C14.5,1 15,1.5 15,2 L15,20 Z", fill: "#201008" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "6", width: "14", height: "1", fill: "#4a2a18" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "13", width: "14", height: "1", fill: "#4a2a18" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "3", width: "2", height: "3", fill: "#8b2222" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "2", width: "1", height: "4", fill: "#d4af37" }), /* @__PURE__ */ React.createElement("rect", { x: "6", y: "3", width: "2", height: "3", fill: "#225588" }), /* @__PURE__ */ React.createElement("rect", { x: "9", y: "4", width: "3", height: "2", fill: "#228b22" }), /* @__PURE__ */ React.createElement("rect", { x: "13", y: "2", width: "1", height: "4", fill: "#4b0082" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "9", width: "3", height: "4", fill: "#a0522d" }), /* @__PURE__ */ React.createElement("rect", { x: "6", y: "10", width: "2", height: "3", fill: "#cd5c5c" }), /* @__PURE__ */ React.createElement("rect", { x: "8", y: "9", width: "1", height: "4", fill: "#d4af37" }), /* @__PURE__ */ React.createElement("rect", { x: "11", y: "11", width: "3", height: "2", fill: "#556b2f" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "16", width: "1", height: "4", fill: "#4682b4" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "15", width: "2", height: "5", fill: "#8b4513" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "17", width: "3", height: "3", fill: "#800000" }), /* @__PURE__ */ React.createElement("rect", { x: "11", y: "15", width: "2", height: "5", fill: "#2f4f4f" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "3", width: "1", height: "3", fill: "#fff", opacity: "0.2" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "9", width: "1", height: "4", fill: "#fff", opacity: "0.2" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "15", width: "1", height: "5", fill: "#fff", opacity: "0.2" })));
  }
  function ReadingDesk({ col, row }) {
    return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: col * TILE, top: row * TILE + 8, imageRendering: "pixelated", zIndex: row * 10 } }, /* @__PURE__ */ React.createElement("svg", { width: "32", height: "24", viewBox: "0 0 16 12", style: { imageRendering: "pixelated", overflow: "visible" } }, /* @__PURE__ */ React.createElement("rect", { x: "0", y: "10", width: "16", height: "3", fill: "rgba(0,0,0,0.3)" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "6", width: "2", height: "5", fill: "#201008" }), /* @__PURE__ */ React.createElement("rect", { x: "13", y: "6", width: "2", height: "5", fill: "#201008" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "6", width: "1", height: "5", fill: "#3a2210" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "6", width: "1", height: "5", fill: "#3a2210" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "4", width: "16", height: "3", fill: "#4a2a18" }), /* @__PURE__ */ React.createElement("rect", { x: "0", y: "3", width: "16", height: "1", fill: "#6a3a20" }), /* @__PURE__ */ React.createElement("rect", { x: "12", y: "0", width: "2", height: "2", fill: "#2e8b57" }), /* @__PURE__ */ React.createElement("rect", { x: "13", y: "1", width: "1", height: "1", fill: "#3cb371" }), /* @__PURE__ */ React.createElement("rect", { x: "12", y: "2", width: "2", height: "1", fill: "#d4a520" }), /* @__PURE__ */ React.createElement("rect", { x: "13", y: "3", width: "1", height: "1", fill: "#d4a520" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "2", width: "6", height: "2", fill: "#f4e8d0" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "2", width: "3", height: "2", fill: "#fff" }), /* @__PURE__ */ React.createElement("rect", { x: "5", y: "2", width: "1", height: "2", fill: "#dcdcdc" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "3", width: "1", height: "1", fill: "#aaa" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "3", width: "1", height: "1", fill: "#aaa" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "2", width: "1", height: "1", fill: "#111" }), /* @__PURE__ */ React.createElement("path", { d: "M1.5,2 L0,-1", stroke: "#fff", strokeWidth: "0.5", fill: "none" })));
  }
  function PixelGlobe({ col, row }) {
    return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: col * TILE + 4, top: row * TILE + 8, imageRendering: "pixelated", zIndex: row * 10 } }, /* @__PURE__ */ React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 12 12", style: { imageRendering: "pixelated", overflow: "visible" } }, /* @__PURE__ */ React.createElement("ellipse", { cx: "6", cy: "12", rx: "4", ry: "1.5", fill: "rgba(0,0,0,0.4)" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "10", width: "4", height: "2", fill: "#4a2a18" }), /* @__PURE__ */ React.createElement("rect", { x: "5", y: "8", width: "2", height: "2", fill: "#d4a520" }), /* @__PURE__ */ React.createElement("path", { d: "M1,5 Q1,9 6,9 Q11,9 11,5", fill: "none", stroke: "#d4a520", strokeWidth: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "4", width: "1", height: "2", fill: "#d4a520" }), /* @__PURE__ */ React.createElement("rect", { x: "10", y: "4", width: "1", height: "2", fill: "#d4a520" }), /* @__PURE__ */ React.createElement("circle", { cx: "6", cy: "4", r: "3.5", fill: "#1e90ff" }), /* @__PURE__ */ React.createElement("circle", { cx: "6", cy: "4", r: "3.5", fill: "rgba(0,0,0,0.2)" }), /* @__PURE__ */ React.createElement("circle", { cx: "5.5", cy: "3.5", r: "3", fill: "#4169e1" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "2", width: "2", height: "1", fill: "#32cd32" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "3", height: "2", fill: "#228b22" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "5", width: "1", height: "1", fill: "#32cd32" }), /* @__PURE__ */ React.createElement("rect", { x: "7", y: "3", width: "1", height: "3", fill: "#228b22" }), /* @__PURE__ */ React.createElement("rect", { x: "8", y: "2", width: "1", height: "2", fill: "#32cd32" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "2", width: "1", height: "1", fill: "#fff", opacity: "0.6" })));
  }
  function PixelChair({ col, row }) {
    return /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: col * TILE + 6, top: row * TILE + 2, imageRendering: "pixelated", zIndex: row * 10 } }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "28", viewBox: "0 0 10 14", style: { imageRendering: "pixelated", overflow: "visible" } }, /* @__PURE__ */ React.createElement("ellipse", { cx: "5", cy: "13", rx: "3.5", ry: "1", fill: "rgba(0,0,0,0.3)" }), /* @__PURE__ */ React.createElement("rect", { x: "1.5", y: "9", width: "1", height: "4", fill: "#3a2210" }), /* @__PURE__ */ React.createElement("rect", { x: "7.5", y: "9", width: "1", height: "4", fill: "#3a2210" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "9", width: "1", height: "3", fill: "#201008" }), /* @__PURE__ */ React.createElement("rect", { x: "6", y: "9", width: "1", height: "3", fill: "#201008" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "6", width: "8", height: "3", fill: "#4a2a18" }), /* @__PURE__ */ React.createElement("rect", { x: "1", y: "6", width: "8", height: "1", fill: "#6a3a20" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "7", width: "6", height: "1.5", fill: "#803030" }), /* @__PURE__ */ React.createElement("rect", { x: "1.5", y: "1", width: "1", height: "5", fill: "#3a2210" }), /* @__PURE__ */ React.createElement("rect", { x: "7.5", y: "1", width: "1", height: "5", fill: "#3a2210" }), /* @__PURE__ */ React.createElement("rect", { x: "2.5", y: "1", width: "5", height: "2", fill: "#4a2a18" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "1.5", width: "4", height: "1", fill: "#803030" })));
  }
  function LibraryScene({ isLandscape, onBackToVillage, speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume }) {
    const [nearShelf, setNearShelf] = (0, import_react3.useState)(null);
    const [openShelf, setOpenShelf] = (0, import_react3.useState)(null);
    const [phase, setPhase] = (0, import_react3.useState)("intro");
    (0, import_react3.useEffect)(() => {
      localStorage.setItem("musicMuted", JSON.stringify(musicMuted));
    }, [musicMuted]);
    (0, import_react3.useEffect)(() => {
      localStorage.setItem("musicVolume", musicVolume.toString());
    }, [musicVolume]);
    (0, import_react3.useEffect)(() => {
      localStorage.setItem("speedMultiplier", speedMultiplier.toString());
    }, [speedMultiplier]);
    const [tourIndex, setTourIndex] = (0, import_react3.useState)(-1);
    const [arrived, setArrived] = (0, import_react3.useState)(true);
    const [scale, setScale] = (0, import_react3.useState)(1);
    const [internalW, setInternalW] = (0, import_react3.useState)(384);
    const [internalH, setInternalH] = (0, import_react3.useState)(288);
    const musicRef = (0, import_react3.useRef)({ audioCtx: null, interval: null });
    const playStep = (0, import_react3.useCallback)((stepIndex, vol, muted) => {
      if (muted || vol === 0) return;
      try {
        if (!musicRef.current.audioCtx) {
          musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = musicRef.current.audioCtx;
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        const progression = [
          [110, 130.81, 164.81, 196],
          // Am7
          [87.31, 130.81, 174.61, 261.63],
          // Fmaj7
          [130.81, 164.81, 196, 246.94],
          // Cmaj7
          [98, 146.83, 196, 246.94]
          // G7
        ];
        const chordIdx = Math.floor(stepIndex / 8) % progression.length;
        const stepIdx = stepIndex % 8;
        const chord = progression[chordIdx];
        const time = ctx.currentTime;
        if (stepIdx === 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(chord[0], time);
          gain.gain.setValueAtTime(vol * 0.12, time);
          gain.gain.exponentialRampToValueAtTime(1e-3, time + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.8);
        } else if (stepIdx === 4) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(chord[1], time);
          gain.gain.setValueAtTime(vol * 0.1, time);
          gain.gain.exponentialRampToValueAtTime(1e-3, time + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.6);
        }
        const pattern = [0, 1, 2, 3, 2, 1, 0, -1];
        const noteIdx = pattern[stepIdx];
        if (noteIdx !== -1) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          const f = chord[noteIdx] * (stepIdx > 4 ? 2 : 1.5);
          osc.frequency.setValueAtTime(f, time);
          gain.gain.setValueAtTime(vol * 0.04, time);
          gain.gain.exponentialRampToValueAtTime(1e-3, time + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.16);
        }
      } catch (e) {
        console.error("Audio synth error", e);
      }
    }, []);
    (0, import_react3.useEffect)(() => {
      if (!musicPlaying) {
        if (musicRef.current.interval) {
          clearInterval(musicRef.current.interval);
          musicRef.current.interval = null;
        }
        return;
      }
      let step = 0;
      const ms = Math.round(240 / speedMultiplier);
      musicRef.current.interval = setInterval(() => {
        playStep(step, musicVolume, musicMuted);
        step++;
      }, ms);
      return () => {
        if (musicRef.current.interval) {
          clearInterval(musicRef.current.interval);
        }
      };
    }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);
    const [shelves, setShelves] = (0, import_react3.useState)(SHELF_LAYOUT.map((l) => ({ ...l, label: "Loading...", count: 0, type: "normal", books: [] })));
    const containerRef = (0, import_react3.useRef)(null);
    const moveTimerRef = (0, import_react3.useRef)(0);
    const keysRef = (0, import_react3.useRef)({});
    const tourTimerRef = (0, import_react3.useRef)(null);
    const arriveTimeoutRef = (0, import_react3.useRef)(null);
    (0, import_react3.useEffect)(() => {
      async function fetchShelves() {
        try {
          const res = await fetch("/api/goodreads");
          if (!res.ok) throw new Error("API route failed or returned 404 in Vite");
          const data = await res.json();
          const merged = SHELF_LAYOUT.map((layout) => {
            const apiData = data.find((d) => d.id === layout.id) || { count: 0, books: [], label: layout.id, type: "normal" };
            return { ...layout, ...apiData };
          });
          setShelves(merged);
        } catch (err) {
          console.warn("Failed to fetch /api/goodreads. Falling back to static /goodreads.json for local Vite dev server.", err);
          try {
            const res = await fetch("/goodreads.json");
            const data = await res.json();
            const merged = SHELF_LAYOUT.map((layout) => {
              const apiData = data.find((d) => d.id === layout.id) || { count: 0, books: [], label: layout.id, type: "normal" };
              return { ...layout, ...apiData };
            });
            setShelves(merged);
          } catch (fallbackErr) {
            console.error("Fallback to /goodreads.json also failed.", fallbackErr);
          }
        }
      }
      fetchShelves();
    }, []);
    const introLine = "Welcome to my Library! I'm Saad Ibra. I've synced my Goodreads shelf here. Shall I show you around?";
    const outroLine = "That's the whole collection. Explore freely with the arrow keys or WASD.";
    const currentLine = phase === "intro" ? introLine : phase === "touring" ? tourIndex >= 0 && tourIndex < SHELF_LAYOUT.length ? `[${shelves[tourIndex].label.toUpperCase()}]: ${SHELF_LAYOUT[tourIndex].line}` : outroLine : "";
    const dialogueText = useTypewriter(phase !== "free" ? currentLine : "");
    const startTour = () => {
      setPhase("touring");
      setTourIndex(0);
      setArrived(false);
    };
    const skipIntro = () => setPhase("free");
    const endTour = (0, import_react3.useCallback)(() => {
      clearTimeout(arriveTimeoutRef.current);
      clearInterval(tourTimerRef.current);
      setPhase("free");
    }, []);
    const checkNear = (0, import_react3.useCallback)((col, row) => {
      for (const s of SHELF_LAYOUT) {
        const dc = Math.abs(s.col - col);
        const dr = Math.abs(s.row - row);
        if (dc + dr === 1 || dc === 1 && dr === 1) {
          setNearShelf(s.id);
          return;
        }
      }
      setNearShelf(null);
    }, []);
    const { pos, setPos, facing, stepping } = usePlayerMovement({
      initialPos: START_POS,
      canWalk: (c, r) => {
        if (c === EXIT_DOOR_COL && r === EXIT_DOOR_ROW) {
          onBackToVillage();
          return false;
        }
        return canWalk(c, r);
      },
      speedMultiplier,
      isActive: phase === "free" && !openShelf,
      onMove: (c, r) => {
        checkNear(c, r);
        playWoodStep();
        return false;
      },
      onAction: () => {
        if (nearShelf) setOpenShelf(nearShelf);
      },
      onCancel: () => setOpenShelf(null)
    });
    (0, import_react3.useEffect)(() => {
      const handleResize = () => {
        const isMobile = window.innerWidth < 768;
        const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
        const availableHeight = window.innerHeight - consoleHeight;
        const availableWidth = isLandscape ? window.innerWidth - 320 : window.innerWidth;
        const newScale = Math.max(1, Math.floor(Math.min(availableWidth, availableHeight) / 240));
        setScale(newScale);
        setInternalW(availableWidth / newScale);
        setInternalH(availableHeight / newScale);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
    (0, import_react3.useEffect)(() => {
      const resumeAudio = () => {
        if (!musicRef.current.audioCtx) {
          musicRef.current.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (musicRef.current.audioCtx.state === "suspended") {
          musicRef.current.audioCtx.resume();
        }
      };
      window.addEventListener("keydown", resumeAudio);
      window.addEventListener("click", resumeAudio);
      const down = (e) => {
        const k = e.key.toLowerCase();
        keysRef.current[k] = true;
        if (phase === "intro") {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setPhase("touring");
            setTourIndex(0);
            setArrived(false);
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setPhase("free");
            return;
          }
        }
        if (phase === "touring" && (e.key === " " || e.key === "Enter" || e.key === "Escape")) {
          e.preventDefault();
          clearTimeout(arriveTimeoutRef.current);
          clearInterval(tourTimerRef.current);
          setPhase("free");
          return;
        }
        if (phase !== "free") return;
        if ((e.key === "Enter" || e.key === " ") && nearShelf) {
          e.preventDefault();
          setOpenShelf(nearShelf);
        }
        if (e.key === "Escape") setOpenShelf(null);
      };
      const up = (e) => {
        keysRef.current[e.key.toLowerCase()] = false;
      };
      window.addEventListener("keydown", down);
      window.addEventListener("keyup", up);
      return () => {
        window.removeEventListener("keydown", down);
        window.removeEventListener("keyup", up);
        window.removeEventListener("keydown", resumeAudio);
        window.removeEventListener("click", resumeAudio);
      };
    }, [nearShelf, phase]);
    (0, import_react3.useEffect)(() => {
      if (phase !== "touring" || !arrived) return;
      arriveTimeoutRef.current = setTimeout(() => {
        setTourIndex((i) => i + 1);
        setArrived(false);
      }, TOUR_PAUSE_MS / speedMultiplier);
      return () => clearTimeout(arriveTimeoutRef.current);
    }, [phase, arrived, speedMultiplier]);
    (0, import_react3.useEffect)(() => {
      if (phase === "touring" && tourIndex >= SHELF_LAYOUT.length) {
        arriveTimeoutRef.current = setTimeout(() => setPhase("free"), TOUR_PAUSE_MS / speedMultiplier);
        return () => clearTimeout(arriveTimeoutRef.current);
      }
    }, [phase, tourIndex, speedMultiplier]);
    (0, import_react3.useEffect)(() => {
      if (phase !== "touring" || arrived || tourIndex < 0 || tourIndex >= SHELF_LAYOUT.length) return;
      const target = SHELF_LAYOUT[tourIndex];
      const tc = target.tourCol, tr = target.tourRow;
      const moveOneStep = () => {
        setPos((p) => {
          if (p.col === tc && p.row === tr) {
            setArrived(true);
            setStepping(false);
            checkNear(p.col, p.row);
            return p;
          }
          const dc = Math.sign(tc - p.col);
          const dr = Math.sign(tr - p.row);
          if (dc !== 0 && canWalk(p.col + dc, p.row)) {
            setFacing(dc > 0 ? "right" : "left");
            setStepping((s) => !s);
            const np = { col: p.col + dc, row: p.row };
            checkNear(np.col, np.row);
            return np;
          }
          if (dr !== 0 && canWalk(p.col, p.row + dr)) {
            setFacing(dr > 0 ? "down" : "up");
            setStepping((s) => !s);
            const np = { col: p.col, row: p.row + dr };
            checkNear(np.col, np.row);
            return np;
          }
          if (dr !== 0 && canWalk(p.col, p.row + dr)) {
            setFacing(dr > 0 ? "down" : "up");
            setStepping((s) => !s);
            return { col: p.col, row: p.row + dr };
          }
          if (dc !== 0 && canWalk(p.col + dc, p.row)) {
            setFacing(dc > 0 ? "right" : "left");
            setStepping((s) => !s);
            return { col: p.col + dc, row: p.row };
          }
          setArrived(true);
          return p;
        });
      };
      tourTimerRef.current = setInterval(moveOneStep, TOUR_MOVE_MS / speedMultiplier);
      return () => clearInterval(tourTimerRef.current);
    }, [phase, tourIndex, arrived, checkNear, speedMultiplier]);
    const activeShelf = shelves.find((s) => s.id === nearShelf);
    const modalShelf = shelves.find((s) => s.id === openShelf);
    const highlightedShelfId = phase === "touring" && tourIndex >= 0 && tourIndex < SHELF_LAYOUT.length ? SHELF_LAYOUT[tourIndex].id : nearShelf;
    const rawCamX = pos.col * TILE + TILE / 2 - internalW / 2;
    const rawCamY = pos.row * TILE + TILE / 2 - internalH / 2;
    const camX = Math.max(0, Math.min(Math.max(0, MAP_COLS * TILE - internalW), rawCamX));
    const camY = Math.max(0, Math.min(Math.max(0, MAP_ROWS * TILE - internalH), rawCamY));
    const transitionTime = (0.14 / speedMultiplier).toFixed(2);
    return /* @__PURE__ */ React.createElement("div", { ref: containerRef, style: {
      position: "fixed",
      inset: 0,
      display: "flex",
      flexDirection: isLandscape ? "row" : "column",
      background: "#05050a",
      overflow: "hidden",
      margin: 0,
      padding: 0,
      fontFamily: "'Press Start 2P', monospace",
      color: "#f4e8d0",
      userSelect: "none",
      boxSizing: "border-box",
      height: "100dvh",
      width: "100dvw"
    } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("style", null, `
        body { margin: 0; padding: 0; overflow: hidden; background: #05050a; }
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes shelfPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes lanternFlicker { 0%{opacity:0.8; transform: scale(0.95)} 100%{opacity:1; transform: scale(1.05)} }
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .retro-scrollbar::-webkit-scrollbar { width: 12px; }
        .retro-scrollbar::-webkit-scrollbar-track { background: #0a0a18; border-left: 2px solid #1a1a28; }
        .retro-scrollbar::-webkit-scrollbar-thumb { background: #f4e8d0; border: 2px solid #1a1a28; border-radius: 0; }
        .retro-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
      `), /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      transform: `scale(${scale})`,
      transformOrigin: "center",
      imageRendering: "pixelated"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      position: "relative",
      width: internalW,
      height: internalH,
      overflow: "hidden",
      background: "#000",
      boxShadow: "0 0 0 4px #1a1a28, 0 8px 32px rgba(0,0,0,0.8)",
      imageRendering: "pixelated"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      width: MAP_COLS * TILE,
      height: MAP_ROWS * TILE,
      left: -camX,
      top: -camY
    } }, MAP.map((row, r) => row.map((tile, c) => {
      if (tile === 0) return null;
      let bg = "none";
      let boxS = "none";
      if (tile === 2) {
        bg = "repeating-linear-gradient(90deg, #3a1c22, #3a1c22 4px, #422026 4px, #422026 8px)";
        boxS = "inset 0 -3px 0 #201008, inset 0 -4px 0 #3a1a10, inset 0 -8px 8px rgba(0,0,0,0.5)";
      } else if (tile === 3) {
        bg = "#4c2828";
        boxS = "inset 0 0 0 1px #3a1a1a, inset 2px 2px 4px rgba(0,0,0,0.3)";
      } else if (tile === 1) {
        bg = (r + c) % 2 === 0 ? "#4a3320" : "#422a18";
        boxS = "inset 0 0 0 1px rgba(0,0,0,0.2)";
      }
      return /* @__PURE__ */ React.createElement("div", { key: `${r}-${c}`, style: {
        position: "absolute",
        left: c * TILE,
        top: r * TILE,
        width: TILE,
        height: TILE,
        background: bg,
        boxShadow: boxS
      } });
    })), MAP[1] && MAP[1].map((t, c) => t === 2 ? /* @__PURE__ */ React.createElement("div", { key: `wt${c}`, style: { position: "absolute", left: c * TILE, top: 1 * TILE + TILE - 4, width: TILE, height: 4, background: "#6b4a2e" } }, /* @__PURE__ */ React.createElement("div", { style: { height: 2, background: "#8a6a42" } })) : null), MAP[8] && MAP[8].map((t, c) => t === 2 ? /* @__PURE__ */ React.createElement("div", { key: `wt2${c}`, style: { position: "absolute", left: c * TILE, top: 8 * TILE + TILE - 4, width: TILE, height: 4, background: "#6b4a2e" } }, /* @__PURE__ */ React.createElement("div", { style: { height: 2, background: "#8a6a42" } })) : null), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: 5 * TILE,
      top: 1 * TILE,
      width: TILE * 2,
      height: TILE - 4,
      background: "#182848",
      border: "2px solid #6b4a2e",
      boxShadow: "inset 0 0 12px rgba(80,120,200,0.3)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#6b4a2e", transform: "translateX(-50%)" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#6b4a2e", transform: "translateY(-50%)" } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", left: 6, top: 4, width: 2, height: 2, background: "#fff", opacity: 0.8 } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", right: 8, top: 6, width: 2, height: 2, background: "#fff", opacity: 0.6 } }), /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", right: 4, top: 14, width: 6, height: 6, borderRadius: "50%", background: "#e8e0c0", boxShadow: "0 0 4px rgba(232,224,192,0.4)" } })), /* @__PURE__ */ React.createElement(PixelLantern, { col: 1, row: 1 }), /* @__PURE__ */ React.createElement(PixelLantern, { col: 11, row: 1 }), /* @__PURE__ */ React.createElement(PixelLantern, { col: 17, row: 8 }), /* @__PURE__ */ React.createElement(WallBookcase, { col: 3, row: 1 }), /* @__PURE__ */ React.createElement(WallBookcase, { col: 9, row: 1, flip: true }), /* @__PURE__ */ React.createElement(WallBookcase, { col: 14, row: 8 }), /* @__PURE__ */ React.createElement(ReadingDesk, { col: 10, row: 3 }), /* @__PURE__ */ React.createElement(PixelGlobe, { col: 5, row: 7 }), /* @__PURE__ */ React.createElement(PixelChair, { col: 3, row: 8 }), shelves.map((s) => /* @__PURE__ */ React.createElement(
      PixelShelf,
      {
        key: s.id,
        shelf: s,
        isNear: highlightedShelfId === s.id,
        onClick: () => {
          if (phase === "free") setOpenShelf(s.id);
        }
      }
    )), /* @__PURE__ */ React.createElement(ExitDoor, { col: EXIT_DOOR_COL, row: EXIT_DOOR_ROW }), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      left: pos.col * TILE,
      top: pos.row * TILE,
      width: TILE,
      height: TILE,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: pos.row * 10 + 5
    } }, /* @__PURE__ */ React.createElement(PlayerSprite, { direction: facing, stepping, costume: "casual" })), /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)"
    } })), /* @__PURE__ */ React.createElement("button", { onClick: onBackToVillage, style: {
      position: "absolute",
      top: 8,
      left: 8,
      fontFamily: "'Press Start 2P', monospace",
      fontSize: 6,
      background: "#1a2b1a",
      color: "#eef7f2",
      border: "2px solid #eef7f2",
      padding: "4px 8px",
      cursor: "pointer",
      borderRadius: 2,
      zIndex: 500,
      boxShadow: "0 2px 0 #060e08"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4 } }, /* @__PURE__ */ React.createElement(import_lucide_react.ArrowLeft, { size: 6, strokeWidth: 3 }), " VILLAGE")), phase === "free" && activeShelf && !openShelf && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      bottom: 12,
      left: "50%",
      transform: "translateX(-50%)",
      padding: "4px 8px",
      background: "rgba(10,10,20,0.85)",
      border: "2px solid #f4e8d0",
      borderRadius: 4,
      zIndex: 650,
      pointerEvents: "none",
      display: "flex",
      gap: 8,
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.6)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, alignItems: "center", fontSize: 6, color: TYPE_COLORS[activeShelf.type].light } }, getShelfIcon(activeShelf.id, 8), /* @__PURE__ */ React.createElement("span", null, activeShelf.label.toUpperCase())), /* @__PURE__ */ React.createElement("div", { style: {
      fontSize: 5,
      color: "#ffbaba",
      background: "rgba(0,0,0,0.4)",
      padding: "2px 4px",
      borderRadius: 2
    } }, "SPACE")), phase !== "free" && /* @__PURE__ */ React.createElement("div", { style: {
      position: "absolute",
      bottom: 8,
      left: 8,
      right: 8,
      padding: "18px 14px 10px",
      background: "rgba(10,10,20,0.94)",
      border: "2px solid #f4e8d0",
      borderRadius: 2,
      boxShadow: "inset 0 0 0 2px rgba(10,10,20,0.94), inset 0 0 0 4px #888",
      zIndex: 650
    } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: -12, left: 10, background: "#1a1a28", border: "2px solid #f4e8d0", padding: "2px 8px", fontSize: 7, color: "#f8d878", borderRadius: 2 } }, "SAAD IBRA"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9, lineHeight: 2.2, minHeight: 32, color: "#f4e8d0" } }, dialogueText, /* @__PURE__ */ React.createElement("span", { style: { opacity: dialogueText.length < currentLine.length ? 1 : 0, animation: "dialogBlink 0.5s step-end infinite" } }, "\u258A")), phase === "intro" && dialogueText.length >= currentLine.length && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: startTour, style: { fontFamily: "'Press Start 2P', monospace", fontSize: 7, background: "#e04040", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 2, cursor: "pointer", boxShadow: "0 3px 0 #a02020, inset 0 1px 0 rgba(255,255,255,0.2)", imageRendering: "pixelated", display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 5, color: "#ffbaba", marginRight: 8, background: "rgba(0,0,0,0.2)", padding: "2px 4px", borderRadius: 2 } }, "SPACE"), "SHOW ME AROUND"), /* @__PURE__ */ React.createElement("button", { onClick: skipIntro, style: { fontFamily: "'Press Start 2P', monospace", fontSize: 7, background: "transparent", color: "#a8a8b8", border: "2px solid #a8a8b8", padding: "6px 12px", borderRadius: 2, cursor: "pointer", imageRendering: "pixelated", display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 5, color: "#888", marginRight: 8, border: "1px solid #888", padding: "1px 3px", borderRadius: 2 } }, "ESC"), "I'LL EXPLORE")), phase === "touring" && /* @__PURE__ */ React.createElement("button", { onClick: endTour, style: { fontFamily: "'Press Start 2P', monospace", fontSize: 6, background: "transparent", color: "#888", border: "none", padding: "6px 0 0", cursor: "pointer", textDecoration: "underline", imageRendering: "pixelated", display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 4, color: "#666", marginRight: 4, border: "1px solid #666", padding: "1px 2px", borderRadius: 2 } }, "ESC"), "skip tour >"), phase === "touring" && dialogueText.length >= currentLine.length && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", right: 12, bottom: 8, fontSize: 10, animation: "dialogBlink 0.8s step-end infinite", color: "#f4e8d0" } }, "v")), modalShelf && /* @__PURE__ */ React.createElement("div", { onClick: () => setOpenShelf(null), style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 700, imageRendering: "pixelated" } }, /* @__PURE__ */ React.createElement("div", { className: "retro-scrollbar", onClick: (e) => e.stopPropagation(), style: { background: "#1a1a28", border: "4px solid #f4e8d0", borderRadius: 2, width: 340, maxWidth: "95%", maxHeight: "90%", overflowY: "auto", overflowX: "hidden", boxShadow: "0 0 0 2px #1a1a28, 0 0 0 6px #888, 0 10px 30px rgba(0,0,0,0.8)" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "8px 12px", background: TYPE_COLORS[modalShelf.type].primary, borderBottom: `3px solid ${TYPE_COLORS[modalShelf.type].dark}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 7, color: "#fff", textShadow: `1px 1px 0 ${TYPE_COLORS[modalShelf.type].dark}`, display: "flex", alignItems: "center", gap: 6 } }, getShelfIcon(modalShelf.id, 10), " ", modalShelf.label.toUpperCase()), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 6, color: "#fff", opacity: 0.8, background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: 2 } }, modalShelf.count, " BOOK", modalShelf.count === 1 ? "" : "S"), /* @__PURE__ */ React.createElement("button", { onClick: () => setOpenShelf(null), style: { fontFamily: "'Press Start 2P', monospace", fontSize: 6, background: "#d04040", color: "#fff", border: "2px solid #f4e8d0", padding: "2px 4px", borderRadius: 2, cursor: "pointer", boxShadow: "0 2px 0 #802020", imageRendering: "pixelated", display: "flex", alignItems: "center", justifyContent: "center" }, "aria-label": "Close" }, "X"))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, padding: 8 } }, modalShelf.books.map((b, i) => /* @__PURE__ */ React.createElement(PixelBookCover, { key: i, book: b, typeColors: TYPE_COLORS[modalShelf.type] })))))))), /* @__PURE__ */ React.createElement(
      ControlBar,
      {
        musicPlaying,
        musicMuted,
        musicVolume,
        speedMultiplier,
        onTogglePlay: () => musicPlaying ? setMusicMuted(!musicMuted) : setMusicPlaying(true),
        onChangeVolume: setMusicVolume,
        onChangeSpeed: setSpeedMultiplier
      }
    ));
  }
})();
