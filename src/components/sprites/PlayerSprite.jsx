/**
 * PlayerSprite — Pixel-art character renderer.
 *
 * Accepts a `costume` prop that swaps palette and accessories per room.
 * Costumes: "casual" (default), "labcoat", "newsroom", "village"
 *
 * Idle animation: after 3 seconds of standing still the character gets bored —
 *   eyes drift lazily left then right, the right foot taps impatiently,
 *   and eventually whistles a note (puckered mouth + floating ♪).
 */
import React, { memo, useState, useEffect, useRef } from 'react';
import { TILE } from '../../engine/constants';
import { playWhistle } from '../../engine/sfx';

/* ────────────────────────────────────────────
   COSTUME PALETTE TABLE
   ──────────────────────────────────────────── */
const COSTUMES = {
  casual: {
    hair: "#3a1c08", hairLight: "#5a3018",
    shirt: "#e04040", shirtShade: "#b83030",
    pants: "#2850a0", pantsStripe: "#183878",
    shoe: "#282828",
    accessories: () => null,
  },
  labcoat: {
    hair: "#4a4a4a", hairLight: "#6a6a6a",
    shirt: "#f4f4f6", shirtShade: "#f4f4f6",
    pants: "#304050", pantsStripe: null,
    shoe: "#1a1a1a",
    accessories: (px, direction) => {
      if (direction === "down") return (<>{px(6,10,1,1,"#aaa")}{px(6,12,1,1,"#aaa")}</>);
      return null;
    },
    sideAccessories: (px) => (<>{px(13,11,1,2,"#ffffff")}{px(13,12,1,1,"#00ffcc")}</>),
  },
  newsroom: {
    hair: "#2c1b18", hairLight: "#4a3828",
    shirt: "#8b4513", shirtShade: "#8b4513",
    pants: "#2a2a3a", pantsStripe: null,
    shoe: "#1a1a1a",
    accessories: () => null,
  },
  village: {
    hair: "#3a1c08", hairLight: "#5a3018",
    shirt: "#c09060", shirtShade: "#a07040",
    pants: "#6a4a30", pantsStripe: null,
    shoe: "#302010",
    accessories: () => null,
  },
};

const spriteStyle = { imageRendering: "pixelated", overflow: "visible" };

/* ────────────────────────────────────────────
   IDLE ANIMATION CHOREOGRAPHY
   ────────────────────────────────────────────
   Runs at 500ms per tick (~13s full loop).
   Each frame encodes:
     eye  — pupil offset (-1 = look left, 0 = center, 2 = look up)
     foot — true = right foot lifted 1px
     wh   — whistle phase (-1 off, 0-3 = note appearing & rising)
   ──────────────────────────────────────────── */
