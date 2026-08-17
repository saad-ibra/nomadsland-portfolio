import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

/* ── Timing ─────────────────────────────────────────────── */
const CLOSE_MS  = 420;   // iris closes
const HOLD_MS   = 120;   // hold on black while scene swaps
const OPEN_MS   = 420;   // iris opens

/* ── Easing ─────────────────────────────────────────────── */
function easeInCubic(t)  { return t * t * t; }
function easeOutCubic(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }

/* ── Draw one frame of the pixelated iris ────────────────── */
function drawIris(ctx, w, h, progress, bs) {
  ctx.clearRect(0, 0, w, h);

  // progress 0 = fully open, 1 = fully closed
  if (progress <= 0) return;
  if (progress >= 1) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  const maxR = Math.sqrt(w * w + h * h) * 0.5;
  const r    = maxR * (1 - progress);
  const cx   = w * 0.5;
  const cy   = h * 0.5;

  ctx.fillStyle = '#000';

  // Draw black blocks outside the circle — pixelated edge
  for (let y = 0; y < h; y += bs) {
    for (let x = 0; x < w; x += bs) {
      const bx = x + bs * 0.5;
      const by = y + bs * 0.5;
      const dx = bx - cx;
      const dy = by - cy;
      if (dx * dx + dy * dy > r * r) {
        ctx.fillRect(x, y, bs, bs);
      }
    }
  }
}

/* ── Component ──────────────────────────────────────────── */
const SceneTransition = forwardRef(function SceneTransition(_props, ref) {
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const animatingRef = useRef(false);

  /* keep canvas sized to viewport */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  /* expose play(onMidpoint) */
  useImperativeHandle(ref, () => ({
    play(onMidpoint) {
      if (animatingRef.current) return;     // ignore re-entrance
      animatingRef.current = true;

      const canvas = canvasRef.current;
      if (!canvas) {
        onMidpoint?.();
        animatingRef.current = false;
        return;
      }

      const ctx = canvas.getContext('2d');
      const w   = window.innerWidth;
      const h   = window.innerHeight;

      // responsive block size: ~50 blocks across the short axis
      let bs = Math.max(6, Math.ceil(Math.min(w, h) / 48));
      if (bs % 2 !== 0) bs += 1;          // even blocks look cleaner

      canvas.style.display = 'block';

      let start = null;

      /* ---- phase 1: iris close ---- */
      const closeStep = (ts) => {
        if (!start) start = ts;
        const t = Math.min((ts - start) / CLOSE_MS, 1);
        drawIris(ctx, w, h, easeInCubic(t), bs);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(closeStep);
        } else {
          // fully black → hold, swap scene, then open
          setTimeout(() => {
            onMidpoint?.();
            // wait one frame so React can re-render the new scene
            requestAnimationFrame(() => {
              start = null;
              rafRef.current = requestAnimationFrame(openStep);
            });
          }, HOLD_MS);
        }
      };

      /* ---- phase 2: iris open ---- */
      const openStep = (ts) => {
        if (!start) start = ts;
        const t = Math.min((ts - start) / OPEN_MS, 1);
        drawIris(ctx, w, h, 1 - easeOutCubic(t), bs);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(openStep);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.style.display = 'none';
          animatingRef.current = false;
        }
      };

      rafRef.current = requestAnimationFrame(closeStep);
    }
  }));

  /* cleanup on unmount */
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,           // below CRT scanlines (9999)
        pointerEvents: 'none',
        display: 'none',
        imageRendering: 'pixelated',
      }}
    />
  );
});

export default SceneTransition;
