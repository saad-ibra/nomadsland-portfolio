import { useEffect, useRef } from "react";
import { TILE, MOVE_COOLDOWN } from "../engine/constants";

export function useSmoothPixelGrid({ pos, internalW, internalH, mapCols, mapRows, speedMultiplier, worldRef, playerRef, onWindowChange }) {
  const visualPlayer = useRef({ x: pos.col * TILE, y: pos.row * TILE });
  const rafRef = useRef(null);

  useEffect(() => {
    let lastTime = null;
    
    const update = (time) => {
      if (lastTime === null) {
        lastTime = time;
      }
      const dt_ms = Math.min(time - lastTime, 50);
      lastTime = time;
      
      const targetX = pos.col * TILE;
      const targetY = pos.row * TILE;
      
      const p = visualPlayer.current;
      
      // Handle teleportation (e.g., initial load or massive jump)
      if (Math.abs(targetX - p.x) > TILE * 3 || Math.abs(targetY - p.y) > TILE * 3) {
        p.x = targetX;
        p.y = targetY;
      }

      const dx = targetX - p.x;
      const dy = targetY - p.y;
      
      if (dx !== 0 || dy !== 0) {
        const speed = (TILE * speedMultiplier) / MOVE_COOLDOWN; 
        let moveDist = speed * dt_ms;
        
        // Strict Orthogonal Movement (Retro Style)
        // Never move diagonally. Resolve X movement first, then Y.
        if (Math.abs(dx) > 0) {
          const step = Math.min(Math.abs(dx), moveDist);
          p.x += Math.sign(dx) * step;
          moveDist -= step;
        }
        if (Math.abs(dy) > 0 && moveDist > 0) {
          const step = Math.min(Math.abs(dy), moveDist);
          p.y += Math.sign(dy) * step;
        }
      }
      
      if (playerRef.current) {
        playerRef.current.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
      }
      
      let clampedTX = 0;
      let clampedTY = 0;
      
      if (worldRef.current) {
        const camTargetX = p.x + TILE / 2 - internalW / 2;
        const camTargetY = p.y + TILE / 2 - internalH / 2;
        
        clampedTX = Math.max(0, Math.min(Math.max(0, mapCols * TILE - internalW), camTargetX));
        clampedTY = Math.max(0, Math.min(Math.max(0, mapRows * TILE - internalH), camTargetY));
        
        worldRef.current.style.transform = `translate(${-Math.round(clampedTX)}px, ${-Math.round(clampedTY)}px)`;
      }
      
      if (onWindowChange) {
        const sc = Math.max(0, Math.floor(clampedTX / TILE) - 2);
        const ec = Math.min(mapCols, Math.floor((clampedTX + internalW) / TILE) + 3);
        const sr = Math.max(0, Math.floor(clampedTY / TILE) - 2);
        const er = Math.min(mapRows, Math.floor((clampedTY + internalH) / TILE) + 3);
        onWindowChange(sc, ec, sr, er);
      }
      
      rafRef.current = requestAnimationFrame(update);
    };
    
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pos, internalW, internalH, mapCols, mapRows, speedMultiplier, worldRef, playerRef, onWindowChange]);
}
