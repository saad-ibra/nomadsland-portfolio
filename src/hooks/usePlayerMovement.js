import { useState, useEffect, useRef, useCallback } from "react";
import { MOVE_COOLDOWN } from "../engine/constants";

export function usePlayerMovement({
  sceneId,
  initialPos,
  canWalk,
  speedMultiplier = 1,
  isActive = true,
  isSailing = false,
  ignoreSavedPos = false,
  onMove,
  onAction,
  onCancel
}) {
  const [pos, setPos] = useState(() => {
    if (sceneId && !ignoreSavedPos) {
      const saved = localStorage.getItem(`pos_${sceneId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.col === 'number' && !isNaN(parsed.col) && typeof parsed.row === 'number' && !isNaN(parsed.row)) {
          return parsed;
        }
      }
    }
    return initialPos;
  });

  // Force reset if pos is corrupted in memory due to HMR
  useEffect(() => {
    if (!pos || isNaN(pos.col) || isNaN(pos.row)) {
      setPos(initialPos);
    }
  }, [pos, initialPos]);

  const [facing, setFacing] = useState("down");
  const [stepping, setStepping] = useState(false);

  const keysRef = useRef({});
  const lastMoveRef = useRef(0);
  const momentumRef = useRef({ dc: 0, dr: 0, stepsLeft: 0 });
  const turnBlockRef = useRef(false);
  const facingRef = useRef(facing);
  const onMoveRef = useRef(onMove);
  const onActionRef = useRef(onAction);
  const onCancelRef = useRef(onCancel);
  const canWalkRef = useRef(canWalk);

  // Keep refs up to date
  useEffect(() => {
    onMoveRef.current = onMove;
    onActionRef.current = onAction;
    onCancelRef.current = onCancel;
    canWalkRef.current = canWalk;
  }, [onMove, onAction, onCancel, canWalk]);

  useEffect(() => {
    facingRef.current = facing;
  }, [facing]);

  useEffect(() => {
    if (sceneId && pos) {
      localStorage.setItem(`pos_${sceneId}`, JSON.stringify(pos));
    }
  }, [pos, sceneId]);

  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      
      let isDirKey = false;
      let pressedDir = null;
      if (k === "arrowup" || k === "w") { isDirKey = true; pressedDir = "up"; }
      else if (k === "arrowdown" || k === "s") { isDirKey = true; pressedDir = "down"; }
      else if (k === "arrowleft" || k === "a") { isDirKey = true; pressedDir = "left"; }
      else if (k === "arrowright" || k === "d") { isDirKey = true; pressedDir = "right"; }

      if (isDirKey && !keysRef.current[k] && isActive) {
        if (facingRef.current !== pressedDir) {
          setFacing(pressedDir);
          facingRef.current = pressedDir;
          turnBlockRef.current = true;
          setTimeout(() => {
            if (keysRef.current[k]) {
              turnBlockRef.current = false;
            }
          }, 120); // 120ms long press delay
        }
      }

      keysRef.current[k] = true;

      if (!isActive) {
        // Even if inactive (e.g. dialogue open), allow escape/b to trigger onCancel
        if (k === "escape") {
          if (onCancelRef.current) {
            e.preventDefault();
            onCancelRef.current();
          }
        }
        return;
      }

      if (k === " " || k === "enter") {
        if (onActionRef.current) {
          e.preventDefault();
          onActionRef.current();
        }
      }
      if (k === "escape") {
        if (onCancelRef.current) {
          e.preventDefault();
          onCancelRef.current();
        }
      }
    };

    const up = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = false;

      const krs = keysRef.current;
      const anyDirPressed = krs["arrowup"] || krs["w"] || krs["arrowdown"] || krs["s"] || krs["arrowleft"] || krs["a"] || krs["arrowright"] || krs["d"];
      if (!anyDirPressed) {
        turnBlockRef.current = false;
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isActive]);

  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);

  useEffect(() => {
    if (!isActive) {
      setStepping(false);
      return;
    }

    const id = setInterval(() => {
      const now = Date.now();
      const currentSpeed = isSailing ? speedMultiplier * 1.5 : speedMultiplier;
      if (now - lastMoveRef.current < (MOVE_COOLDOWN / currentSpeed)) return;

      const k = keysRef.current;
      let dc = 0, dr = 0;
      if (k["arrowup"] || k["w"]) dr = -1;
      else if (k["arrowdown"] || k["s"]) dr = 1;
      else if (k["arrowleft"] || k["a"]) dc = -1;
      else if (k["arrowright"] || k["d"]) dc = 1;

      if (dc === 0 && dr === 0) {
        if (isSailing && momentumRef.current.stepsLeft > 0) {
          dc = momentumRef.current.dc;
          dr = momentumRef.current.dr;
          momentumRef.current.stepsLeft--;
        } else {
          setStepping(false);
          return;
        }
      } else {
        if (isSailing) {
          momentumRef.current = { dc, dr, stepsLeft: 1 }; // glide 1 extra step
        } else {
          momentumRef.current = { dc: 0, dr: 0, stepsLeft: 0 };
        }
      }

      const dir = dr < 0 ? "up" : dr > 0 ? "down" : dc < 0 ? "left" : "right";
      
      // If we are blocking movement because we just turned, abort here
      if (turnBlockRef.current) {
        setStepping(false);
        return;
      }

      setFacing(dir);

      const p = posRef.current;
      const nc = p.col + dc;
      const nr = p.row + dr;

      if (canWalkRef.current(nc, nr)) {
        setStepping(true);
        lastMoveRef.current = now;
        const newPos = { col: nc, row: nr };
        
        // Clear stepping flag shortly after
        setTimeout(() => setStepping(false), 90);
        
        if (onMoveRef.current) {
          const cancelMove = onMoveRef.current(nc, nr);
          if (cancelMove) return;
        }
        
        setPos(newPos);
      } else {
        momentumRef.current.stepsLeft = 0; // stop gliding on wall bump
      }
    }, 30);

    return () => clearInterval(id);
  }, [isActive, speedMultiplier, isSailing]);

  return { pos, setPos, facing, setFacing, stepping };
}
