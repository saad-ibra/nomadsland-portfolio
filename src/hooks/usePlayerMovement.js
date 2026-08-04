import { useState, useEffect, useRef, useCallback } from "react";
import { MOVE_COOLDOWN } from "../engine/constants";

export function usePlayerMovement({
  initialPos,
  canWalk,
  speedMultiplier = 1,
  isActive = true,
  isSailing = false,
  onMove,
  onAction,
  onCancel
}) {
  const [pos, setPos] = useState(() => initialPos);
  const [facing, setFacing] = useState("down");
  const [stepping, setStepping] = useState(false);

  const keysRef = useRef({});
  const lastMoveRef = useRef(0);
  const momentumRef = useRef({ dc: 0, dr: 0, stepsLeft: 0 });
  const onMoveRef = useRef(onMove);
  const onActionRef = useRef(onAction);
  const onCancelRef = useRef(onCancel);

  // Keep refs up to date
  useEffect(() => {
    onMoveRef.current = onMove;
    onActionRef.current = onAction;
    onCancelRef.current = onCancel;
  }, [onMove, onAction, onCancel]);

  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;

      if (!isActive) return;

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
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [isActive]);

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
      setFacing(dir);

      setPos((p) => {
        const nc = p.col + dc;
        const nr = p.row + dr;

        if (canWalk(nc, nr)) {
          setStepping(true);
          lastMoveRef.current = now;
          const newPos = { col: nc, row: nr };
          
          // Clear stepping flag shortly after
          setTimeout(() => setStepping(false), 90);
          
          if (onMoveRef.current) {
            // onMove can return a boolean to cancel the state update if it triggers a scene transition
            const cancelMove = onMoveRef.current(nc, nr);
            if (cancelMove) return p;
          }
          return newPos;
        } else {
          momentumRef.current.stepsLeft = 0; // stop gliding on wall bump
        }
        return p;
      });
    }, 30);

    return () => clearInterval(id);
  }, [isActive, speedMultiplier, canWalk, isSailing]);

  return { pos, setPos, facing, setFacing, stepping };
}
