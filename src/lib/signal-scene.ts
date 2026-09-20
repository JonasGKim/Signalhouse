/** Position-based chapters remain legible when readers revisit earlier sections. */
export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export function advanceProgress(
  _progress: number,
  _previousY: number,
  nextY: number,
  start: number,
  range: number,
): number {
  return clamp((nextY - start) / Math.max(1, range));
}
export function chapterAt(progress: number): number {
  return Math.min(4, Math.floor(clamp(progress) * 5));
}
