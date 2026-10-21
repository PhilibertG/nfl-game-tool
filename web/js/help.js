// "New to football?" dialog: the minimum needed to read the app. Opens by itself on the first visit.

import { $, el } from "./utils.js";

const SEEN_KEY = "owl-help-seen";

const GLOSSARY = [
  ["Quarterback (QB)", "The player who gets the ball at the start of each play and throws it."],
  ["Receiver", "A player who runs a planned path (a “route”) to catch the ball. Three kinds below."],
  ["WR · Wide receiver", "Fast player lined up near the sideline. The main pass catcher."],
  ["TE · Tight end", "Big player next to the blockers. Blocks, and catches short or middle passes."],
  ["RB · Running back", "Starts behind the quarterback. Mostly runs with the ball, also catches short passes."],
  ["Snap", "The moment the play starts: the ball is handed back to the quarterback."],
  ["Open", "A receiver far enough from every defender that a pass to him is likely to be caught."],
  ["Man / Zone defense", "Man: each defender follows one receiver. Zone: each defender guards an area."],
  ["Yard", "Unit of distance, about 0.91 m. The field is 120 yards long."],
  ["Down", "The attack has 4 tries (downs) to advance 10 yards, otherwise it loses the ball."],
];

function content(close) {
  return el("div", { class: "dialog", role: "dialog", "aria-modal": "true" },
    el("h2", {}, "American football in 60 seconds"),
    el("p", { class: "muted", style: "margin-top:6px" },
      "Two teams of 11. The attack tries to carry the ball to the far end of the field. On a passing play, the quarterback has about 3 seconds to throw the ball to a teammate before defenders reach him."),
    el("div", { class: "howto", style: "margin-top:16px" },
      ...[
        ["1", "Receivers run", "Up to 5 teammates run planned paths to get away from the defenders."],
        ["2", "Defenders cover", "Defenders try to stay close to them so a pass can't be caught."],
        ["3", "QB chooses", "The quarterback must spot who is free and throw. That choice decides the play."],
      ].map(([n, t, d]) => el("div", { class: "card" }, el("div", { class: "card-content step" },
        el("span", { class: "num" }, n), el("p", {}, el("b", {}, t), el("br"), el("span", { class: "muted" }, d)))))),
    el("p", { style: "margin-top:16px" }, el("b", {}, "What this site does: "),
      "it measures, every tenth of a second, how free each receiver is and his chance of catching the ball if it were thrown to him right now. Then it shows who gets free most often, against which defense, and when the quarterback missed a free teammate."),
    el("div", { class: "glossary" }, GLOSSARY.map(([k, v]) => el("div", {}, el("b", {}, k), el("span", { class: "muted small" }, v)))),
    el("div", { class: "dialog-footer" }, el("button", { class: "btn btn-primary", onclick: close }, "Got it, show me the plays")));
}

export function setupHelp() {
  const backdrop = $("#help");
  const close = () => {
    backdrop.classList.add("hidden");
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* storage unavailable */ }
  };
  const open = () => {
    backdrop.replaceChildren(content(close));
    backdrop.classList.remove("hidden");
  };
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  $("#help-open").addEventListener("click", open);

  // ?help=0 in the URL disables the automatic opening (used for screenshots)
  let seen = new URLSearchParams(location.search).get("help") === "0";
  try { seen = seen || localStorage.getItem(SEEN_KEY) === "1"; } catch { /* storage unavailable */ }
  if (!seen) open();
}
