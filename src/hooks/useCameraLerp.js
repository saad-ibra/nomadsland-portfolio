import { useState, useEffect, useRef } from 'react';

export function useCameraLerp(pos, TILE, internalW, internalH, cols, rows, speedMultiplier) {
  const [cam, setCam] = useState(() => {
    const targetX = pos.col * TILE + TILE / 2 - internalW / 2;
    const targetY = pos.row * TILE + TILE / 2 - internalH / 2;
    return {
      x: Math.max(0, Math.min(Math.max(0, cols * TILE - internalW), targetX)),
      y: Math.max(0, Math.min(Math.max(0, rows * TILE - internalH), targetY))
    };
  });
  const rafRef = useRef();

  useEffect(() => {
    let lastTime = performance.now();
    const updateCam = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      
      const targetX = pos.col * TILE + TILE / 2 - internalW / 2;
      const targetY = pos.row * TILE + TILE / 2 - internalH / 2;
      
      const clampedTX = Math.max(0, Math.min(Math.max(0, cols * TILE - internalW), targetX));
      const clampedTY = Math.max(0, Math.min(Math.max(0, rows * TILE - internalH), targetY));

      setCam(prev => {
        const lerpFactor = 1.0 - Math.pow(0.001, dt * speedMultiplier);
        return {
          x: prev.x + (clampedTX - prev.x) * lerpFactor,
          y: prev.y + (clampedTY - prev.y) * lerpFactor
        };
      });
      rafRef.current = requestAnimationFrame(updateCam);
    };
    rafRef.current = requestAnimationFrame(updateCam);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pos, speedMultiplier, TILE, internalW, internalH, cols, rows]);

  return cam;
}
