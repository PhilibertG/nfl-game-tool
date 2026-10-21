// "Watch plays" tab: list of showcase plays, smooth playback (requestAnimationFrame + interpolation)
// and the probability timeline.

import { $, el, lastName, pct, probColor, term } from "./utils.js";
import { drawFrame, fitCanvas } from "./field.js";
import { timelineChart } from "./charts.js";

const FPS = 10; // tracking data frequency
const RESULT = { C: "caught", I: "incomplete (not caught)", IN: "intercepted by the defense" };
const MAN_CALLS = new Set(["Cover-0", "Cover-1", "2-Man", "Cover 1 Double"]);

const CATEGORY_HELP = {
  missed: "A receiver was clearly open, but the quarterback threw to someone else.",
  open_catch: "The receiver was completely free and caught the ball.",
  tight_catch: "The receiver was closely marked, but still made the catch.",
};

function coverageTerm(call) {
  const man = MAN_CALLS.has(call);
  return term(`${man ? "Man" : "Zone"} defense (${call})`, man
    ? "Man defense: each defender follows one receiver everywhere."
    : "Zone defense: each defender guards an area of the field instead of a player.");
}

export function createReplay(data) {
  const state = { list: [], index: 0, pos: 0, fresh: true, playing: false, speed: 1, last: 0, chart: null };
  const canvas = $("#field");
  const scrub = $("#scrub");
  const toggle = $("#toggle");

  const play = () => state.list[state.index];
  const lastIndex = () => play().entities[0].x.length - 1;
  const focusOf = (r) => r.entities.find((e) => e.id === r.focus);

  // ---------- list ----------
  function fillCategories() {
    const select = $("#category");
    select.append(el("option", { value: "all" }, `All plays (${data.replays.length})`));
    for (const [key, label] of Object.entries(data.categories)) {
      const n = data.replays.filter((r) => r.category === key).length;
      select.append(el("option", { value: key }, `${label} (${n})`));
    }
    select.addEventListener("change", () => setList(select.value));
  }

  function renderList() {
    $("#plays").replaceChildren(...state.list.map((r, i) => el("li", {
      class: i === state.index ? "active" : "",
      onclick: () => { pause(); select(i); },
    },
    el("span", { class: "name" }, focusOf(r)?.name ?? ""),
    el("span", { class: "muted small" }, `${data.categories[r.category]} · ${r.offense} vs ${r.defense}`))));
  }

  // ---------- story card ----------
  function renderStory() {
    const r = play();
    const focus = focusOf(r);
    const pThrow = focus.p.filter((v) => v != null).at(-1);
    const name = el("b", {}, focus.name);
    const headline = {
      missed: [name, ` had a ${pct(pThrow)} chance of catching it when the ball was thrown, the best on the field. The quarterback threw elsewhere and the pass was ${RESULT[r.result]}.`],
      open_catch: [name, ` was wide open (${pct(pThrow)} chance) when the ball was thrown, and caught it for ${r.yards} yards.`],
      tight_catch: [name, ` only had a ${pct(pThrow)} chance when the ball was thrown, a defender was right on him, and he still caught it.`],
    }[r.category];

    $("#story").replaceChildren(
      el("div", { class: "badges" },
        el("span", { class: "badge badge-primary" }, data.categories[r.category]),
        el("span", { class: "badge" }, `${r.offense} (attack) vs ${r.defense} (defense)`),
        el("span", { class: "badge" }, coverageTerm(r.coverage)),
        el("span", { class: "badge" }, term(`Down ${r.down}, ${r.toGo} yd to go`,
          "The attack has 4 tries (downs) to move the ball 10 yards. Here: try number " + r.down + ", " + r.toGo + " yards still needed."))),
      el("p", { class: "headline" }, ...headline),
      el("p", { class: "muted small" }, CATEGORY_HELP[r.category], " Official play text: ", el("i", {}, r.description)),
    );
  }

  // ---------- timeline ----------
  function buildTimeline() {
    const r = play();
    const series = r.entities.filter((e) => e.p).map((e) => ({
      name: lastName(e.name),
      color: e.id === r.focus ? "currentColor" : probColor(e.p.filter((v) => v != null).at(-1)),
      values: e.p,
      highlight: e.id === r.focus,
    }));
    state.chart = timelineChart(series, lastIndex() + 1, { throwIndex: r.throwIndex, snapIndex: r.snapIndex });
    $("#timeline").replaceChildren(state.chart.node);
  }

  // ---------- drawing ----------
  function phaseText(r, i) {
    if (i < r.snapIndex) return "Before the play starts";
    if (i < r.throwIndex) return `Quarterback looking for a receiver · ${((i - r.snapIndex) / FPS).toFixed(1)} s`;
    return "Ball thrown";
  }

  function render() {
    const r = play();
    fitCanvas(canvas);
    drawFrame(canvas, r, state.pos);
    state.chart.setCursor(state.pos);
    scrub.value = state.pos;
    $("#phase").textContent = phaseText(r, state.pos);
    const t = (state.pos - r.snapIndex) / FPS;
    $("#clock").textContent = `${t >= 0 ? "+" : "−"}${Math.abs(t).toFixed(1)} s`;
  }

  // ---------- playback ----------
  function loop(now) {
    if (!state.playing) return;
    const dt = Math.min(0.1, (now - state.last) / 1000);
    state.last = now;
    state.pos = Math.min(lastIndex(), state.pos + dt * FPS * state.speed);
    render();
    if (state.pos >= lastIndex()) return pause();
    requestAnimationFrame(loop);
  }

  function start() {
    if (state.fresh || state.pos >= lastIndex()) state.pos = 0;
    state.fresh = false;
    state.playing = true;
    state.last = performance.now();
    toggle.textContent = "❚❚ Pause";
    requestAnimationFrame(loop);
  }

  function pause() {
    state.playing = false;
    toggle.textContent = state.pos >= lastIndex() ? "↺ Replay" : "▶ Play";
  }

  function select(i) {
    state.index = (i + state.list.length) % state.list.length;
    state.pos = play().throwIndex; // first show the key moment: the throw
    state.fresh = true;
    scrub.max = lastIndex();
    renderList();
    renderStory();
    buildTimeline();
    render();
    toggle.textContent = "▶ Play";
    $("#plays li.active")?.scrollIntoView({ block: "nearest" });
  }

  function setList(category, playerId = null) {
    state.list = data.replays.filter((r) =>
      (category === "all" || r.category === category) && (playerId == null || r.focus === playerId));
    if (!state.list.length) state.list = data.replays;
    select(0);
  }

  toggle.addEventListener("click", () => (state.playing ? pause() : start()));
  $("#prev").addEventListener("click", () => { pause(); select(state.index - 1); });
  $("#next").addEventListener("click", () => { pause(); select(state.index + 1); });
  scrub.addEventListener("input", () => { pause(); state.fresh = false; state.pos = Number(scrub.value); render(); });
  $("#speed").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.speed = Number(b.dataset.speed);
    $("#speed").querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
  });
  window.addEventListener("resize", () => render());
  document.addEventListener("themechange", () => render());

  fillCategories();
  setList("all");

  return {
    /** Show the plays of one player (used by the player profile). */
    showPlayer(playerId) {
      pause();
      $("#category").value = "all";
      setList("all", playerId);
      start();
    },
    hasPlays: (playerId) => data.replays.some((r) => r.focus === playerId),
    refresh: () => render(),
  };
}
