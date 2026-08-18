"use client";
import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from "react";
import { useCameraLerp } from '../hooks/useCameraLerp.js';
import { getSharedAudioCtx } from '../engine/sfx.js';
import { renderControlText } from '../utils/renderControls';
import { ArrowLeft, Terminal, ScrollText, Lock, Hexagon, Star } from "lucide-react";
import { TILE } from '../engine/constants';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { playTileStep } from '../engine/sfx';
import PlayerSprite from '../components/sprites/PlayerSprite';
import ControlBar from '../components/ui/ControlBar';
import ExitDoor from '../components/sprites/ExitDoor';
import SaadSprite from '../components/sprites/SaadSprite';


// ============================================================
//  DYNAMIC LAB LAYOUT GENERATOR
//  Creates an L-shaped room that grows with your repo count.
//  Public repos line the top wall; private vault hangs off bottom-right.
// ============================================================
function generateLabLayout(publicRepos, privateRepos) {
  const pubCount = publicRepos.length;
  const privCount = privateRepos.length;

  // Public wing width grows by 2 tiles per repo
  const pubWidth = Math.max(14, pubCount * 2 + 10);
  const pubHeight = 7; // rows 0–6; row 0 void, row 1 wall, rows 2–6 floor

  // Private vault: vertical wing attached at bottom-right
  const privHeight = privCount > 0 ? Math.max(6, privCount * 2 + 4) : 0;
  const privWidth  = privCount > 0 ? 7 : 0;
  const privStartCol = pubWidth - privWidth - 1;

  const totalCols = pubWidth;
  const totalRows = pubHeight + privHeight;

  // Build tile map (all void by default)
  const map = Array.from({ length: totalRows }, () => Array(totalCols).fill(0));

  // === PUBLIC WING ===
  for (let c = 1; c < pubWidth - 1; c++) map[1][c] = 2; // top wall
  for (let r = 2; r <= 6; r++)
    for (let c = 1; c < pubWidth - 1; c++) map[r][c] = 1;
  // Rubber safety mat strip in the middle rows
  for (let r = 4; r <= 5; r++)
    for (let c = 3; c < pubWidth - 3; c++)
      if (map[r][c] === 1) map[r][c] = 3;

  // === PRIVATE VAULT (L-shape extension) ===
  // Seamlessly connects to public wing at row 6
  if (privCount > 0) {
    for (let r = 6; r < totalRows - 1; r++)
      for (let c = privStartCol; c < totalCols - 1; c++)
        if (map[r][c] === 0) map[r][c] = 1;
  }

  // === STATIONS ===
  const chalkCol = Math.max(2, pubWidth - 4);
  const stations = [{
    id: "chalkboard", col: chalkCol, row: 1,
    label: "GitHub Profile", line: "github.com/saad-ibra",
    isPrivate: false, repoData: null,
  }];

  // Public terminals every 2 cols, skipping chalkCol
  const pubCols = [];
  for (let c = 2; c < pubWidth - 2; c += 2)
    if (c !== chalkCol) pubCols.push(c);

  publicRepos.slice(0, pubCols.length).forEach((repo, i) => {
    stations.push({
      id: `pub-${i}`, col: pubCols[i], row: 2,
      label: repo.name,
      line: repo.description || repo.name,
      isPrivate: false, repoData: repo,
    });
  });

  // Private terminals along right wall of vault
  privateRepos.forEach((repo, i) => {
    const col = totalCols - 2;
    const row = pubHeight + 1 + i * 2;
    if (row < totalRows - 2) {
      stations.push({
        id: `priv-${i}`, col, row,
        label: repo.name,
        line: `CLASSIFIED: ${repo.name}`,
        isPrivate: true, repoData: repo,
      });
    }
  });

  const stationTiles = new Set(stations.map(s => `${s.col},${s.row}`));
  const startPos = { col: Math.floor(pubWidth / 2), row: 4 };

  return { map, totalCols, totalRows, stations, stationTiles, startPos, chalkCol };
}

function isLayoutWalkable(layout, col, row) {
  if (row < 0 || row >= layout.totalRows || col < 0 || col >= layout.totalCols) return false;
  const t = layout.map[row][col];
  return t === 1 || t === 3;
}
function canLayoutWalk(layout, col, row) {
  if (layout.stationTiles.has(`${col},${row}`)) return false;
  return isLayoutWalkable(layout, col, row);
}

