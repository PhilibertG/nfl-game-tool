// Small helpers shared by every view.

export const $ = (selector, root = document) => root.querySelector(selector);

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

/** A word with a plain-language explanation shown on hover. */
export const term = (text, tip) => el("span", { class: "term", tabindex: "0", "data-tip": tip }, text);

export const pct = (v, digits = 0) => (v == null ? "–" : `${(v * 100).toFixed(digits)}%`);
export function yds(v, digits = 1) {
  if (v == null) return "–";
  const r = Number(v.toFixed(digits)) || 0; // avoids "-0.0"
  return `${r > 0 ? "+" : ""}${r.toFixed(digits)} yd`;
}

export const signClass = (v) => (v == null ? "" : v > 0 ? "positive" : v < 0 ? "negative" : "");

export const lerp = (a, b, t) => a + (b - a) * t;

/** CSS custom property value (so the canvas follows the theme). */
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// red (<= 40%) -> yellow -> green (>= 95%): colour of a completion probability
export function probColor(p) {
  if (p == null) return "#9ca3af";
  const t = Math.min(1, Math.max(0, (p - 0.4) / 0.55));
  return `hsl(${t * 130}, 80%, ${52 - t * 7}%)`;
}

/** Value of a series at a fractional index, interpolated; probabilities stop at the throw (null after). */
export function sampleAt(series, i) {
  const lo = Math.floor(i);
  const hi = Math.min(lo + 1, series.length - 1);
  const a = lastValue(series, lo);
  const b = series[hi] ?? a;
  return a == null ? null : lerp(a, b, i - lo);
}

function lastValue(series, i) {
  for (let k = Math.min(i, series.length - 1); k >= 0; k--) {
    if (series[k] != null) return series[k];
  }
  return null;
}

export const lastName = (name) => name.split(" ").slice(1).join(" ") || name;

export const POSITION_NAMES = {
  WR: "Wide receiver: fast player lined up near the sideline, the main pass catcher.",
  TE: "Tight end: big player next to the blockers, blocks and catches short passes.",
  RB: "Running back: starts behind the quarterback, runs with the ball and catches short passes.",
};
