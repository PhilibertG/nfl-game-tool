// Canvas rendering of the field and of one frame of a play. Offense always attacks to the right.

import { probColor, valueAt } from "./utils.js";

const LENGTH = 120;
const WIDTH = 53.3;
const COLORS = { offense: "#4c9bff", defense: "#ff5d5d", ball: "#c98a4b" };

function drawField(ctx, s) {
  ctx.fillStyle = "#1f5e33";
  ctx.fillRect(0, 0, LENGTH * s, WIDTH * s);
  ctx.fillStyle = "#184d29";
  ctx.fillRect(0, 0, 10 * s, WIDTH * s);
  ctx.fillRect(110 * s, 0, 10 * s, WIDTH * s);

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  for (let x = 10; x <= 110; x += 5) {
    ctx.beginPath();
    ctx.moveTo(x * s, 0);
    ctx.lineTo(x * s, WIDTH * s);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `${Math.round(2.2 * s)}px system-ui`;
  ctx.textAlign = "center";
  for (let x = 20; x <= 100; x += 10) {
    const label = String(x <= 60 ? x - 10 : 110 - x);
    ctx.fillText(label, x * s, 4 * s);
    ctx.fillText(label, x * s, (WIDTH - 2) * s);
  }
}

function line(ctx, s, x1, y1, x2, y2, color, width = 1, dash = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1 * s, (WIDTH - y1) * s);
  ctx.lineTo(x2 * s, (WIDTH - y2) * s);
  ctx.stroke();
  ctx.setLineDash([]);
}

function nearestDefender(defenders, x, y, i) {
  let best = null;
  let bestD = Infinity;
  for (const d of defenders) {
    const dist = Math.hypot(d.x[i] - x, d.y[i] - y);
    if (dist < bestD) { bestD = dist; best = d; }
  }
  return { defender: best, dist: bestD };
}

/** Draw frame i of a play. Returns the route runners with their current probability. */
export function drawFrame(canvas, play, i) {
  const ctx = canvas.getContext("2d");
  const s = canvas.width / LENGTH;
  drawField(ctx, s);

  const ball = play.entities.find((e) => e.side === "ball");
  const defenders = play.entities.filter((e) => e.side === "defense");
  const runners = play.entities.filter((e) => e.p);

  // line of scrimmage = ball position at the snap
  const los = ball.x[play.snapIndex];
  line(ctx, s, los, 0, los, WIDTH, "rgba(79,155,255,0.8)", 2);

  // separation lines (before the ball arrives)
  for (const r of runners) {
    const { defender } = nearestDefender(defenders, r.x[i], r.y[i], i);
    if (defender) line(ctx, s, r.x[i], r.y[i], defender.x[i], defender.y[i], "rgba(230,230,230,0.55)", 1, [4, 4]);
  }

  // players
  for (const e of play.entities) {
    if (e.side === "ball") continue;
    const x = e.x[i] * s;
    const y = (WIDTH - e.y[i]) * s;
    ctx.fillStyle = COLORS[e.side];
    ctx.beginPath();
    ctx.arc(x, y, 0.75 * s, 0, Math.PI * 2);
    ctx.fill();
    if (e.p) {
      const p = valueAt(e.p, i);
      ctx.strokeStyle = probColor(p);
      ctx.lineWidth = e.id === play.focus ? 0.55 * s : 0.35 * s;
      ctx.beginPath();
      ctx.arc(x, y, 1.6 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = `${e.id === play.focus ? "700 " : ""}${Math.round(1.5 * s)}px system-ui`;
      ctx.textAlign = "center";
      const lastName = e.name.split(" ").slice(1).join(" ") || e.name;
      ctx.fillText(`${lastName} ${p == null ? "" : Math.round(p * 100) + "%"}`, x, y - 2.2 * s);
    }
  }

  // ball
  ctx.fillStyle = COLORS.ball;
  ctx.beginPath();
  ctx.ellipse(ball.x[i] * s, (WIDTH - ball.y[i]) * s, 0.7 * s, 0.45 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.stroke();

  return runners.map((r) => ({ ...r, current: valueAt(r.p, i) }));
}
