import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ reduced: false, element: { dataset: {} as Record<string, string> }, cleanups: [] as (() => void)[] }));
vi.mock("react", () => ({ useRef: (value: unknown) => ({ current: value === null ? state.element : value }), useEffect: (effect: () => void | (() => void)) => { const cleanup = effect(); if (cleanup) state.cleanups.push(cleanup); } }));
vi.mock("motion/react", () => ({ useReducedMotion: () => state.reduced }));
import { useMotionFrame } from "./use-motion-frame";
describe("motion final frames", () => {
  let intersect: (entries: { isIntersecting: boolean }[]) => void;
  let visibility: () => void;
  let hidden: boolean;
  beforeEach(() => {
    state.reduced = false; state.element.dataset = {}; hidden = false;
    vi.stubGlobal("document", { get hidden() { return hidden; }, addEventListener: (_: string, callback: () => void) => { visibility = callback; }, removeEventListener: vi.fn() });
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("IntersectionObserver", class { constructor(callback: typeof intersect) { intersect = callback; } observe() {} disconnect() {} });
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  });
  afterEach(() => { state.cleanups.splice(0).forEach(cleanup => cleanup()); vi.unstubAllGlobals(); });
  it("draws the final state when its first intersection is invisible", () => {
    const draw = vi.fn(); useMotionFrame(draw);
    intersect([{ isIntersecting: false }]);
    expect(draw).toHaveBeenLastCalledWith(0, true, state.element);
    expect(state.element.dataset.motionPaused).toBe("true");
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
  it("draws a final frame without scheduling work for reduced motion", () => {
    state.reduced = true; const draw = vi.fn(); useMotionFrame(draw);
    expect(draw).toHaveBeenCalledWith(0, true, state.element);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
  it("draws the final state when inactive or hidden and resumes when visible", () => {
    const draw = vi.fn(); useMotionFrame(draw, false);
    expect(draw).toHaveBeenCalledWith(0, true, state.element);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    useMotionFrame(draw);
    hidden = true; visibility();
    expect(draw).toHaveBeenLastCalledWith(0, true, state.element);
    hidden = false; visibility();
    expect(state.element.dataset.motionPaused).toBe("false");
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });
});
