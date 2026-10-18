"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

// The second callback argument requests a final, static frame whenever animation is unavailable.
export function useMotionFrame<T extends HTMLElement>(draw: (elapsed: number, reduced: boolean, element: T) => void | boolean, active = true, resetKey: unknown = undefined) {
  const ref = useRef<T>(null);
  const callback = useRef(draw);
  const reduced = useReducedMotion();
  useEffect(() => { callback.current = draw; }, [draw]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0, elapsed = 0, previous: number | undefined, painted = -Infinity, visible = true;
    const stop = () => { cancelAnimationFrame(frame); previous = undefined; };
    const tick = (now: number) => {
      if (previous !== undefined) elapsed += now - previous;
      previous = now;
      let keepGoing: void | boolean = true;
      if (elapsed - painted >= 34) { keepGoing = callback.current(elapsed, false, element); painted = elapsed; }
      if (keepGoing !== false) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      stop(); painted = -Infinity;
      const paused = !active || !!reduced || !visible || document.hidden;
      element.dataset.motionPaused = String(paused);
      if (paused) callback.current(elapsed, true, element);
      else frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
    observer.observe(element);
    const resize = new ResizeObserver(resume);
    resize.observe(element);
    document.addEventListener("visibilitychange", resume);
    resume();
    return () => { stop(); observer.disconnect(); resize.disconnect(); document.removeEventListener("visibilitychange", resume); };
  }, [active, reduced, resetKey]);
  return ref;
}
