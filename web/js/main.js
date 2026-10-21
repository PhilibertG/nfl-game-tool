// Entry point: load the data produced by the Python pipeline and start every view.

import { $, el } from "./utils.js";
import { createReplay } from "./replay.js";
import { createBoard } from "./board.js";
import { createPlanner } from "./planner.js";
import { createMethod } from "./method.js";
import { setupHelp } from "./help.js";

const THEME_KEY = "owl-theme";

function renderKpis(data) {
  const s = data.summary;
  const items = [
    [s.routes.toLocaleString("en"), "routes analysed", "paths run by receivers on pass plays"],
    [s.players, "receivers ranked", "players with at least 80 routes"],
    [s.missedOpen.toLocaleString("en"), "free receivers ignored", "best option on the field, ball thrown elsewhere"],
    [`${Math.round((data.validation.at(-2)?.completion ?? 0) * 100)}% vs ${Math.round(data.validation[0].completion * 100)}%`,
      "catch rate: free vs covered", "6-8 yards of space vs under 2 yards"],
  ];
  $("#kpis").replaceChildren(...items.map(([value, label, hint]) => el("div", { class: "card kpi" },
    el("div", { class: "card-content" },
      el("div", { class: "label" }, label),
      el("div", { class: "value" }, String(value)),
      el("div", { class: "muted small" }, hint)))));
}

// tabs can be opened by link: index.html#board, #plan, #method
function setupTabs(onShow) {
  const buttons = [...document.querySelectorAll("#tabs button")];
  const show = (name) => {
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === `tab-${name}`));
    history.replaceState(null, "", `#${name}`);
    onShow(name);
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  const initial = location.hash.slice(1);
  if (buttons.some((b) => b.dataset.tab === initial)) show(initial);
  return show;
}

function setupTheme() {
  const apply = (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    document.dispatchEvent(new Event("themechange"));
  };
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage unavailable */ }
  apply(saved === "dark");
  $("#theme").addEventListener("click", () => {
    const dark = !document.documentElement.classList.contains("dark");
    apply(dark);
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch { /* storage unavailable */ }
  });
}

async function main() {
  setupTheme();
  const response = await fetch("data/data.json");
  if (!response.ok) throw new Error("data/data.json not found: run ./run.sh first");
  const data = await response.json();
  renderKpis(data);
  const replay = createReplay(data);
  const show = setupTabs((name) => { if (name === "lab") replay.refresh(); });
  createBoard(data, replay, show);
  createPlanner(data);
  createMethod(data);
  setupHelp();
}

main().catch((err) => {
  $(".container").prepend(el("p", { class: "negative" }, `Error: ${err.message}`));
  console.error(err);
});
