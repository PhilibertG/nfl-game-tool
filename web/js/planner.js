// "Game plan" tab: pick your team and next opponent; rank your receivers by the space they should get
// against that defense's mix of man and zone.

import { $, el, pct, yds, term, POSITION_NAMES } from "./utils.js";

const expectedSpace = (p, manRate) =>
  manRate * (p.soe_man ?? p.soe) + (1 - manRate) * (p.soe_zone ?? p.soe);

function fillSelect(select, values, initial) {
  select.replaceChildren(...values.map((v) => el("option", { value: v }, v)));
  select.value = initial;
}

export function createPlanner(data) {
  const offenses = [...new Set(data.players.map((p) => p.team))].sort();
  const defenses = data.teams.map((t) => t.team).sort();
  const leagueMan = data.teams.reduce((s, t) => s + t.man_rate, 0) / data.teams.length;
  const offense = $("#offense");
  const defense = $("#defense");
  fillSelect(offense, offenses, offenses.includes("BAL") ? "BAL" : offenses[0]);
  fillSelect(defense, defenses, [...data.teams].sort((a, b) => b.man_rate - a.man_rate)[0].team);

  function render() {
    const d = data.teams.find((t) => t.team === defense.value);
    const ours = data.players
      .filter((p) => p.team === offense.value)
      .map((p) => ({ ...p, expected: expectedSpace(p, d.man_rate) }))
      .sort((a, b) => b.expected - a.expected);
    const best = ours[0];
    const style = d.man_rate > leagueMan + 0.05 ? "plays a lot of man defense"
      : d.man_rate < leagueMan - 0.05 ? "plays mostly zone defense" : "mixes man and zone like an average team";

    const scouting = el("div", { class: "card" },
      el("div", { class: "card-header" },
        el("div", { class: "card-title" }, `How ${d.team} defends`),
        el("div", { class: "card-description" }, `Based on ${d.plays} pass plays.`)),
      el("div", { class: "card-content" },
        el("div", { class: "split" },
          el("div", { style: `width:${d.man_rate * 100}%;background:var(--chart-1)` }, `Man ${pct(d.man_rate)}`),
          el("div", { style: `width:${(1 - d.man_rate) * 100}%;background:var(--chart-3)` }, `Zone ${pct(1 - d.man_rate)}`)),
        el("p", { class: "muted" }, `${d.team} ${style} (league average: ${pct(leagueMan)} man). Most used scheme: ${d.top_coverage}.`),
        el("div", { class: "separator" }),
        best
          ? el("p", { class: "recommend" }, "Recommendation: make ", el("b", {}, best.displayName),
              ` (${best.officialPosition}) the main target. Against this defense he should get `, el("b", { class: "positive" }, yds(best.expected)),
              " more space per route than an average receiver in his spot.")
          : el("p", { class: "muted" }, "No receiver of this team has enough routes.")));

    const ranking = el("div", { class: "card" },
      el("div", { class: "card-header" },
        el("div", { class: "card-title" }, `${offense.value} receivers ranked against ${d.team}`),
        el("div", { class: "card-description" }, "Expected extra space = his space vs man × how often they play man + his space vs zone × how often they play zone.")),
      el("div", { class: "card-content" },
        ours.map((p, i) => el("div", { class: "rank" },
          el("span", { class: "n" }, `${i + 1}`),
          el("div", {},
            el("div", { class: "player-cell" },
              el("span", { class: `badge badge-pos ${p.officialPosition}` }, term(p.officialPosition, POSITION_NAMES[p.officialPosition])),
              el("b", {}, p.displayName)),
            el("span", { class: "muted small" }, `vs man ${yds(p.soe_man)} · vs zone ${yds(p.soe_zone)}`)),
          el("span", { class: `v ${p.expected >= 0 ? "positive" : "negative"}` }, yds(p.expected))))));

    const explain = el("div", { class: "explain" },
      el("div", { class: "callout" }, el("b", {}, "Man defense: "), "each defender follows one receiver everywhere. Fast receivers who change direction sharply beat it."),
      el("div", { class: "callout" }, el("b", {}, "Zone defense: "), "each defender guards an area. Receivers who find the gaps between areas beat it."));

    $("#plan").replaceChildren(el("div", { class: "grid-2" }, scouting, ranking), explain);
  }

  offense.addEventListener("change", render);
  defense.addEventListener("change", render);
  render();
}
