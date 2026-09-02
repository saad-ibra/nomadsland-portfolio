import { useState, useEffect } from 'react';

export function getViewportMetrics(isLandscape, isConsoleMinimized) {
  if (typeof window === 'undefined') return { scale: 1, internalW: 384, internalH: 288 };
  const isMobile = window.innerWidth < 768;
  
  // Calculate the scale as if the console is fully open to keep zoom level constant
  const nominalConsoleWidth = isLandscape ? 320 : 0;
  const nominalConsoleHeight = isLandscape ? 0 : window.innerHeight * (isMobile ? 0.4 : 0.333);
  const nominalAvailableWidth = window.innerWidth - nominalConsoleWidth;
  const nominalAvailableHeight = window.innerHeight - nominalConsoleHeight;
  
  const baseW = 256;
  const baseH = 192;
  let scale = Math.floor(Math.min(nominalAvailableWidth / baseW, nominalAvailableHeight / baseH));
  
  if (window.innerWidth < 600) {
    scale = Math.max(1.25, scale);
  } else {
    scale = Math.max(1, scale);
  }
  
  // Calculate actual viewport dimensions using the locked scale
  const actualConsoleWidth = (isLandscape && !isConsoleMinimized) ? 320 : 0;
  const actualConsoleHeight = isConsoleMinimized ? 64 : nominalConsoleHeight;
  const availableWidth = window.innerWidth - actualConsoleWidth;
  const availableHeight = window.innerHeight - actualConsoleHeight;
  
  return {
    scale,
    internalW: Math.ceil(availableWidth / scale),
    internalH: Math.ceil(availableHeight / scale)
  };
}

export function useViewport(isLandscape, isConsoleMinimized = false) {
  const [viewport, setViewport] = useState(() => getViewportMetrics(isLandscape, isConsoleMinimized));

  useEffect(() => {
    setViewport(getViewportMetrics(isLandscape, isConsoleMinimized));
    const handleResize = () => {
      setViewport(getViewportMetrics(isLandscape, isConsoleMinimized));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLandscape, isConsoleMinimized]);

  return viewport;
}
