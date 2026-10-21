// Game Plan tab: pick our offense and the opponent; rank our receivers by the space they should get
// against that defense's mix of man and zone coverage.

import { $, el, pct, yds } from "./utils.js";

function expectedSpace(player, manRate) {
  const man = player.soe_man ?? player.soe;
  const zone = player.soe_zone ?? player.soe;
  return manRate * man + (1 - manRate) * zone;
}

function fillSelect(select, values, initial) {
  select.replaceChildren(...values.map((v) => el("option", { value: v }, v)));
  select.value = initial;
}

export function createPlanner(data) {
  const offenses = [...new Set(data.players.map((p) => p.team))].sort();
  const defenses = data.teams.map((t) => t.team).sort();
  const mostManDefense = [...data.teams].sort((a, b) => b.man_rate - a.man_rate)[0].team;
  const offenseSelect = $("#offense");
  const defenseSelect = $("#defense");
  fillSelect(offenseSelect, offenses, offenses.includes("BAL") ? "BAL" : offenses[0]);
  fillSelect(defenseSelect, defenses, mostManDefense);

  function render() {
    const defense = data.teams.find((t) => t.team === defenseSelect.value);
    const ours = data.players
      .filter((p) => p.team === offenseSelect.value)
      .map((p) => ({ ...p, expected: expectedSpace(p, defense.man_rate) }))
      .sort((a, b) => b.expected - a.expected);
    const leagueMan = data.teams.reduce((s, t) => s + t.man_rate, 0) / data.teams.length;
    const best = ours[0];

    const split = el("div", { class: "split" },
      el("div", { style: `width:${defense.man_rate * 100}%;background:#7a2f2f` }, `Man ${pct(defense.man_rate)}`),
      el("div", { style: `width:${(1 - defense.man_rate) * 100}%;background:#24486b` }, `Zone ${pct(1 - defense.man_rate)}`));

    const scouting = el("div", { class: "panel" },
      el("h3", {}, `Scouting ${defense.team}`),
      split,
      el("p", { class: "muted" }, `${defense.team} plays man on ${pct(defense.man_rate)} of dropbacks (league average ${pct(leagueMan)}). Most used call: ${defense.top_coverage}. Sample: ${defense.plays} pass plays.`),
      best ? el("p", { class: "call" }, "Recommendation: feature ", el("b", {}, best.displayName),
        ` (${best.officialPosition}), expected ${yds(best.expected)} yds of extra space per route against this defense.`) : null);

    const ranking = el("div", { class: "panel" },
      el("h3", {}, `${offenseSelect.value} receivers vs ${defense.team}`),
      ours.length
        ? ours.map((p, i) => el("div", { class: "rank" },
            el("span", { class: "n" }, `${i + 1}`),
            el("span", {}, el("span", { class: `pos ${p.officialPosition}` }, p.officialPosition), ` ${p.displayName}`,
              el("small", { class: "muted" }, ` man ${yds(p.soe_man)} · zone ${yds(p.soe_zone)}`)),
            el("span", { class: `v ${p.expected >= 0 ? "good" : "bad"}` }, yds(p.expected))))
        : el("p", { class: "muted" }, "No receiver of this team has enough routes."),
      el("p", { class: "muted" }, "Expected space = man share × space vs man + zone share × space vs zone (yards over expected)."));

    $("#plan").replaceChildren(el("div", { class: "plan-grid" }, scouting, ranking));
  }

  offenseSelect.addEventListener("change", render);
  defenseSelect.addEventListener("change", render);
  render();
}
