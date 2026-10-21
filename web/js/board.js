// Receivers tab: sortable leaderboard and a scouting card for the selected player.

import { $, el, num, pct, yds, signClass } from "./utils.js";

const COLUMNS = [
  { key: "displayName", label: "Player" },
  { key: "officialPosition", label: "Pos" },
  { key: "team", label: "Team" },
  { key: "routes", label: "Routes", fmt: (v) => v },
  { key: "soe", label: "SOE (yds)", fmt: yds, color: true },
  { key: "soe_man", label: "vs Man", fmt: yds, color: true },
  { key: "soe_zone", label: "vs Zone", fmt: yds, color: true },
  { key: "open_rate", label: "Open at throw", fmt: pct },
  { key: "targets", label: "Targets", fmt: (v) => v },
  { key: "missed_open", label: "Ignored open", fmt: (v) => v },
];

function percentile(players, key, value) {
  const values = players.map((p) => p[key]).filter((v) => v != null);
  return values.filter((v) => v <= value).length / values.length;
}

function verdict(p) {
  const man = p.soe_man ?? 0;
  const zone = p.soe_zone ?? 0;
  const lines = [];
  if (Math.abs(man - zone) > 0.5) {
    lines.push(man > zone
      ? `Man-coverage beater: ${yds(man - zone)} yds more space vs man than vs zone. Isolate him when the defense plays man.`
      : `Zone specialist: ${yds(zone - man)} yds more space vs zone than vs man. Feature him against zone-heavy defenses.`);
  } else {
    lines.push("Gets similar space against man and zone: a reliable option whatever the coverage.");
  }
  if (p.missed_rate > 0.05) {
    lines.push(`Left open and ignored on ${pct(p.missed_rate, 1)} of his routes (${p.missed_open} plays): untapped volume.`);
  }
  return lines;
}

export function createBoard(data, replay) {
  const players = data.players;
  const state = { sort: "soe", desc: true, position: "ALL", query: "", selected: null };

  function stat(label, value, fmt, key) {
    const share = value == null ? 0 : percentile(players, key, value);
    return el("div", { class: "stat" },
      el("div", { class: "row" }, el("span", {}, label), el("b", { class: signClass(key === "open_rate" ? 0 : value) }, fmt(value))),
      el("div", { class: "bar" }, el("i", { style: `width:${Math.round(share * 100)}%` })),
      el("small", { class: "muted" }, `better than ${Math.round(share * 100)}% of receivers`));
  }

  function renderCard(p) {
    const card = $("#card");
    const catchRate = p.targets ? p.catches / p.targets : null;
    card.replaceChildren(
      el("h2", {}, p.displayName),
      el("p", { class: "sub" }, `${p.officialPosition} · ${p.team} · ${p.routes} routes · ${p.targets} targets · ${pct(catchRate)} caught`),
      stat("Separation Over Expected", p.soe, yds, "soe"),
      stat("vs man coverage", p.soe_man, yds, "soe_man"),
      stat("vs zone coverage", p.soe_zone, yds, "soe_zone"),
      stat("Open at the throw", p.open_rate, pct, "open_rate"),
      ...verdict(p).map((t) => el("div", { class: "verdict" }, t)),
      replay.hasPlays(p.nflId)
        ? el("button", { onclick: () => { document.querySelector('[data-tab="lab"]').click(); replay.showPlayer(p.nflId); } }, "▶ Watch his plays")
        : null,
    );
  }

  function rows() {
    const q = state.query.toLowerCase();
    return players
      .filter((p) => state.position === "ALL" || p.officialPosition === state.position)
      .filter((p) => !q || p.displayName.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = a[state.sort] ?? -Infinity;
        const vb = b[state.sort] ?? -Infinity;
        const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
        return state.desc ? -cmp : cmp;
      });
  }

  function renderTable() {
    const head = el("tr", {}, COLUMNS.map((c) => el("th", {
      class: c.key === state.sort ? "sorted" : "",
      onclick: () => { state.desc = c.key === state.sort ? !state.desc : true; state.sort = c.key; renderTable(); },
    }, c.label + (c.key === state.sort ? (state.desc ? " ↓" : " ↑") : ""))));
    const body = rows().map((p) => el("tr", {
      class: p.nflId === state.selected ? "active" : "",
      onclick: () => { state.selected = p.nflId; renderCard(p); renderTable(); },
    }, COLUMNS.map((c) => {
      const v = p[c.key];
      if (c.key === "officialPosition") return el("td", {}, el("span", { class: `pos ${v}` }, v));
      return el("td", { class: c.color ? signClass(v) : "" }, c.fmt ? c.fmt(v) : v);
    })));
    $("#board").replaceChildren(el("thead", {}, head), el("tbody", {}, body));
  }

  function renderChips() {
    $("#positions").replaceChildren(...["ALL", "WR", "TE", "RB"].map((pos) => el("button", {
      class: pos === state.position ? "active" : "",
      onclick: () => { state.position = pos; renderChips(); renderTable(); },
    }, pos)));
  }

  $("#search").addEventListener("input", (e) => { state.query = e.target.value; renderTable(); });
  renderChips();
  renderTable();
  state.selected = players[0].nflId;
  renderCard(players[0]);
  renderTable();
}
