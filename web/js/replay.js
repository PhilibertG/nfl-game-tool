// Play Lab: list of showcase plays, playback controls and the probability timeline.

import { $, el, probColor, valueAt } from "./utils.js";
import { drawFrame } from "./field.js";
import { timelineChart } from "./charts.js";

const FPS = 10;
const RESULT = { C: "Complete", I: "Incomplete", IN: "Intercepted" };

export function createReplay(data) {
  // fresh = the play is paused on its throw frame and has not been played yet
  const state = { list: [], index: 0, frame: 0, fresh: true, playing: false, timer: null };
  const canvas = $("#field");
  const scrub = $("#scrub");
  const toggle = $("#toggle");

  const play = () => state.list[state.index];

  function fillCategories() {
    const select = $("#category");
    select.append(el("option", { value: "all" }, "All showcase plays"));
    for (const [key, label] of Object.entries(data.categories)) {
      const n = data.replays.filter((r) => r.category === key).length;
      select.append(el("option", { value: key }, `${label} (${n})`));
    }
    select.addEventListener("change", () => setList(select.value));
  }

  function focusName(r) {
    return r.entities.find((e) => e.id === r.focus)?.name ?? "";
  }

  function renderList() {
    const ul = $("#plays");
    ul.replaceChildren(...state.list.map((r, i) => el("li", {
      class: i === state.index ? "active" : "",
      onclick: () => select(i),
    }, `${focusName(r)}`, el("small", {}, `${r.offense} vs ${r.defense} · ${data.categories[r.category]} · ${RESULT[r.result] ?? r.result}`))));
  }

  function renderHead() {
    const r = play();
    const focus = r.entities.find((e) => e.id === r.focus);
    const pThrow = focus?.p ? valueAt(focus.p, r.throwIndex) : null;
    const story = {
      missed: `${focus.name} was the most open receiver at the throw (${Math.round(pThrow * 100)}% chance of a catch), but the ball went elsewhere.`,
      open_catch: `${focus.name} was wide open at the throw (${Math.round(pThrow * 100)}%) and made the catch.`,
      tight_catch: `${focus.name} caught it in a tight window: only ${Math.round(pThrow * 100)}% predicted at the throw.`,
    }[r.category];
    $("#play-head").replaceChildren(
      el("span", { class: "tag hot" }, data.categories[r.category]),
      el("span", { class: "tag" }, `${r.offense} vs ${r.defense}`),
      el("span", { class: "tag" }, `Down ${r.down} & ${r.toGo}`),
      el("span", { class: "tag" }, r.coverage),
      el("span", { class: "tag" }, `${RESULT[r.result] ?? r.result}, ${r.yards} yds`),
      el("p", {}, story),
      el("p", {}, r.description),
    );
  }

  function renderFrame() {
    const r = play();
    drawFrame(canvas, r, state.frame);
    scrub.value = state.frame;
    const t = (state.frame - r.snapIndex) / FPS;
    $("#clock").textContent = `${t >= 0 ? "+" : ""}${t.toFixed(1)} s after snap`;
    const series = r.entities.filter((e) => e.p).map((e) => ({
      name: e.name.split(" ").at(-1),
      color: e.id === r.focus ? "#ffffff" : probColor(valueAt(e.p, r.throwIndex)),
      values: e.p,
      highlight: e.id === r.focus,
    }));
    const length = r.entities[0].x.length;
    $("#timeline").replaceChildren(timelineChart(series, length, {
      throwIndex: r.throwIndex, snapIndex: r.snapIndex, current: state.frame,
    }));
  }

  function select(i) {
    state.index = (i + state.list.length) % state.list.length;
    state.frame = play().throwIndex;
    state.fresh = true;
    scrub.max = play().entities[0].x.length - 1;
    renderList();
    renderHead();
    renderFrame();
    $("#plays li.active")?.scrollIntoView({ block: "nearest" });
  }

  function setList(category, playerId = null) {
    state.list = data.replays.filter((r) =>
      (category === "all" || r.category === category) && (playerId == null || r.focus === playerId));
    if (!state.list.length) state.list = data.replays;
    select(0);
  }

  function tick() {
    const last = play().entities[0].x.length - 1;
    if (state.frame >= last) return pause();
    state.frame += 1;
    renderFrame();
  }

  function start() {
    if (state.fresh || state.frame >= play().entities[0].x.length - 1) state.frame = 0;
    state.fresh = false;
    state.playing = true;
    toggle.textContent = "⏸";
    state.timer = setInterval(tick, 1000 / FPS / Number($("#speed").value));
  }

  function pause() {
    state.playing = false;
    toggle.textContent = "▶";
    clearInterval(state.timer);
  }

  toggle.addEventListener("click", () => (state.playing ? pause() : start()));
  $("#speed").addEventListener("change", () => { if (state.playing) { pause(); start(); } });
  $("#prev").addEventListener("click", () => { pause(); select(state.index - 1); });
  $("#next").addEventListener("click", () => { pause(); select(state.index + 1); });
  scrub.addEventListener("input", () => { pause(); state.fresh = false; state.frame = Number(scrub.value); renderFrame(); });

  fillCategories();
  setList("all");

  return {
    /** Show the showcase plays of one player (used by the receiver card). */
    showPlayer(playerId) {
      pause();
      $("#category").value = "all";
      setList("all", playerId);
      start();
    },
    hasPlays: (playerId) => data.replays.some((r) => r.focus === playerId),
  };
}