// ============================================================
//  CHALKBOARD  — interactable; subtle glow when player is near
//  Link is chalk text — no separate button
// ============================================================
function Chalkboard({ stats, isNear, chalkCol, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;
  const boardW = 4 * TILE;
  const left   = chalkCol * TILE - boardW / 2 + TILE / 2;
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      position: "absolute",
      left, top: TILE - 12,
      width: boardW, height: 58,
      background: "#162820",
      border: `4px solid ${active ? "#8a7060" : "#4a3018"}`,
      boxShadow: active
        ? "inset 0 0 6px rgba(0,0,0,0.8), 0 0 18px rgba(120,220,140,0.18), 0 4px 12px rgba(0,0,0,0.5)"
        : "inset 0 0 8px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.4)",
      transition: "box-shadow 0.4s, border-color 0.4s",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "4px 8px", boxSizing: "border-box",
      fontFamily: "'Press Start 2P', monospace",
      color: "#c4e8bc", zIndex: 15, cursor: "pointer",
    }}>
      {/* Chalk header */}
      <div style={{ fontSize: 4.5, textAlign: "center", borderBottom: "1px dashed rgba(196,232,188,0.2)", paddingBottom: 2, marginBottom: 3, opacity: 0.8 }}>
        EXPERIMENTS LOG
      </div>
      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 4, marginBottom: 3 }}>
        <span style={{ color: "#60ffc0" }}>PUB {stats.public}</span>
        <span style={{ color: "#ff8888" }}>PRIV {stats.private}</span>
      </div>
      {/* Link line — changes with proximity/hover */}
      <div style={{
        fontSize: 4,
        textAlign: "center",
        color: active ? "#b0f0b8" : "#608068",
        transition: "color 0.4s",
        letterSpacing: "0.2px",
      }}>
        {active ? "▲ SPACE/A — open github" : "github / saad-ibra"}
      </div>
    </div>
  );
}

