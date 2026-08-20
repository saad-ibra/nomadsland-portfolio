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
      zIndex: 99,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'tapMarkerPulse 1s infinite alternate'
    }}>
      <style>{`
        @keyframes tapMarkerPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.1); opacity: 0.3; }
        }
      `}</style>
      <div style={{
        width: 8, height: 8, 
        border: '2px solid rgba(255,255,255,0.8)', 
        borderRadius: '50%',
        boxShadow: '0 0 4px rgba(0,0,0,0.5)'
      }} />
    </div>
  );
}
