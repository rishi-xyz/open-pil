export function leaseFraction(start: number, due: number, now: number) {
  return due <= start ? 0 : Math.max(0, Math.min(1, (due - now) / (due - start)));
}
