// Minimal SVG charts (no external library).

const NS = "http://www.w3.org/2000/svg";

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text != null) node.textContent = text;
  return node;
}

function frame(width, height) {
  return svg("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });
}

const AXIS = "#8fa39a";
const GRID = "#2a3a34";

/** Vertical bars. items: [{label, value, note}] with value in [0, 1]. */
export function barChart(items, { width = 520, height = 260, color = "#4fd18b", xLabel = "" } = {}) {
  const pad = { l: 40, r: 10, t: 24, b: 44 };
  const root = frame(width, height);
  const w = (width - pad.l - pad.r) / items.length;
  const y = (v) => pad.t + (1 - v) * (height - pad.t - pad.b);
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
    root.append(svg("line", { x1: pad.l, x2: width - pad.r, y1: y(v), y2: y(v), stroke: GRID }));
    root.append(svg("text", { x: pad.l - 6, y: y(v) + 4, fill: AXIS, "font-size": 11, "text-anchor": "end" }, `${v * 100}%`));
  });
  items.forEach((it, i) => {
    const x = pad.l + i * w + w * 0.15;
    root.append(svg("rect", { x, y: y(it.value), width: w * 0.7, height: y(0) - y(it.value), rx: 4, fill: color }));
    root.append(svg("text", { x: x + w * 0.35, y: y(it.value) - 6, fill: "#e8efe9", "font-size": 12, "text-anchor": "middle" },
      `${Math.round(it.value * 100)}%`));
    root.append(svg("text", { x: x + w * 0.35, y: height - pad.b + 16, fill: AXIS, "font-size": 12, "text-anchor": "middle" }, it.label));
    if (it.note) root.append(svg("text", { x: x + w * 0.35, y: height - pad.b + 30, fill: AXIS, "font-size": 10, "text-anchor": "middle" }, it.note));
  });
  root.append(svg("text", { x: width / 2, y: height - 2, fill: AXIS, "font-size": 12, "text-anchor": "middle" }, xLabel));
  return root;
}

/** Predicted vs real scatter with the diagonal (calibration). */
export function calibrationChart(points, { width = 520, height = 280 } = {}) {
  const pad = { l: 44, r: 14, t: 14, b: 40 };
  const root = frame(width, height);
  const lo = 0.3, hi = 1;
  const x = (v) => pad.l + ((v - lo) / (hi - lo)) * (width - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
  [0.4, 0.6, 0.8, 1].forEach((v) => {
    root.append(svg("line", { x1: x(lo), x2: x(hi), y1: y(v), y2: y(v), stroke: GRID }));
    root.append(svg("text", { x: pad.l - 6, y: y(v) + 4, fill: AXIS, "font-size": 11, "text-anchor": "end" }, `${v * 100}%`));
    root.append(svg("text", { x: x(v), y: height - pad.b + 16, fill: AXIS, "font-size": 11, "text-anchor": "middle" }, `${v * 100}%`));
  });
  root.append(svg("line", { x1: x(lo), y1: y(lo), x2: x(hi), y2: y(hi), stroke: AXIS, "stroke-dasharray": "4 4" }));
  points.forEach((p) => {
    root.append(svg("circle", { cx: x(p.predicted), cy: y(p.real), r: 4 + Math.sqrt(p.n) / 3, fill: "#4fd18b", "fill-opacity": 0.75 }));
  });
  root.append(svg("text", { x: width / 2, y: height - 4, fill: AXIS, "font-size": 12, "text-anchor": "middle" }, "predicted completion probability"));
  root.append(svg("text", { x: 12, y: height / 2, fill: AXIS, "font-size": 12, "text-anchor": "middle", transform: `rotate(-90 12 ${height / 2})` }, "real completion rate"));
  return root;
}

/**
 * Probability lines over time for the replay.
 * series: [{name, color, values: [p|null], highlight}], markers: {throwIndex, current}
 */
export function timelineChart(series, length, { throwIndex, snapIndex, current, width = 900, height = 170 }) {
  const pad = { l: 40, r: 120, t: 10, b: 22 };
  const root = frame(width, height);
  const x = (i) => pad.l + (i / Math.max(1, length - 1)) * (width - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v) * (height - pad.t - pad.b);
  [0, 0.5, 0.8, 1].forEach((v) => {
    root.append(svg("line", { x1: pad.l, x2: width - pad.r, y1: y(v), y2: y(v), stroke: GRID, "stroke-dasharray": v === 0.8 ? "4 4" : "" }));
    root.append(svg("text", { x: pad.l - 6, y: y(v) + 4, fill: AXIS, "font-size": 10, "text-anchor": "end" }, `${v * 100}%`));
  });
  root.append(svg("text", { x: x(snapIndex), y: height - 6, fill: AXIS, "font-size": 10, "text-anchor": "middle" }, "snap"));
  root.append(svg("line", { x1: x(throwIndex), x2: x(throwIndex), y1: pad.t, y2: height - pad.b, stroke: "#c98a4b" }));
  root.append(svg("text", { x: x(throwIndex), y: height - 6, fill: "#c98a4b", "font-size": 10, "text-anchor": "middle" }, "throw"));

  series.forEach((s, k) => {
    const pts = s.values.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
    if (!pts.length) return;
    root.append(svg("polyline", {
      points: pts.join(" "), fill: "none", stroke: s.color,
      "stroke-width": s.highlight ? 3 : 1.6, "stroke-opacity": s.highlight ? 1 : 0.8,
    }));
    const last = s.values.filter((v) => v != null).at(-1);
    root.append(svg("text", { x: width - pad.r + 6, y: y(last) + 4 + (k % 2 ? 6 : -2), fill: s.color, "font-size": 11, "font-weight": s.highlight ? 700 : 400 },
      `${s.name} ${Math.round(last * 100)}%`));
  });
  root.append(svg("line", { x1: x(current), x2: x(current), y1: pad.t, y2: height - pad.b, stroke: "#e8efe9", "stroke-width": 1.5 }));
  return root;
}
