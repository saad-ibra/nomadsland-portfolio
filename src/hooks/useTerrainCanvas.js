import { useRef, useEffect } from "react";
import { MAP, MAP_COLS, MAP_ROWS, PALETTE } from "../data/village";
import { TILE } from "../engine/constants";

// Same deterministic hash as VillageScene
function hash(r, c) {
  return (r * 7 + c * 13);
}

/**
 * Pre-bakes the village ground terrain onto two <canvas> elements:
 * 1. waterCanvas: Paints water (4) and docks (11). Set zIndex=-10 in DOM.
 * 2. landCanvas: Paints grass, paths, cliffs, stairs (0,1,3,6,8,9). Set zIndex=0 in DOM.
 *
 * This two-layer approach is necessary so the boat (zIndex=-3 when near structures)
 * can slide *above* water/docks but *below* the land edges.
 *
 * Trees (2, 5, 7) and Bridges (10) are skipped on canvas and rendered as DOM/SVG
 * because they require dynamic Y-sorting or z-index changes.
 */
export function useTerrainCanvas() {
  const waterCanvasRef = useRef(null);
  const landCanvasRef = useRef(null);

  useEffect(() => {
    const wCanvas = waterCanvasRef.current;
    const lCanvas = landCanvasRef.current;
    if (!wCanvas || !lCanvas) return;

    wCanvas.width = MAP_COLS * TILE;
    wCanvas.height = MAP_ROWS * TILE;
    const wCtx = wCanvas.getContext("2d");

    lCanvas.width = MAP_COLS * TILE;
    lCanvas.height = MAP_ROWS * TILE;
    const lCtx = lCanvas.getContext("2d");

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const tile = MAP[r][c];
        const h = hash(r, c);
        const x = c * TILE;
        const y = r * TILE;

        // Bridges (10) are purely DOM for dynamic z-indexing
        if (tile === 10) continue;

        // Is this a water/dock tile?
        const isWaterLayer = tile === 4 || tile === 11;
        const ctx = isWaterLayer ? wCtx : lCtx;

        // ── Base background fill ──
        let bg;
        if (tile === 1) {
          bg = PALETTE.path[h % PALETTE.path.length];
        } else if (tile === 4) {
          bg = PALETTE.water[h % PALETTE.water.length];
        } else if (tile === 8) {
          bg = PALETTE.cliff[h % PALETTE.cliff.length];
        } else if (tile === 9) {
          bg = PALETTE.stairs[0];
        } else if (tile === 11) {
          bg = PALETTE.bridge[h % PALETTE.bridge.length];
        } else if (tile === 3) {
          bg = PALETTE.grass[0]; // house base
        } else {
          // tiles 0, 2, 5, 6, 7 all get grass base on land layer
          const distToLab = Math.sqrt(Math.pow(r - 17, 2) + Math.pow(c - 28, 2));
          const dryness = Math.max(0, Math.min(1, 1 - (distToLab - 2) / 7));
          const isDry = (h % 100) / 100 < dryness;
          bg = isDry ? PALETTE.dryGrass[h % PALETTE.dryGrass.length] : PALETTE.grass[h % PALETTE.grass.length];
        }

        // Fill tile background
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, TILE + 1, TILE + 1);

        // ── Per-tile details ──
        if (tile === 0 || tile === 6) {
          const distToLab = Math.sqrt(Math.pow(r - 17, 2) + Math.pow(c - 28, 2));
          const dryness = Math.max(0, Math.min(1, 1 - (distToLab - 2) / 7));
          const isDry = (h % 100) / 100 < dryness;
          
          if (h % 3 === 0) { ctx.fillStyle = isDry ? "#8a814c" : "#50a840"; ctx.fillRect(x + (h % 14) + 4, y + (h % 10) + 6, 2, 4); }
          if (h % 5 === 0) { ctx.fillStyle = isDry ? "#7a713b" : "#48a038"; ctx.fillRect(x + (h % 8) + 16, y + (h % 12) + 2, 2, 3); }
          if (tile === 6 && !isDry) {
            ctx.fillStyle = "#f878a0"; ctx.fillRect(x + 6, y + 6, 4, 4);
            ctx.fillStyle = "#f0c040"; ctx.fillRect(x + 8, y + 8, 2, 2);
            ctx.fillStyle = "#f0c040"; ctx.fillRect(x + 20, y + 18, 4, 4);
            ctx.fillStyle = "#f878a0"; ctx.fillRect(x + 22, y + 20, 2, 2);
            ctx.fillStyle = "#fff"; ctx.fillRect(x + 12, y + 22, 3, 3);
          }
        } else if (tile === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(x, y + TILE, TILE + 1, 1);
          ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(x + TILE, y, 1, TILE + 1);
        } else if (tile === 2 || tile === 5 || tile === 7) {
          if (h % 3 === 0) { ctx.fillStyle = "#50a840"; ctx.fillRect(x + (h % 14) + 4, y + (h % 10) + 6, 2, 4); }
          if (h % 5 === 0) { ctx.fillStyle = "#48a038"; ctx.fillRect(x + (h % 8) + 16, y + (h % 12) + 2, 2, 3); }
        } else if (tile === 4) {
          if (h % 3 === 0) { ctx.fillStyle = "#4090c0"; ctx.fillRect(x + (h % 8) + 2, y + (h % 10) + 6, 8, 2); }
          if (h % 4 === 0) { ctx.fillStyle = "#3888b8"; ctx.fillRect(x + (h % 12) + 14, y + (h % 8) + 16, 6, 2); }
          if (h % 7 === 0) { ctx.fillStyle = "#5098c8"; ctx.fillRect(x + (h % 6) + 8, y + (h % 14) + 2, 4, 1); }
        } else if (tile === 8) {
          ctx.fillStyle = "#4a3525"; ctx.fillRect(x + 2, y + (h % 8) + 2, 10, 2); ctx.fillRect(x + TILE - 12, y + TILE - (h % 6) - 6, 8, 2);
          ctx.fillStyle = "#6a5040"; ctx.fillRect(x, y, TILE + 1, 2);
          if (h % 3 === 0) { ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x + 10, y + 6, 1, 10); }
          if (h % 5 === 0) { ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x + 20, y + 14, 1, 8); }
        } else if (tile === 9) {
          for (const sy of [2, 10, 18, 26]) {
            ctx.fillStyle = PALETTE.stairs[1]; ctx.fillRect(x, y + sy, TILE + 1, 6);
            ctx.fillStyle = "#a0a0a0"; ctx.fillRect(x, y + sy, TILE + 1, 1);
            ctx.fillStyle = "#707070"; ctx.fillRect(x, y + sy + 5, TILE + 1, 1);
          }
        } else if (tile === 11) {
          ctx.fillStyle = "#5c3a18";
          for (const sx of [0, 8, 16, 24]) { ctx.fillRect(x + sx, y, 1, TILE); }
          ctx.fillRect(x, y, TILE + 1, 2);
          ctx.fillRect(x, y + TILE - 2, TILE + 1, 2);
        }
      }
    }
  }, []);

  return { waterCanvasRef, landCanvasRef };
}
