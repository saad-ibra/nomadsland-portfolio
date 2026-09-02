import { useEffect, useRef } from "react";
import { TILE, MOVE_COOLDOWN } from "../engine/constants";

export function useSmoothPixelGrid({ pos, internalW, internalH, mapCols, mapRows, speedMultiplier, worldRef, playerRef, onWindowChange }) {
  const visualPlayer = useRef({ x: pos.col * TILE, y: pos.row * TILE });
  const targetQueue = useRef([]);
  const lastPos = useRef(pos);
  const rafRef = useRef(null);

  // Queue new positions as they come in from the logic
  if (pos.col !== lastPos.current.col || pos.row !== lastPos.current.row) {
    targetQueue.current.push({ x: pos.col * TILE, y: pos.row * TILE });
    lastPos.current = pos;
  }

  useEffect(() => {
    let lastTime = null;
    
    const update = (time) => {
      if (lastTime === null) {
        lastTime = time;
      }
      const dt_ms = Math.min(time - lastTime, 50);
      lastTime = time;
      
      const p = visualPlayer.current;
      
      if (targetQueue.current.length > 0) {
        const target = targetQueue.current[0];
        
        // Handle teleportation (e.g., initial load or massive jump)
        if (Math.abs(target.x - p.x) > TILE * 3 || Math.abs(target.y - p.y) > TILE * 3) {
          p.x = target.x;
          p.y = target.y;
          targetQueue.current = []; // Clear queue on teleport
        } else {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          
          if (dx !== 0 || dy !== 0) {
            const speed = (TILE * speedMultiplier) / MOVE_COOLDOWN; 
            let moveDist = speed * dt_ms;
            
            // Resolve X first, then Y (Strict orthogonal retro movement)
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
          
          // If we reached the target precisely, pop it from the queue
          if (p.x === target.x && p.y === target.y) {
            targetQueue.current.shift();
          }
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
