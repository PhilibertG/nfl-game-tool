// Formatting and small numeric helpers shared by the views.

import type { Position } from "@/types"

export const pct = (v: number | null | undefined, digits = 0) =>
  v == null ? "–" : `${(v * 100).toFixed(digits)}%`

export function yds(v: number | null | undefined, digits = 1) {
  if (v == null) return "–"
  const r = Number(v.toFixed(digits)) || 0 // avoids "-0.0"
  return `${r > 0 ? "+" : ""}${r.toFixed(digits)} yd`
}

export const signClass = (v: number | null | undefined) =>
  v == null ? "" : v > 0 ? "text-positive" : v < 0 ? "text-negative" : ""

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const lastName = (name = "") => name.split(" ").slice(1).join(" ") || name

/** Red (<= 40%) -> yellow -> green (>= 95%): colour of a catch probability. */
export function probColor(p: number | null | undefined) {
  if (p == null) return "#9ca3af"
  const t = Math.min(1, Math.max(0, (p - 0.4) / 0.55))
  return `hsl(${t * 130}, 80%, ${52 - t * 7}%)`
}

/** Value at a fractional index, interpolated. Probabilities stop at the throw (null after). */
export function sampleAt(series: (number | null)[], i: number) {
  const lo = Math.floor(i)
  const hi = Math.min(lo + 1, series.length - 1)
  const a = lastValue(series, lo)
  const b = series[hi] ?? a
  return a == null ? null : lerp(a, b ?? a, i - lo)
}

export function lastValue(series: (number | null)[], i = series.length - 1) {
  for (let k = Math.min(i, series.length - 1); k >= 0; k--) {
    const v = series[k]
    if (v != null) return v
  }
  return null
}

/** Share of the other values strictly below this one. */
export function percentile(values: (number | null)[], value: number | null) {
  if (value == null) return 0
  const clean = values.filter((v): v is number => v != null)
  return clean.filter((v) => v < value).length / Math.max(1, clean.length - 1)
}

export const topShare = (share: number) => `top ${Math.max(1, Math.round((1 - share) * 100))}%`

export const POSITION_NAMES: Record<Position, string> = {
  WR: "Wide receiver: fast player lined up near the sideline, the main pass catcher.",
  TE: "Tight end: big player next to the blockers, blocks and catches short passes.",
  RB: "Running back: starts behind the quarterback, runs with the ball and catches short passes.",
}

const MAN_CALLS = new Set(["Cover-0", "Cover-1", "2-Man", "Cover 1 Double"])
export const isManCall = (call: string) => MAN_CALLS.has(call)
