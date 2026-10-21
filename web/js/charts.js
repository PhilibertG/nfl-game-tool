// Minimal SVG charts (no external library). Colours come from the theme's CSS variables.

const NS = "http://www.w3.org/2000/svg";
const AXIS = "fill:var(--muted-foreground)";
const GRID = "stroke:var(--border)";

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text != null) node.textContent = text;
  return node;
}

const frame = (width, height) => svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });
const label = (x, y, text, { anchor = "middle", size = 11, style = AXIS, ...rest } = {}) =>
  svg("text", { x, y, "font-size": size, "text-anchor": anchor, style, ...rest }, text);

/** Vertical bars. items: [{label, value, note}] with value in [0, 1]. */
export function barChart(items, { width = 520, height = 260, xLabel = "" } = {}) {
  const pad = { l: 40, r: 10, t: 24, b: 48 };
  const root = frame(width, height);
  const w = (width - pad.l - pad.r) / items.length;
  const y = (v) => pad.t + (1 - v) * (height - pad.t - pad.b);
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
    root.append(svg("line", { x1: pad.l, x2: width - pad.r, y1: y(v), y2: y(v), style: GRID }));
    root.append(label(pad.l - 6, y(v) + 4, `${v * 100}%`, { anchor: "end" }));
  });
  items.forEach((it, i) => {
    const x = pad.l + i * w + w * 0.18;
    const bw = w * 0.64;
    root.append(svg("rect", { x, y: y(it.value), width: bw, height: y(0) - y(it.value), rx: 6, style: "fill:var(--chart-2)" }));
    root.append(label(x + bw / 2, y(it.value) - 6, `${Math.round(it.value * 100)}%`, { size: 12, style: "fill:var(--foreground);font-weight:600" }));
    root.append(label(x + bw / 2, height - pad.b + 16, it.label, { size: 12 }));
    if (it.note) root.append(label(x + bw / 2, height - pad.b + 30, it.note, { size: 10 }));
  });
  root.append(label(width / 2, height - 2, xLabel, { size: 12 }));
  return root;
}

/** Predicted vs real (calibration) with the ideal diagonal. */
export function calibrationChart(points, { width = 520, height = 280 } = {}) {
  const pad = { l: 44, r: 14, t: 14, b: 40 };
  const root = frame(width, height);
  const lo = 0.3, hi = 1;
  const x = (v) => pad.l + ((v - lo) / (hi - lo)) * (width - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
  [0.4, 0.6, 0.8, 1].forEach((v) => {
    root.append(svg("line", { x1: x(lo), x2: x(hi), y1: y(v), y2: y(v), style: GRID }));
    root.append(label(pad.l - 6, y(v) + 4, `${v * 100}%`, { anchor: "end" }));
    root.append(label(x(v), height - pad.b + 16, `${v * 100}%`));
  });
  root.append(svg("line", { x1: x(lo), y1: y(lo), x2: x(hi), y2: y(hi), style: "stroke:var(--muted-foreground)", "stroke-dasharray": "4 4" }));
  points.forEach((p) => {
    root.append(svg("circle", { cx: x(p.predicted), cy: y(p.real), r: 4 + Math.sqrt(p.n) / 3, style: "fill:var(--chart-1);fill-opacity:.8" }));
  });
  root.append(label(width / 2, height - 4, "predicted chance of a catch", { size: 12 }));
  root.append(label(12, height / 2, "real catch rate", { size: 12, transform: `rotate(-90 12 ${height / 2})` }));
  return root;
}

/**
 * Probability lines over time for the replay. Built once per play; only the cursor moves.
 * series: [{name, color, values: [p|null], highlight}]
 */
export function timelineChart(series, length, { throwIndex, snapIndex, width = 900, height = 190 }) {
  const pad = { l: 40, r: 150, t: 12, b: 24 };
  const root = frame(width, height);
  const x = (i) => pad.l + (i / Math.max(1, length - 1)) * (width - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v) * (height - pad.t - pad.b);

  [0, 0.5, 1].forEach((v) => {
    root.append(svg("line", { x1: pad.l, x2: width - pad.r, y1: y(v), y2: y(v), style: GRID }));
    root.append(label(pad.l - 6, y(v) + 4, `${v * 100}%`, { anchor: "end", size: 10 }));
  });
  root.append(svg("line", { x1: pad.l, x2: width - pad.r, y1: y(0.8), y2: y(0.8), style: "stroke:var(--positive)", "stroke-dasharray": "4 4" }));
  root.append(label(width - pad.r - 2, y(0.8) - 4, "open (80%)", { anchor: "end", size: 10, style: "fill:var(--positive)" }));
  root.append(label(x(snapIndex), height - 6, "snap (play starts)", { size: 10 }));
  root.append(svg("line", { x1: x(throwIndex), x2: x(throwIndex), y1: pad.t, y2: height - pad.b, style: "stroke:var(--ball)", "stroke-width": 2 }));
  root.append(label(x(throwIndex), height - 6, "ball thrown", { size: 10, style: "fill:var(--ball);font-weight:600" }));

  const ends = [];
  series.forEach((s) => {
    const pts = s.values.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
    if (!pts.length) return;
    root.append(svg("polyline", {
      points: pts.join(" "), fill: "none", stroke: s.color, "stroke-linejoin": "round",
      "stroke-width": s.highlight ? 3.5 : 1.8, "stroke-opacity": s.highlight ? 1 : 0.75,
    }));
    ends.push({ ...s, last: s.values.filter((v) => v != null).at(-1) });
  });
  // labels on the right, spread out so they never overlap
  ends.sort((a, b) => b.last - a.last);
  let prev = -Infinity;
  for (const e of ends) {
    const ly = Math.max(y(e.last) + 4, prev + 14);
    prev = ly;
    root.append(label(width - pad.r + 8, ly, `${e.name} ${Math.round(e.last * 100)}%`, {
      anchor: "start", size: 11, style: `fill:${e.color};font-weight:${e.highlight ? 700 : 500}`,
    }));
  }

  const cursor = svg("line", { y1: pad.t, y2: height - pad.b, style: "stroke:var(--foreground)", "stroke-width": 1.5 });
  root.append(cursor);
  const setCursor = (i) => {
    cursor.setAttribute("x1", x(i));
    cursor.setAttribute("x2", x(i));
  };
  setCursor(0);
  return { node: root, setCursor };
}
