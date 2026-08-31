import { useCallback } from "react";
import { findPath } from "../engine/pathfinding.js";
import { TILE } from "../engine/constants.js";

export function useTapToMove(worldRef, pos, canWalk, setPath, maxCols, maxRows, isActive = true) {
  const handleWorldTap = useCallback((e) => {
    if (!isActive) return;
    if (!worldRef.current) return;
    
    // Ignore clicks on UI elements or buttons inside the world
    if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) return;
    // Let's also check if it's clicking on a specific interactive entity if needed, but buttons cover most of it.

    const rect = worldRef.current.getBoundingClientRect();
    // In our engine, worldRef has a scale applied by the parent. 
    // getBoundingClientRect() returns the SCALED bounding box.
    // So the width of the rect is (maxCols * TILE * scale).
    const scaleX = rect.width / (maxCols * TILE);
    const scaleY = rect.height / (maxRows * TILE);

    const clickX = (e.clientX - rect.left) / scaleX;
    const clickY = (e.clientY - rect.top) / scaleY;

    const tileCol = Math.floor(clickX / TILE);
    const tileRow = Math.floor(clickY / TILE);

    if (tileCol < 0 || tileCol >= maxCols || tileRow < 0 || tileRow >= maxRows) return;
    if (!canWalk(tileCol, tileRow)) {
      // Maybe try adjacent? 
      // For now, if unwalkable, just ignore, or maybe we can auto-route to adjacent if it's an NPC?
      // Simple approach: if unwalkable, check neighbors to see if it's an interactive object.
      // We'll just route to the closest walkable neighbor if the exact tile is unwalkable.
      
      const DIRS = [
        {dc: 0, dr: 1}, {dc: 0, dr: -1}, {dc: 1, dr: 0}, {dc: -1, dr: 0}
      ];
      let found = false;
      for (const d of DIRS) {
        const nc = tileCol + d.dc;
        const nr = tileRow + d.dr;
        if (canWalk(nc, nr)) {
          const path = findPath(pos.col, pos.row, nc, nr, canWalk, maxCols, maxRows);
          if (path.length > 0) {
            path.push({ col: tileCol, row: tileRow }); // Add the unwalkable target tile as the final step to trigger a bump
            setPath(path);
            return;
          }
        }
      }
      return;
    }

    const path = findPath(pos.col, pos.row, tileCol, tileRow, canWalk, maxCols, maxRows);
    if (path.length > 0) {
      setPath(path);
    }
  }, [isActive, worldRef, maxCols, maxRows, pos.col, pos.row, canWalk, setPath]);

  return handleWorldTap;
}

export function TapMarker({ tapTarget, TILE }) {
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
      `}</style>
      <div style={{
        position: 'relative', width: 16, height: 16,
        animation: 'tapMarkerIsoScale 1s infinite ease-in-out, tapGlow 1s infinite ease-in-out',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {/* Isometric 16x8 hollow circle */}
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
      </div>
    </div>
  );
}
