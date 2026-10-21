// Canvas rendering of the field and of one (possibly fractional) frame of a play.
// Positions are interpolated between two tracking frames so the animation stays smooth at 60 fps.
// Offense always attacks to the right.

import { cssVar, lastName, lerp, probColor, sampleAt } from "./utils.js";

const LENGTH = 120;
const WIDTH = 53.3;

/** Match the canvas buffer to its displayed size (sharp on high-DPI screens). */
export function fitCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function position(entity, i) {
  const lo = Math.floor(i);
  const hi = Math.min(lo + 1, entity.x.length - 1);
  const t = i - lo;
  return { x: lerp(entity.x[lo], entity.x[hi], t), y: lerp(entity.y[lo], entity.y[hi], t) };
}

function drawField(ctx, s) {
  ctx.fillStyle = "#2f7a46";
  ctx.fillRect(0, 0, LENGTH * s, WIDTH * s);
  // mowing stripes
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let x = 10; x < 110; x += 10) ctx.fillRect(x * s, 0, 5 * s, WIDTH * s);
  // end zones
  ctx.fillStyle = "#256139";
  ctx.fillRect(0, 0, 10 * s, WIDTH * s);
  ctx.fillRect(110 * s, 0, 10 * s, WIDTH * s);

  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = Math.max(1, s * 0.12);
  for (let x = 10; x <= 110; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0);
    ctx.lineTo(x * s, WIDTH * s);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `600 ${Math.round(2.2 * s)}px Geist, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let x = 20; x <= 100; x += 10) {
    const label = String(x <= 60 ? x - 10 : 110 - x);
    ctx.fillText(label, x * s, 3.5 * s);
    ctx.fillText(label, x * s, (WIDTH - 3.5) * s);
  }
}

function dashedLine(ctx, s, a, b) {
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = Math.max(1, s * 0.12);
  ctx.setLineDash([s * 0.6, s * 0.5]);
  ctx.beginPath();
  ctx.moveTo(a.x * s, (WIDTH - a.y) * s);
  ctx.lineTo(b.x * s, (WIDTH - b.y) * s);
  ctx.stroke();
  ctx.setLineDash([]);
}

function nearest(points, p) {
  let best = null;
  let bestD = Infinity;
  for (const q of points) {
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < bestD) { bestD = d; best = q; }
  }
  return best;
}

/** Draw the play at fractional frame index i. */
export function drawFrame(canvas, play, i) {
  const ctx = canvas.getContext("2d");
  const s = canvas.width / LENGTH;
  drawField(ctx, s);

  const colors = { offense: cssVar("--offense"), defense: cssVar("--defense"), ball: cssVar("--ball") };
  const ball = play.entities.find((e) => e.side === "ball");
  const players = play.entities.filter((e) => e.side !== "ball").map((e) => ({ ...e, pos: position(e, i) }));
  const defenders = players.filter((e) => e.side === "defense").map((e) => e.pos);
  const receivers = players.filter((e) => e.p);

  // line of scrimmage (where the play starts)
  const los = ball.x[play.snapIndex];
  ctx.strokeStyle = "rgba(96,165,250,0.9)";
  ctx.lineWidth = s * 0.25;
  ctx.beginPath();
  ctx.moveTo(los * s, 0);
  ctx.lineTo(los * s, WIDTH * s);
  ctx.stroke();

  for (const r of receivers) {
    const d = nearest(defenders, r.pos);
    if (d) dashedLine(ctx, s, r.pos, d);
  }

  for (const e of players) {
    const x = e.pos.x * s;
    const y = (WIDTH - e.pos.y) * s;
    ctx.fillStyle = colors[e.side];
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.arc(x, y, 0.8 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // probability rings and labels on top
  for (const r of receivers) {
    const p = sampleAt(r.p, i);
    const focus = r.id === play.focus;
    const x = r.pos.x * s;
    const y = (WIDTH - r.pos.y) * s;
    ctx.strokeStyle = probColor(p);
    ctx.lineWidth = (focus ? 0.55 : 0.35) * s;
    ctx.beginPath();
    ctx.arc(x, y, 1.7 * s, 0, Math.PI * 2);
    ctx.stroke();

    const label = `${lastName(r.name)}${p == null ? "" : ` ${Math.round(p * 100)}%`}`;
    ctx.font = `${focus ? 700 : 500} ${Math.round(1.45 * s)}px Geist, system-ui`;
    const w = ctx.measureText(label).width + s;
    const ly = y - 3 * s;
    ctx.fillStyle = focus ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(x - w / 2, ly - s, w, 2 * s, s * 0.5);
    ctx.fill();
    ctx.fillStyle = focus ? "#111" : "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, ly);
  }

  const b = position(ball, i);
  ctx.fillStyle = colors.ball;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  ctx.ellipse(b.x * s, (WIDTH - b.y) * s, 0.75 * s, 0.48 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