const IDLE_SEQ = [
  // 0-2   settle in, bored stare
  { eye: 0,  foot: false, wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
  // 3-5   slow glance left
  { eye: -1, foot: false, wh: -1 },
  { eye: -1, foot: false, wh: -1 },
  { eye: -1, foot: false, wh: -1 },
  // 6     recenter
  { eye: 0,  foot: false, wh: -1 },
  // 7-9   glance upward
  { eye: 2,  foot: false, wh: -1 },
  { eye: 2,  foot: false, wh: -1 },
  { eye: 2,  foot: false, wh: -1 },
  // 10    recenter
  { eye: 0,  foot: false, wh: -1 },
  // 11    tiny pause
  { eye: 0,  foot: false, wh: -1 },
  // 12-17 lazy right-foot tap (tap-rest-tap-rest-tap-rest)
  { eye: 0,  foot: true,  wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
  { eye: 0,  foot: true,  wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
  { eye: 0,  foot: true,  wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
  // 18-19 pause before whistle
  { eye: 0,  foot: false, wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
  // 20-23 whistle (puckered mouth + rising ♪ note)
  { eye: 0,  foot: false, wh: 0 },
  { eye: 0,  foot: false, wh: 1 },
  { eye: 0,  foot: false, wh: 2 },
  { eye: 0,  foot: false, wh: 3 },
  // 24-26 wind down
  { eye: 0,  foot: false, wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
  { eye: 0,  foot: false, wh: -1 },
];

const IDLE_DELAY_MS = 3000;   // 3 s standing still before anim kicks in
const IDLE_TICK_MS  = 500;    // half-second per frame — unhurried & lazy
const NOTE_COLOR    = "#181818"; // black note
const WHISTLE_RISE  = [0, 2, 4, 6];       // pixels the note floats up per phase
const WHISTLE_ALPHA = [0.9, 1, 0.8, 0.35]; // note fades out

/* ────────────────────────────────────────────
   COMPONENT
   ──────────────────────────────────────────── */
function PlayerSpriteInner({ direction, stepping, costume = "casual" }) {
  const c = COSTUMES[costume] || COSTUMES.casual;
  const skin = "#fcd8b4", skinShade = "#e8b888";
  const eye = "#181818", white = "#ffffff";

  // ── idle state machine ──
  const [isIdle, setIsIdle] = useState(false);
  const [idleFrame, setIdleFrame] = useState(0);
  const idleTimerRef = useRef(null);
  const idleTickRef  = useRef(null);
  const steppingRef  = useRef(stepping);

  useEffect(() => {
    steppingRef.current = stepping;

    if (stepping) {
      // moving → kill idle immediately
      setIsIdle(false);
      setIdleFrame(0);
      if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
      if (idleTickRef.current)  { clearInterval(idleTickRef.current);  idleTickRef.current  = null; }
    } else {
      // stopped → start 3-second countdown
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!steppingRef.current) { setIsIdle(true); setIdleFrame(0); }
      }, IDLE_DELAY_MS);
    }
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [stepping]);

  useEffect(() => {
    if (!isIdle) {
      if (idleTickRef.current) { clearInterval(idleTickRef.current); idleTickRef.current = null; }
      return;
    }
    idleTickRef.current = setInterval(() => setIdleFrame(f => f + 1), IDLE_TICK_MS);
    return () => { if (idleTickRef.current) clearInterval(idleTickRef.current); };
  }, [isIdle]);

  // ── derive current idle values ──
  const seq       = isIdle ? IDLE_SEQ[idleFrame % IDLE_SEQ.length] : null;
  const eyeShift  = seq ? seq.eye  : 0;   // -1 left, 0 center, 2 up
  const footUp    = seq ? seq.foot : false; // only the right foot
  const whistleP  = seq ? seq.wh   : -1;  // -1 = not whistling

  // play whistle sound when the whistle phase begins
  const prevWhistleRef = useRef(-1);
  useEffect(() => {
    if (whistleP === 0 && prevWhistleRef.current !== 0) {
      playWhistle();
    }
    prevWhistleRef.current = whistleP;
  }, [whistleP]);

  const frame = stepping ? 1 : 0;

  // ── pixel helper ──
  const px = (x, y, w, h, color) => (
    <rect key={`${x}-${y}-${color}`} x={x} y={y} width={w} height={h} fill={color} />
  );

  /* ────────── WHISTLE NOTE (floating ♪) ────────── */
  const renderWhistleNote = () => {
    if (whistleP < 0) return null;
    const rise  = WHISTLE_RISE[whistleP];
    const alpha = WHISTLE_ALPHA[whistleP];
    // position the note near the character's head based on facing direction
    let nx, ny;
    if (direction === "down")       { nx = 13; ny = 2 - rise; }
    else if (direction === "up")    { nx = 12; ny = 1 - rise; }
    else if (direction === "right") { nx = 14; ny = 2 - rise; }
    else /* left */                 { nx = 0;  ny = 2 - rise; }
    return (
      <g opacity={alpha}>
        {/* note head (2×1 oval) */}
        <rect x={nx} y={ny} width={2} height={1} fill={NOTE_COLOR} />
        {/* stem going up */}
        <rect x={nx + 1} y={ny - 3} width={1} height={3} fill={NOTE_COLOR} />
        {/* flag tick */}
        <rect x={nx + 2} y={ny - 3} width={1} height={1} fill={NOTE_COLOR} />
        <rect x={nx + 2} y={ny - 2} width={1} height={1} fill={NOTE_COLOR} />
      </g>
    );
  };

  /* ────────── DOWN (facing camera) ────────── */
  const renderDown = () => {
    const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
    const ft = footUp ? -1 : 0; // right shoe lifts

    // eye gaze
    let pLx = 6, pLy = 6, pRx = 10, pRy = 6;
    if (eyeShift === -1) { pLx = 5; pRx = 9; }          // pupils shift left
    if (eyeShift === 2)  { pLy = 5; pRy = 5; }           // pupils shift up

    // mouth: puckered when whistling
    const isW = whistleP >= 0;

    return (<>
      {/* hair */}
      {px(4,0,8,2,c.hair)}{px(3,1,10,1,c.hair)}{px(3,2,10,2,c.hair)}
      {/* face */}
      {px(4,4,8,5,skin)}{px(3,4,1,4,skin)}{px(12,4,1,4,skin)}
      {/* eyes */}
      {px(5,5,2,2,white)}{px(9,5,2,2,white)}
      {px(pLx,pLy,1,1,eye)}{px(pRx,pRy,1,1,eye)}
      {/* mouth — pucker when whistling */}
      {isW ? px(8,8,1,1,"#d0967a") : px(7,8,2,1,skinShade)}
      {/* shirt */}
      {px(3,9,10,4,c.shirt)}{px(2,10,1,3,c.shirt)}{px(13,10,1,3,c.shirt)}
      {c.shirtShade !== c.shirt && px(4,9,8,1,c.shirtShade)}
      {/* arms */}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {c.accessories && c.accessories(px, "down")}
      {/* pants */}
      {px(4,13,3,2,c.pants)}{px(9,13,3,2,c.pants)}
      {c.pantsStripe && px(7,13,2,1,c.pantsStripe)}
      {/* shoes — only right foot taps */}
      {px(4,15+lL,3,1,c.shoe)}{px(9,15+lR+ft,3,1,c.shoe)}
    </>);
  };

  /* ────────── UP (facing away) ────────── */
  const renderUp = () => {
    const lL = frame ? 1 : 0, lR = frame ? -1 : 0;
    const ft = footUp ? -1 : 0;

    return (<>
      {px(4,0,8,2,c.hair)}{px(3,1,10,1,c.hair)}{px(3,2,10,6,c.hair)}{px(4,7,8,2,c.hairLight)}
      {px(3,9,10,4,c.shirt)}{px(2,10,1,3,c.shirt)}{px(13,10,1,3,c.shirt)}
      {px(1,10,2,3,skin)}{px(13,10,2,3,skin)}
      {px(4,13,3,2,c.pants)}{px(9,13,3,2,c.pants)}
      {c.pantsStripe && px(7,13,2,1,c.pantsStripe)}
      {/* shoes — only right foot taps */}
      {px(4,15+lL,3,1,c.shoe)}{px(9,15+lR+ft,3,1,c.shoe)}
    </>);
  };

  /* ────────── SIDE (left/right) ────────── */
  const renderSide = (flip) => {
    const lo = frame ? 1 : 0;
    const ft = footUp ? -1 : 0; // back foot (right in world) taps

    // side-view pupil: default at (11,6).
    // eye=-1 → look back (10,6); eye=2 → look up (11,5)
    let pX = 11, pY = 6;
    if (eyeShift === -1) { pX = 10; }
    if (eyeShift === 2)  { pY = 5; }

    const isW = whistleP >= 0;

    return (
      <g transform={flip ? "translate(16,0) scale(-1,1)" : undefined}>
        {/* hair */}
        {px(5,0,7,2,c.hair)}{px(4,1,9,1,c.hair)}{px(4,2,9,2,c.hair)}{px(3,3,2,3,c.hair)}
        {/* face */}
        {px(5,4,7,5,skin)}{px(4,5,1,3,skin)}{px(12,5,1,3,skin)}
        {/* eye */}
        {px(10,5,2,2,white)}{px(pX,pY,1,1,eye)}
        {/* mouth — pucker when whistling */}
        {isW ? px(12,7,1,1,"#d0967a") : px(10,8,2,1,skinShade)}
        {/* shirt */}
        {px(4,9,9,4,c.shirt)}{px(3,10,1,3,c.shirt)}
        {/* arm */}
        {px(12,10,2,3,skin)}
        {c.sideAccessories && c.sideAccessories(px)}
        {/* pants */}
        {px(5,13,3,2,c.pants)}{px(9,13,3,2,c.pants)}
        {/* shoes — back foot taps */}
        {px(5,15,3,1+lo,c.shoe)}{px(9,15+ft,3,1,c.shoe)}
      </g>
    );
  };

  /* ────────── COMPOSE SVG ────────── */
  return (
    <svg width={TILE} height={TILE+2} viewBox="0 0 16 17" style={spriteStyle}>
      <ellipse cx="8" cy="16.5" rx="5" ry="1.5" fill="rgba(0,0,0,0.3)" />
      {direction === "down"  && renderDown()}
      {direction === "up"    && renderUp()}
      {direction === "left"  && renderSide(true)}
      {direction === "right" && renderSide(false)}
      {renderWhistleNote()}
    </svg>
  );
}

const PlayerSprite = memo(PlayerSpriteInner);
export default PlayerSprite;
