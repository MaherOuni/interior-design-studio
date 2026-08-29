import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Snap a scalar value to the nearest multiple of `step`. */
export function snap(value: number, step: number) {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/** Clamp a number between min and max. */
export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Small unique id. */
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Euclidean distance between two 2D points. */
export function dist2(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(bx - ax, bz - az);
}
