import { useState, useEffect } from 'react';

export function getViewportMetrics(isLandscape) {
  if (typeof window === 'undefined') return { scale: 1, internalW: 384, internalH: 288 };
  const isMobile = window.innerWidth < 768;
  const consoleWidth = isLandscape ? 320 : 0;
  const consoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
  const availableWidth = window.innerWidth - consoleWidth;
  const availableHeight = window.innerHeight - consoleHeight;
  const baseW = 256;
  const baseH = 192;
  const scale = Math.max(1, Math.floor(Math.min(availableWidth / baseW, availableHeight / baseH)));
  return {
    scale,
    internalW: Math.floor(availableWidth / scale),
    internalH: Math.floor(availableHeight / scale)
  };
}

export function useViewport(isLandscape) {
  const [viewport, setViewport] = useState(() => getViewportMetrics(isLandscape));

  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewportMetrics(isLandscape));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLandscape]);

  return viewport;
}
