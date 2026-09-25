import { useEffect, useRef } from "react";
import { TILE, MOVE_COOLDOWN } from "../engine/constants";

export function useSmoothPixelGrid({ pos, internalW, internalH, mapCols, mapRows, speedMultiplier, worldRef, playerRef, boatHullRef, boatSailRef, isSailing, onWindowChange }) {
  const visualPlayer = useRef({ x: pos.col * TILE, y: pos.row * TILE });
  const targetQueue = useRef([]);
  const lastPos = useRef(pos);
  const rafRef = useRef(null);

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
        
        if (Math.abs(target.x - p.x) > TILE * 3 || Math.abs(target.y - p.y) > TILE * 3) {
          p.x = target.x;
          p.y = target.y;
          targetQueue.current = [];
        } else {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          
          if (dx !== 0 || dy !== 0) {
            const speed = (TILE * speedMultiplier) / MOVE_COOLDOWN; 
            let moveDist = speed * dt_ms;
            
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
          
          if (p.x === target.x && p.y === target.y) {
            targetQueue.current.shift();
          }
        }
      }
      
      const roundX = Math.round(p.x);
      const roundY = Math.round(p.y);
      
      if (playerRef.current) {
        playerRef.current.style.transform = `translate(${roundX}px, ${roundY}px)`;
      }
      
      if (boatHullRef?.current) {
        const boatX = roundX - Math.round(TILE * 0.5);
        boatHullRef.current.style.transform = `translate(${boatX}px, ${roundY}px)`;
      }
      if (boatSailRef?.current) {
        const boatX = roundX - Math.round(TILE * 0.5);
        boatSailRef.current.style.transform = `translate(${boatX}px, ${roundY}px)`;
      }
      
      let clampedTX = 0;
      let clampedTY = 0;
      
      if (worldRef.current) {
        const camTargetX = p.x + TILE / 2 - internalW / 2;
        const camTargetY = p.y + TILE / 2 - internalH / 2;
        
        if (mapCols * TILE < internalW) {
          clampedTX = (mapCols * TILE - internalW) / 2;
        } else {
          clampedTX = Math.max(0, Math.min(mapCols * TILE - internalW, camTargetX));
        }

        if (mapRows * TILE < internalH) {
          clampedTY = (mapRows * TILE - internalH) / 2;
        } else {
          clampedTY = Math.max(0, Math.min(mapRows * TILE - internalH, camTargetY));
        }
        
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
  }, [pos, internalW, internalH, mapCols, mapRows, speedMultiplier, worldRef, playerRef, boatHullRef, boatSailRef, isSailing, onWindowChange]);
}