// ============================================================
//  CHALKBOARD MODAL — EKG GitHub Contributions
// ============================================================
function ChalkboardModal({ commitStats, onClose }) {
  const width = 280;
  const height = 180;
  const rowHeight = 32;

  // Render the SVG lines
  const renderEKG = () => {
    if (!commitStats || !commitStats.years) return null;
    
    const { years, maxMonth } = commitStats;
    const maxCommits = maxMonth?.commits || 1; // avoid div by 0

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
        {/* Draw subtle grid lines for months */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`grid-${i}`} x1={i * (width / 11)} y1={0} x2={i * (width / 11)} y2={height} stroke="rgba(196,232,188,0.1)" strokeDasharray="2 4" />
        ))}
        
        {years.map((yearData, yearIndex) => {
          const baseY = (yearIndex * rowHeight) + 30;
          let points = "";
          let peakPoint = null;
          
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth();

          yearData.months.forEach((commits, i) => {
            // Do not draw lines for months in the future
            if (yearData.year === currentYear && i > currentMonth) return;

            const x = i * (width / 11);
            // Spike height relative to max commits, capped at 25px max height
            const spikeHeight = commits === 0 ? 0 : (commits / maxCommits) * 25;
            const y = baseY - spikeHeight;
            points += `${x},${y} `;

            if (yearData.year === maxMonth.year && i === maxMonth.monthIndex) {
              peakPoint = { x, y };
            }
          });

          return (
            <g key={yearData.year}>
              {/* Year label */}
              <text x={0} y={baseY - 2} fill="rgba(196,232,188,0.5)" fontSize={5} fontFamily="'Press Start 2P', monospace">{yearData.year}</text>
              {/* Heartbeat line */}
              <polyline points={points} fill="none" stroke="#c4e8bc" strokeWidth={1.5} strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 2px rgba(196,232,188,0.4))" }} />
              {/* Peak marker */}
              {peakPoint && (
                <circle cx={peakPoint.x} cy={peakPoint.y} r={2.5} fill="#ffd060" style={{ filter: "drop-shadow(0 0 4px #ffd060)" }} />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#162820", border: "4px solid #4a3018", borderRadius: 4,
          width: 320, maxWidth: "95%",
          boxShadow: "inset 0 0 10px rgba(0,0,0,0.8), 0 12px 32px rgba(0,0,0,0.95)",
          padding: 16,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}
      >
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ color: "#c4e8bc", fontSize: 6, fontFamily: "'Press Start 2P', monospace" }}>GITHUB ACTIVITY</div>
            <a href="https://github.com/saad-ibra" target="_blank" rel="noopener noreferrer" style={{ color: "#b0f0b8", fontSize: 6, textDecoration: "underline", fontFamily: "'Press Start 2P', monospace", marginTop: 6, display: "block" }}>
              github.com/saad-ibra
            </a>
          </div>
          <button onClick={onClose} style={{
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            background: "#4a3018", color: "#c4e8bc", border: "none",
            padding: "4px 8px", borderRadius: 2, cursor: "pointer",
          }}>X</button>
        </div>

          <div style={{ position: "relative", background: "#0e1813", padding: "10px", borderRadius: 4, border: "2px solid #203828", width: "100%", boxSizing: "border-box" }}>
          {!commitStats ? (
            <div style={{ height: height, display: "flex", alignItems: "center", justifyContent: "center", color: "#c4e8bc", fontSize: 5, animation: "dialogBlink 1s infinite" }}>
              ANALYZING COMMITS...
            </div>
          ) : commitStats.error ? (
            <div style={{ height: height, display: "flex", alignItems: "center", justifyContent: "center", color: "#ff8888", fontSize: 4, textAlign: "center", lineHeight: "8px" }}>
              VITE_GITHUB_TOKEN REQUIRED<br/><br/>(ADD TO .env FOR EKG)
            </div>
          ) : (
            <>
              {renderEKG()}
              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(196,232,188,0.5)", fontSize: 4, fontFamily: "'Press Start 2P', monospace", marginTop: 4 }}>
                <span>JAN</span>
                <span>DEC</span>
              </div>
            </>
          )}
        </div>
        
        {commitStats && !commitStats.error && commitStats.maxMonth && (
          <div style={{ color: "#ffd060", fontSize: 4, fontFamily: "'Press Start 2P', monospace", marginTop: 12, textAlign: "center", opacity: 0.8 }}>
            ◆ BUSIEST MONTH: {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][commitStats.maxMonth.monthIndex]} {commitStats.maxMonth.year} ({commitStats.maxMonth.commits} COMMITS)
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  REPO TERMINAL  — one per project, colour-coded per type
// ============================================================
function RepoTerminal({ station, isNear, onClick }) {
  const [hovered, setHovered] = useState(false);
  const active = isNear || hovered;
  const isPriv  = station.isPrivate;
  const glow    = isPriv ? "#ff5252" : "#00ffcc";
  const zIdx    = station.row * 10;
  const truncated = station.label.length > 6 ? station.label.slice(0, 5) + "…" : station.label;

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      position: "absolute",
      left: station.col * TILE + 3,
      top: station.row * TILE,
      width: TILE - 6, height: TILE + 2,
      zIndex: zIdx, cursor: "pointer",
    }}>
      {/* Proximity/hover ring — subtle, not distracting */}
      {active && (
        <div style={{
          position: "absolute", inset: -3,
          border: `2px solid ${glow}`,
          borderRadius: 2,
          boxShadow: `0 0 8px ${glow}55`,
          pointerEvents: "none",
          zIndex: zIdx + 2,
        }} />
      )}
      {/* Terminal body */}
      <div style={{
        width: "100%", height: "100%",
        background: "#18242e",
        border: `2px solid ${active ? glow : "#2a3e50"}`,
        borderRadius: 2,
        position: "relative",
        transition: "border-color 0.25s",
        overflow: "hidden",
      }}>
        {/* Pixel screen */}
        <div style={{
          position: "absolute", top: 2, left: 2, right: 2, height: 15,
          background: isPriv ? "#160808" : "#051512",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isPriv ? (
            <svg width="9" height="9" viewBox="0 0 8 8" fill={glow}>
              <rect x="1" y="4" width="6" height="4" />
              <path d="M2 4V2.5a2 2 0 0 1 4 0V4" fill="none" stroke={glow} strokeWidth="1.2" />
            </svg>
          ) : (
            <div style={{
              fontSize: 3, color: glow, fontFamily: "'Press Start 2P', monospace",
              padding: "0 1px", textAlign: "center",
              overflow: "hidden", whiteSpace: "nowrap",
            }}>{truncated}</div>
          )}
        </div>
        {/* Status LED */}
        <div style={{
          position: "absolute", top: 2, right: 2, width: 3, height: 3,
          borderRadius: "50%",
          background: isNear ? glow : "#253545",
          transition: "background 0.25s, box-shadow 0.25s",
          boxShadow: isNear ? `0 0 4px ${glow}` : "none",
        }} />
        {/* Shelf base */}
        <div style={{
          position: "absolute", bottom: 1, left: 4, right: 4, height: 3,
          background: "#253545", borderRadius: 1,
        }} />
      </div>
    </div>
  );
}

// ============================================================
//  CHEM CART  — pure decoration
// ============================================================
function ChemicalCart({ col, row }) {
  return (
    <div style={{ position:"absolute", left: col*TILE+4, top: row*TILE, width: 24, height: TILE, zIndex: row*10 }}>
      <div style={{ width:"100%", height:28, background:"#9ab0bc", border:"2px solid #304050", borderRadius:2, position:"relative", boxSizing:"border-box" }}>
        <div style={{ position:"absolute", top:2, left:2, width:4, height:6, background:"#ff3d00", borderRadius:1 }} />
        <div style={{ position:"absolute", top:2, left:8, width:4, height:8, background:"#29b6f6", borderRadius:1 }} />
        <div style={{ position:"absolute", top:13, left:4, width:6, height:5, background:"#ffeb3b", borderRadius:1 }} />
        <div style={{ position:"absolute", bottom:-4, left:1, width:4, height:4, background:"#304050", borderRadius:"50%" }} />
        <div style={{ position:"absolute", bottom:-4, right:1, width:4, height:4, background:"#304050", borderRadius:"50%" }} />
      </div>
    </div>
  );
}

// ============================================================
//  MAIN CHEMISTRY LAB COMPONENT
// ============================================================
export default function ChemistryLabScene({ isLandscape, onBackToVillage, triggerTransition, isTransitioning, speedMultiplier, setSpeedMultiplier, musicPlaying, setMusicPlaying, musicMuted, setMusicMuted, musicVolume, setMusicVolume }) {
  const [repos, setRepos]           = useState([]);
  const [stats, setStats]           = useState({ public: 0, private: 0 });
  const [reposLoaded, setReposLoaded] = useState(false);
  const [commitStats, setCommitStats] = useState(null);

  // Layout derived from live repos — regenerates automatically
  const labLayout = useMemo(() => {
    const pub  = repos.filter(r => !r.isPrivate);
    const priv = repos.filter(r =>  r.isPrivate);
    return generateLabLayout(pub, priv);
  }, [repos]);

  // Stable ref so the movement loop always has the latest layout
  const layoutRef = useRef(labLayout);
  useEffect(() => { layoutRef.current = labLayout; }, [labLayout]);

  const [nearStation,    setNearStation]    = useState(null);
  const [openStation,    setOpenStation]    = useState(null);
  const [phase,          setPhase]          = useState("intro");
  const [scale,          setScale]          = useState(1);
  const [internalW,      setInternalW]      = useState(384);
  const [internalH,      setInternalH]      = useState(288);
        
  useEffect(() => { localStorage.setItem("musicMuted", JSON.stringify(musicMuted)); }, [musicMuted]);
  useEffect(() => { localStorage.setItem("musicVolume", musicVolume.toString()); }, [musicVolume]);
  useEffect(() => { localStorage.setItem("speedMultiplier", speedMultiplier.toString()); }, [speedMultiplier]);

  const musicRef    = useRef({ audioCtx: null, interval: null });
  const containerRef= useRef(null);
  const keysRef     = useRef({});

  // Re-centre player when layout changes (repos loaded → room grows)
  useEffect(() => {
    setPos(labLayout.startPos);
    setOpenStation(null);
    setNearStation(null);
  }, [labLayout]);

  // ---- Synth engine ----
  const playStep = useCallback((idx, vol, muted) => {
    if (muted || vol === 0) return;
    try {
      if (!musicRef.current.audioCtx)
        musicRef.current.audioCtx = getSharedAudioCtx();
      const ctx = musicRef.current.audioCtx;
      if (ctx.state === "suspended") ctx.resume();

      const prog = [
        [130.81, 155.56, 196, 233.08],
        [87.31, 103.83, 130.81, 155.56],
        [98, 116.54, 146.83, 196],
        [130.81, 155.56, 196, 246.94],
      ];
      const chord = prog[Math.floor(idx / 8) % prog.length];
      const si = idx % 8;
      const t  = ctx.currentTime;

      const bass = ctx.createOscillator(), bG = ctx.createGain();
      bass.type = "triangle";
      let bf = chord[0] / 2;
      if (si === 2 || si === 6) bf = chord[2] / 2;
      if (si === 4) bf = chord[1] / 2;
      bass.frequency.setValueAtTime(bf, t);
      bG.gain.setValueAtTime(vol * 0.4, t);
      bG.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      bass.connect(bG); bG.connect(ctx.destination);
      bass.start(t); bass.stop(t + 0.38);

      if (si % 2 === 0) {
        const mel = ctx.createOscillator(), mG = ctx.createGain();
        mel.type = "square";
        let mn = chord[si % chord.length];
        if (si === 4) mn *= 1.5;
        mel.frequency.setValueAtTime(mn, t);
        mG.gain.setValueAtTime(vol * 0.15, t);
        mG.gain.exponentialRampToValueAtTime(0.005, t + 0.18);
        mel.connect(mG); mG.connect(ctx.destination);
        mel.start(t); mel.stop(t + 0.2);
      }
    } catch (_) {}
  }, []);

  // Music loop — interval tempo MATCHES speedMultiplier
  useEffect(() => {
    if (!musicPlaying) {
      if (musicRef.current.interval) clearInterval(musicRef.current.interval);
      return;
    }
    let step = 0;
    const ms = Math.round(240 / speedMultiplier); // faster at 2x, slower at 1x
    musicRef.current.interval = setInterval(() => {
      playStep(step++, musicVolume, musicMuted);
    }, ms);
    return () => { if (musicRef.current.interval) clearInterval(musicRef.current.interval); };
  }, [musicPlaying, musicVolume, musicMuted, speedMultiplier, playStep]);

  // ---- Live GitHub fetch ----
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/github.json");
        if (!res.ok) throw new Error(`Failed to fetch github.json: ${res.status}`);
        const data = await res.json();

        setRepos(data.repos || []);
        setStats(data.stats || { public: 0, private: 0 });
        
        if (data.commitStats) {
          setCommitStats(data.commitStats);
        } else {
          setCommitStats({ error: true });
        }

      } catch (e) {
        console.warn("Local GitHub fetch failed:", e);
        setCommitStats({ error: true });
      } finally {
        setReposLoaded(true);
      }
    }
    load();
  }, []);

  // ---- Responsive scale ----
  useEffect(() => {
    const resize = () => {
      const isMobile = window.innerWidth < 768;
      const consoleWidth = isLandscape ? 320 : 0;
      const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
      const availableWidth = window.innerWidth - consoleWidth;
      const availableHeight = window.innerHeight - consoleHeight;
      const baseW = 256;
      const baseH = 192;
      const newScale = Math.max(1, Math.floor(Math.min(availableWidth / baseW, availableHeight / baseH)));
      setInternalW(Math.floor(availableWidth / newScale));
      setInternalH(Math.floor(availableHeight / newScale));
      setScale(newScale);
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [isLandscape]);

  // ---- Proximity detection ----
  const checkNear = useCallback((col, row) => {
    for (const s of layoutRef.current.stations) {
      const dc = Math.abs(s.col - col), dr = Math.abs(s.row - row);
      if ((dc === 1 && dr === 0) || (dc === 0 && dr === 1)) { setNearStation(s.id); return; }
    }
    setNearStation(null);
  }, []);

  const { pos, setPos, facing, stepping } = usePlayerMovement({
    initialPos: labLayout.startPos,
    canWalk: (c, r) => {
      if (c === layoutRef.current.startPos.col && r === 1) { onBackToVillage(); return false; }
      if (c === layoutRef.current.startPos.col + 2 && r === 3) return false;
      return canLayoutWalk(layoutRef.current, c, r);
    },
    speedMultiplier,
    isActive: phase === "free" && !isTransitioning && !openStation,
    onMove: (c, r) => { checkNear(c, r); playTileStep(); return false; },
    onAction: () => {
      const npcCol = layoutRef.current.startPos.col + 2;
      const npcRow = 3;
      const dc = Math.abs(npcCol - pos.col);
      const dr = Math.abs(npcRow - pos.row);
      if ((dc + dr) === 1 || (dc === 1 && dr === 1)) {
        setPhase("intro");
      } else if (nearStation) {
        setOpenStation(nearStation);
      }
    },
    onCancel: () => setOpenStation(null)
  });


  // ---- Keyboard & Audio Resume ----
  useEffect(() => {
    const resume = () => {
      if (!musicRef.current.audioCtx) {
        musicRef.current.audioCtx = getSharedAudioCtx();
      }
      if (musicRef.current.audioCtx.state === "suspended") {
        musicRef.current.audioCtx.resume();
      }
    };
    window.addEventListener("keydown", resume);
    window.addEventListener("click",   resume);
    window.addEventListener("touchstart", resume);
    window.addEventListener("pointerdown", resume);

    const onDown = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      // Allow movement keys to exit intro mode
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        if (phase === "intro") {
          e.preventDefault();
          setPhase("free");
          return;
        }
      }

      if (phase === "intro") {
        if (e.key === " " || e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          setPhase("free");
          return;
        }
      }
      
      if (phase !== "free") return;
      if ((e.key === " " || e.key === "Enter") && nearStation) {
        e.preventDefault();
        setOpenStation(nearStation);
      }
      if (e.key === "Escape") setOpenStation(null);
    };
    const onUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
      window.removeEventListener("keydown", resume);
      window.removeEventListener("click",   resume);
      window.removeEventListener("touchstart", resume);
      window.removeEventListener("pointerdown", resume);
    };
  }, [nearStation, phase]);


  // ---- Camera (clamped to world bounds) ----
  const layout = labLayout;
  const cam = useCameraLerp(pos, TILE, internalW, internalH, layout.totalCols, layout.totalRows, speedMultiplier);
  const tt   = (0.14 / speedMultiplier).toFixed(2);

  const activeStation    = layout.stations.find(s => s.id === nearStation);
  const openStationData  = layout.stations.find(s => s.id === openStation);
  const labKeycapStyle = { display: "inline-block", background: "#0c2e1e", border: "1px solid #80c8a0", borderBottomWidth: 2, borderBottomColor: "#041810", padding: "1px 4px", borderRadius: 2, fontFamily: "'Press Start 2P', monospace", color: "#a8e8a8", boxShadow: "0 1px 0 #041810", margin: "0 2px", whiteSpace: "nowrap", animation: "keycapGlow 2s ease-in-out infinite" };
  const introLine        = reposLoaded
    ? `My lab. Every terminal connects to a GitHub repo. ${stats.public} public, ${stats.private} private. Walk up to one and press SPACE.`
    : "Pulling data from GitHub...";

  // ---- Render ----
  return (
    <div ref={containerRef} style={{
      position: "fixed", inset: 0,
      display: "flex", flexDirection: isLandscape ? "row" : "column",  
      background: "#060a0e", overflow: "hidden",
      fontFamily: "'Press Start 2P', monospace", userSelect: "none",  boxSizing: "border-box", height: "100dvh", width: "100dvw", }}>
      <title>Chemistry Lab | Saad Ibra</title>
      <meta name="description" content="Welcome to the Chemistry Lab. View my software engineering projects synced directly with GitHub." />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes dialogBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dialogSlideIn { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes keycapGlow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
        .lab-scroll::-webkit-scrollbar { width:10px }
        .lab-scroll::-webkit-scrollbar-track { background:#0a1218 }
        .lab-scroll::-webkit-scrollbar-thumb { background:#c4e8bc }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        transform: `scale(${scale})`, transformOrigin: "center",
        imageRendering: "pixelated",
      }}>

        {/* ── GAME VIEWPORT ── */}
        <div style={{
          position: "relative", width: internalW, height: internalH,
          overflow: "hidden", background: "#070e16",
          boxShadow: "0 0 0 4px #1a2b3c, 0 8px 32px rgba(0,0,0,0.9)",
          imageRendering: "pixelated",
        }}>

          {/* Scrolling world */}
          <div style={{
            position: "absolute",
            width: layout.totalCols * TILE, height: layout.totalRows * TILE,
            left: -cam.x, top: -cam.y,
            
          }}>

            {/* Tile layer */}
            {useMemo(() => layout.map.map((row, r) => row.map((tile, c) => {
              if (tile === 0) return null;
              let bg, bx = "none";
              if (tile === 2) {
                bg = "repeating-linear-gradient(90deg,#0c2038,#0c2038 4px,#162e4c 4px,#162e4c 8px)";
                bx = "inset 0 -3px 0 #081428, inset 0 -8px 8px rgba(0,0,0,0.5)";
              } else if (tile === 3) {
                bg = "#1e2e3e";
                bx = "inset 0 0 0 1px #162030";
              } else {
                bg = (r + c) % 2 === 0 ? "#2e4460" : "#38506e";
                bx = "inset 0 0 0 1px rgba(0,0,0,0.12)";
              }
              return (
                <div key={`${r}-${c}`} style={{
                  position: "absolute", left: c * TILE, top: r * TILE,
                  width: TILE + 1, height: TILE + 1, background: bg, boxShadow: bx,
                }} />
              );
            })), [layout])}

            {/* Wall baseboard strip */}
            {useMemo(() => layout.map[1]?.map((t, c) => t === 2 ? (
              <div key={`wb${c}`} style={{
                position: "absolute", left: c*TILE, top: TILE*2-4,
                width: TILE, height: 4, background: "#0a1828",
              }}>
                <div style={{ height:2, background:"#162e4c" }} />
              </div>
            ) : null), [layout])}

            {/* Chalkboard */}
            <Chalkboard
              stats={stats}
              isNear={nearStation === "chalkboard"}
              chalkCol={layout.chalkCol}
              onClick={() => { if (phase === "free") setOpenStation("chalkboard"); }}
            />

            {/* Individual repo terminals */}
            {layout.stations
              .filter(s => s.id !== "chalkboard")
              .map(s => (
                <RepoTerminal 
                  key={s.id} 
                  station={s} 
                  isNear={nearStation === s.id} 
                  onClick={() => { if (phase === "free") setOpenStation(s.id); }} 
                />
              ))
            }

            {/* Exit Door */}
            <ExitDoor col={layout.startPos.col} row={1} />

            {/* Decorative carts (only in public wing to avoid blocking vault) */}
            <ChemicalCart col={1} row={5} />

            {/* NPC Saad */}
            <div style={{
              position: "absolute",
              left: (layout.startPos.col + 2) * TILE,
              top: 3 * TILE,
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 3 * 10,
              filter: (Math.abs((layout.startPos.col + 2) - pos.col) <= 1 && Math.abs(3 - pos.row) <= 1 && phase === "free") ? "drop-shadow(0 0 6px rgba(128,200,160,0.5))" : "none",
              transition: "filter 0.2s",
            }}>
              <SaadSprite direction="left" />
            </div>

            {/* Player — Y-depth sorted */}
            <div style={{
              position: "absolute",
              left: pos.col * TILE, top: pos.row * TILE, transition: "left 0.14s linear, top 0.14s linear",
              width: TILE, height: TILE,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: pos.row * 10 + 5,
              
            }}>
              <PlayerSprite direction={facing} stepping={stepping} costume="labcoat" />
            </div>

            {/* Vignette */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(circle at 50% 40%, transparent 35%, rgba(0,0,0,0.5) 100%)",
            }} />
          </div>

          {/* CRT scanlines (above world, below UI) */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200,
            background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)",
          }} />

          {/* ← LIBRARY button */}
          <button onClick={onBackToVillage} style={{
            position: "absolute", top: 8, left: 8,
            fontFamily: "'Press Start 2P', monospace", fontSize: 6,
            background: "#111e2a", color: "#eef7f2", border: "2px solid #eef7f2",
            padding: "4px 8px", cursor: "pointer", borderRadius: 2, zIndex: 500,
            boxShadow: "0 2px 0 #060e18",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={6} strokeWidth={3} /> VILLAGE
            </div>
          </button>

          {/* Syncing indicator */}
          {!reposLoaded && (
            <div style={{
              position: "absolute", top: 8, right: 8, fontSize: 5,
              color: "#00ffcc", animation: "dialogBlink 0.7s step-end infinite", zIndex: 500,
            }}>SYNCING…</div>
          )}

          {/* Proximity prompt */}
          {phase === "free" && activeStation && !openStation && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              padding: "4px 10px",
              background: "rgba(6,10,14,0.97)", border: "2px solid #eef7f2", borderRadius: 2,
              zIndex: 500, pointerEvents: "none",
              display: "flex", gap: 8, alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.9)", whiteSpace: "nowrap",
            }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 5, color: activeStation.id === "chalkboard" ? "#b0f0b8" : activeStation.isPrivate ? "#ff5252" : "#00ffcc" }}>
                {activeStation.id === "chalkboard" ? <ScrollText size={7} /> : <Terminal size={7} />}
                <span>{activeStation.label.slice(0, 22).toUpperCase()}</span>
              </div>
              <div style={{
                fontSize: 5, color: "#a8e8a8", background: "rgba(0,0,0,0.4)",
                padding: "2px 4px", borderRadius: 2
              }}>SPACE/A</div>
            </div>
          )}

          {/* Intro dialogue */}
          {phase !== "free" && (
            <div style={{
              position: "absolute", top: 16, left: 8, right: 8,
              padding: "18px 14px 10px",
              background: "rgba(6,10,14,0.97)", border: "2px solid #eef7f2", borderRadius: 2,
              boxShadow: "inset 0 0 0 4px #162e4c", zIndex: 500,
              animation: "dialogSlideIn 0.3s ease-out"
            }}>
              <div style={{ position: "absolute", top: 3, right: 3, width: 4, height: 4, borderRight: "2px solid #eef7f2", borderTop: "2px solid #eef7f2", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 3, left: 3, width: 4, height: 4, borderLeft: "2px solid #eef7f2", borderBottom: "2px solid #eef7f2", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 3, right: 3, width: 4, height: 4, borderRight: "2px solid #eef7f2", borderBottom: "2px solid #eef7f2", opacity: 0.35, pointerEvents: "none" }} />
              <div style={{
                position: "absolute", top: -12, left: 54,
                background: "#0c1e2e", border: "2px solid #eef7f2",
                padding: "2px 8px", fontSize: 7, color: "#80c8a0", borderRadius: 2,
              }}>SAAD IBRA</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <img src="/favicon.svg" alt="" draggable={false} style={{
                  width: 30, height: 30, minWidth: 30,
                  imageRendering: "pixelated", borderRadius: 2, marginTop: 1,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, lineHeight: 2.4, minHeight: 28, color: "#eef7f2" }}>
                    {renderControlText(introLine, labKeycapStyle)}
                    <span style={{ animation: "dialogBlink 0.5s step-end infinite" }}>▊</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => setPhase("free")}
                      style={{
                        fontFamily: "'Press Start 2P', monospace", fontSize: 7,
                        background: "#1a5a3a", color: "#fff", border: "none",
                        padding: "8px 14px", borderRadius: 2, cursor: "pointer",
                        boxShadow: "0 3px 0 #0a3020", display: "flex", alignItems: "center"
                      }}
                    >
                      <span style={{ fontSize: 5, color: "#a8e8a8", marginRight: 8, background: "rgba(0,0,0,0.2)", padding: "2px 4px", borderRadius: 2 }}>SPACE/A</span>
                      ENTER LAB
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chalkboard Modal */}
          {openStation === "chalkboard" && (
            <ChalkboardModal commitStats={commitStats} onClose={() => setOpenStation(null)} />
          )}

          {/* Repo detail modal — one per repo, focused */}
          {openStation && openStation !== "chalkboard" && openStationData && (
            <div
              onClick={() => setOpenStation(null)}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.92)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                className="lab-scroll"
                style={{
                  background: "#0a1218", border: "4px solid #eef7f2", borderRadius: 2,
                  width: 300, maxWidth: "95%",
                  boxShadow: "0 0 0 2px #0a1218, 0 0 0 6px #2e4460, 0 12px 32px rgba(0,0,0,0.95)",
                  overflow: "hidden",
                }}
              >
                {/* Modal header */}
                <div style={{
                  padding: "8px 12px",
                  background: openStationData.isPrivate ? "#6e0e18" : "#065038",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ fontSize: 6.5, color: "#fff", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
                    {openStationData.isPrivate ? <Lock size={10} /> : <Hexagon size={10} />} {openStationData.label}
                  </div>
                  <button onClick={() => setOpenStation(null)} style={{
                    fontFamily: "'Press Start 2P', monospace", fontSize: 6,
                    background: "#c03030", color: "#fff", border: "2px solid #eef7f2",
                    padding: "2px 5px", borderRadius: 2, cursor: "pointer",
                  }}>X</button>
                </div>

                {/* Modal body */}
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {openStationData.isPrivate ? (
                    <>
                      <div style={{ fontSize: 5.5, color: "#ff8080", textAlign: "center" }}>ACCESS RESTRICTED</div>
                      <div style={{ fontSize: 4.5, color: "#7090a0", textAlign: "center", lineHeight: "9px" }}>
                        Private repository — name only visible
                      </div>
                    </>
                  ) : (
                    <>
                      {openStationData.repoData?.description && (
                        <div style={{ fontSize: 4.5, color: "#90b8c8", lineHeight: "9px" }}>
                          {openStationData.repoData.description}
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {openStationData.repoData?.language && (
                          <span style={{ fontSize: 5, color: "#60889a" }}>
                            {openStationData.repoData.language}
                          </span>
                        )}
                        {openStationData.repoData?.stars > 0 && (
                          <span style={{ fontSize: 5, color: "#ffd060", display: "flex", alignItems: "center", gap: 4 }}>
                            <Star size={7} /> {openStationData.repoData.stars}
                          </span>
                        )}
                      </div>
                      {openStationData.repoData?.url && (
                        <a
                          href={openStationData.repoData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block", textAlign: "center", fontSize: 6,
                            color: "#00ffcc", background: "#051812",
                            border: "2px solid #00ffcc44", padding: "7px", borderRadius: 2,
                            textDecoration: "none",
                          }}
                        >
                          ⬡ VIEW ON GITHUB
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CONTROL BAR ── */}
        

      </div>
    </div>
      <ControlBar 
          
          musicPlaying={musicPlaying}
          musicMuted={musicMuted}
          musicVolume={musicVolume}
          speedMultiplier={speedMultiplier}
          onTogglePlay={() => musicPlaying ? setMusicMuted(!musicMuted) : setMusicPlaying(true)}
          onChangeVolume={setMusicVolume}
          onChangeSpeed={setSpeedMultiplier}
        />
    </div>
  );
}
