// Small helpers shared by every view.

export const $ = (selector, root = document) => root.querySelector(selector);

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

export const pct = (v, digits = 0) => (v == null ? "–" : `${(v * 100).toFixed(digits)}%`);
export const yds = (v, digits = 2) => (v == null ? "–" : `${v > 0 ? "+" : ""}${v.toFixed(digits)}`);
export const num = (v, digits = 2) => (v == null ? "–" : v.toFixed(digits));

// red (0.4) -> yellow (0.7) -> green (0.95): readable colour for a completion probability
export function probColor(p) {
  if (p == null) return "#888";
  const t = Math.min(1, Math.max(0, (p - 0.4) / 0.55));
  const hue = t * 130;
  return `hsl(${hue}, 80%, 52%)`;
}

export function signClass(v) {
  if (v == null) return "";
  return v > 0 ? "good" : v < 0 ? "bad" : "";
}

// last non-null value at or before index i (probabilities stop at the throw)
export function valueAt(series, i) {
  for (let k = Math.min(i, series.length - 1); k >= 0; k--) {
    if (series[k] != null) return series[k];
  }
  return null;
}
