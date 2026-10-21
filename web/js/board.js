// "Players" tab: sortable table and a profile card written in plain language.

import { $, el, pct, yds, signClass, term, POSITION_NAMES } from "./utils.js";

const COLUMNS = [
  { key: "displayName", label: "Player" },
  { key: "team", label: "Team" },
  { key: "routes", label: "Routes", tip: "Number of pass plays where he ran a path to receive the ball.", fmt: String },
  { key: "soe", label: "Extra space", tip: "Average space (yards) between him and the closest defender when the ball is thrown, compared with other players starting from the same spot. Higher = gets open more.", fmt: yds, color: true },
  { key: "soe_man", label: "vs man", tip: "Extra space when each defender follows one receiver.", fmt: yds, color: true },
  { key: "soe_zone", label: "vs zone", tip: "Extra space when each defender guards an area.", fmt: yds, color: true },
  { key: "open_rate", label: "Open when thrown", tip: "Share of his routes where he had at least 80% chance of a catch at the moment the ball was thrown.", fmt: (v) => pct(v) },
  { key: "missed_open", label: "Ignored while open", tip: "Plays where he was the most open player on the field, but the ball went to someone else.", fmt: String },
];

// share of the other receivers strictly below this value
const percentile = (players, key, value) => {
  const values = players.map((p) => p[key]).filter((v) => v != null);
  return values.filter((v) => v < value).length / Math.max(1, values.length - 1);
};

const topShare = (share) => `top ${Math.max(1, Math.round((1 - share) * 100))}%`;

function verdicts(p) {
  const man = p.soe_man ?? 0;
  const zone = p.soe_zone ?? 0;
  const out = [];
  if (p.soe_pct >= 0.8) out.push(`One of the best at getting free: ${topShare(p.soe_pct)} of all receivers for space.`);
  else if (p.soe_pct <= 0.2) out.push("Usually tightly covered: wins with catching in traffic rather than with space.");
  if (man - zone > 0.5) out.push(`Beats man defense: ${yds(man - zone)} more space against it than against zone. Feature him when the opponent plays man.`);
  else if (zone - man > 0.5) out.push(`Finds holes in zone defense: ${yds(zone - man)} more space against it than against man. Feature him against zone-heavy opponents.`);
  else out.push("Gets about the same space against both defenses: a reliable option whatever the opponent does.");
  if (p.missed_rate > 0.05) out.push(`Was open and ignored on ${pct(p.missed_rate, 1)} of his routes (${p.missed_open} plays): the quarterback could use him more.`);
  return out;
}

export function createBoard(data, replay, showTab) {
  const players = data.players;
  const state = { sort: "soe", desc: true, position: "ALL", query: "", selected: players[0].nflId };

  function stat(label, tip, value, fmt, key) {
    const share = value == null ? 0 : percentile(players, key, value);
    return el("div", { class: "stat" },
      el("div", { class: "row" }, term(label, tip), el("b", { class: key === "open_rate" ? "" : signClass(value) }, fmt(value))),
      el("div", { class: "progress" }, el("i", { style: `width:${Math.round(share * 100)}%` })),
      el("span", { class: "muted small" }, `${topShare(share)} of the ${players.length} receivers`));
  }

  function renderProfile(p) {
    const catchRate = p.targets ? p.catches / p.targets : null;
    const col = (key) => COLUMNS.find((c) => c.key === key);
    $("#profile").replaceChildren(
      el("div", { class: "card-header" },
        el("div", { class: "player-cell" },
          el("span", { class: `badge badge-pos ${p.officialPosition}` }, term(p.officialPosition, POSITION_NAMES[p.officialPosition])),
          el("span", { class: "card-title", style: "font-size:18px" }, p.displayName)),
        el("div", { class: "card-description" },
          `${p.team} · ${p.routes} routes · ${p.targets} balls thrown to him · ${pct(catchRate)} caught`)),
      el("div", { class: "card-content" },
        stat("Extra space", col("soe").tip, p.soe, yds, "soe"),
        stat("vs man defense", col("soe_man").tip, p.soe_man, yds, "soe_man"),
        stat("vs zone defense", col("soe_zone").tip, p.soe_zone, yds, "soe_zone"),
        stat("Open when thrown", col("open_rate").tip, p.open_rate, (v) => pct(v), "open_rate"),
        el("div", { class: "separator" }),
        el("div", { class: "card-title" }, "In plain words"),
        ...verdicts(p).map((t) => el("div", { class: "callout" }, t)),
        replay.hasPlays(p.nflId)
          ? el("button", { class: "btn btn-primary", style: "width:100%;margin-top:14px",
              onclick: () => { showTab("lab"); replay.showPlayer(p.nflId); } }, "▶ Watch his plays")
          : null));
  }

  function rows() {
    const q = state.query.trim().toLowerCase();
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

  function cell(p, c) {
    if (c.key === "displayName") {
      return el("td", {}, el("div", { class: "player-cell" },
        el("span", { class: `badge badge-pos ${p.officialPosition}` }, p.officialPosition), p.displayName));
    }
    const v = p[c.key];
    return el("td", { class: c.color ? signClass(v) : "" }, c.fmt ? c.fmt(v) : v);
  }

  function renderTable() {
    const head = el("tr", {}, COLUMNS.map((c) => el("th", {
      class: c.key === state.sort ? "sorted" : "",
      title: c.tip ?? "",
      onclick: () => { state.desc = c.key === state.sort ? !state.desc : true; state.sort = c.key; renderTable(); },
    }, c.label, c.key === state.sort ? (state.desc ? " ↓" : " ↑") : "")));
    const body = rows().map((p) => el("tr", {
      class: p.nflId === state.selected ? "active" : "",
      onclick: () => { state.selected = p.nflId; renderProfile(p); renderTable(); },
    }, COLUMNS.map((c) => cell(p, c))));
    $("#board").replaceChildren(el("thead", {}, head), el("tbody", {}, body));
  }

  function renderPositions() {
    const labels = { ALL: "All", WR: "WR", TE: "TE", RB: "RB" };
    $("#positions").replaceChildren(...Object.entries(labels).map(([pos, label]) => el("button", {
      class: pos === state.position ? "active" : "",
      title: POSITION_NAMES[pos] ?? "All positions",
      onclick: () => { state.position = pos; renderPositions(); renderTable(); },
    }, label)));
  }

  $("#search").addEventListener("input", (e) => { state.query = e.target.value; renderTable(); });
  renderPositions();
  renderTable();
  renderProfile(players[0]);
}
