// Entry point: load the data produced by the Python pipeline and start every view.

import { $, el, pct } from "./utils.js";
import { createReplay } from "./replay.js";
import { createBoard } from "./board.js";
import { createPlanner } from "./planner.js";
import { createMethod } from "./method.js";

function renderKpis(data) {
  const s = data.summary;
  const items = [
    [s.routes.toLocaleString("en"), "routes analysed"],
    [s.players, "receivers ranked"],
    [s.missedOpen.toLocaleString("en"), "open receivers ignored"],
    [data.model.auc, "model AUC"],
  ];
  $("#kpis").replaceChildren(...items.map(([v, label]) => el("div", { class: "kpi" }, el("b", {}, String(v)), el("span", {}, label))));
}

// tabs can be opened by link: index.html#board, #plan, #method
function setupTabs() {
  const buttons = document.querySelectorAll("#tabs button");
  const show = (name) => {
    buttons.forEach((x) => x.classList.toggle("active", x.dataset.tab === name));
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === `tab-${name}`));
  };
  buttons.forEach((b) => b.addEventListener("click", () => { show(b.dataset.tab); history.replaceState(null, "", `#${b.dataset.tab}`); }));
  const initial = location.hash.slice(1);
  if ([...buttons].some((b) => b.dataset.tab === initial)) show(initial);
}

async function main() {
  const response = await fetch("data/data.json");
  if (!response.ok) throw new Error("data/data.json not found: run ./run.sh first");
  const data = await response.json();
  renderKpis(data);
  setupTabs();
  const replay = createReplay(data);
  createBoard(data, replay);
  createPlanner(data);
  createMethod(data);
}

main().catch((err) => {
  document.querySelector("main").prepend(el("p", { class: "bad" }, `Error: ${err.message}`));
  console.error(err);
});
