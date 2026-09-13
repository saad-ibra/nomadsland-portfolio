import { useCallback } from "react";
import { findPath } from "../engine/pathfinding.js";
import { TILE } from "../engine/constants.js";

export function useTapToMove(worldRef, pos, canWalk, setPath, maxCols, maxRows, isActive = true, isSailing = false) {
  const handleWorldTap = useCallback((e) => {
    if (!isActive) return;
    if (!worldRef.current) return;
    
    // Ignore clicks on UI elements or buttons inside the world
    if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;

    const rect = worldRef.current.getBoundingClientRect();
    const scaleX = rect.width / (maxCols * TILE);
    const scaleY = rect.height / (maxRows * TILE);

    const clickX = (e.clientX - rect.left) / scaleX;
    const clickY = (e.clientY - rect.top) / scaleY;

    const tileCol = Math.floor(clickX / TILE);
    const tileRow = Math.floor(clickY / TILE);

    if (tileCol < 0 || tileCol >= maxCols || tileRow < 0 || tileRow >= maxRows) return;
    if (!canWalk(tileCol, tileRow)) {
      const DIRS = [
        {dc: 0, dr: 1}, {dc: 0, dr: -1}, {dc: 1, dr: 0}, {dc: -1, dr: 0}
      ];
      for (const d of DIRS) {
        const nc = tileCol + d.dc;
        const nr = tileRow + d.dr;
        if (canWalk(nc, nr)) {
          let path = [];
          if (pos.col === nc && pos.row === nr) {
            // Already adjacent to the target!
          } else {
            path = findPath(pos.col, pos.row, nc, nr, canWalk, maxCols, maxRows);
          }
          
          if (path.length > 0 || (pos.col === nc && pos.row === nr)) {
            path.push({ col: tileCol, row: tileRow });
            if (isSailing) path = path.slice(0, 3);
            setPath(path);
            return;
          }
        }
      }
      return;
    }

    let path = findPath(pos.col, pos.row, tileCol, tileRow, canWalk, maxCols, maxRows);
    if (path.length > 0) {
      if (isSailing) path = path.slice(0, 3);
      setPath(path);
    }
  }, [isActive, isSailing, worldRef, maxCols, maxRows, pos.col, pos.row, canWalk, setPath]);

  return handleWorldTap;
}

export function TapMarker({ tapTarget, TILE, isSailing }) {
  if (!tapTarget) return null;
  return (
    <div style={{
      position: 'absolute',
      left: tapTarget.col * TILE,
      top: tapTarget.row * TILE,
      width: TILE,
      height: TILE,
      pointerEvents: 'none',
      zIndex: tapTarget.row * 10 + 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mixBlendMode: 'difference'
    }}>
      <style>{`
        @keyframes tapMarkerIsoScale {
          0% { transform: scale(1.1); }
          50% { transform: scale(0.85); }
          100% { transform: scale(1.1); }
        }
        @keyframes tapGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.5)); }
          50% { filter: drop-shadow(0 0 5px rgba(255,255,255,1)) drop-shadow(0 0 10px rgba(255,255,255,0.7)); }
        }
        @keyframes tapAnchorBob {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.05); }
        }
      `}</style>
      <div style={{
        position: 'relative', 
        width: isSailing ? 15 : 16, 
        height: isSailing ? 15 : 16,
        animation: isSailing 
          ? 'tapAnchorBob 1.2s infinite ease-in-out, tapGlow 1s infinite ease-in-out'
          : 'tapMarkerIsoScale 1s infinite ease-in-out, tapGlow 1s infinite ease-in-out',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {isSailing ? (
          /* Pixel Art Anchor */
          <svg width="15" height="15" viewBox="0 0 15 15" style={{ imageRendering: "pixelated" }}>
            <path fill="#fff" d="
              M6,0 h3 v1 h-3 z
              M5,1 h1 v2 h-1 z
              M9,1 h1 v2 h-1 z
              M6,3 h3 v1 h-3 z
              M7,4 h1 v1 h-1 z
              M4,5 h7 v1 h-7 z
              M7,6 h1 v4 h-1 z
              M2,7 h2 v1 h-2 z
              M11,7 h2 v1 h-2 z
              M2,8 h1 v2 h-1 z
              M12,8 h1 v2 h-1 z
              M3,10 h1 v1 h-1 z
              M11,10 h1 v1 h-1 z
              M4,11 h7 v1 h-7 z
              M6,12 h3 v1 h-3 z
            " />
          </svg>
        ) : (
          /* Isometric 16x8 hollow circle */
          <svg width="16" height="8" viewBox="0 0 16 8" style={{ imageRendering: "pixelated" }}>
            <path fill="#fff" d="
              M6,0 h4 v1 h-4 z
              M3,1 h3 v1 h-3 z
              M10,1 h3 v1 h-3 z
              M1,2 h2 v1 h-2 z
              M13,2 h2 v1 h-2 z
              M0,3 h1 v2 h-1 z
              M15,3 h1 v2 h-1 z
              M1,5 h2 v1 h-2 z
              M13,5 h2 v1 h-2 z
              M3,6 h3 v1 h-3 z
              M10,6 h3 v1 h-3 z
              M6,7 h4 v1 h-4 z
            " />
          </svg>
        )}
      </div>
    </div>
  );
}
