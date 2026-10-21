// "How it works" tab: the evidence that the metrics make sense, in plain language.

import { $, el, pct } from "./utils.js";
import { barChart, calibrationChart } from "./charts.js";

const card = (title, description, ...content) => el("div", { class: "card" },
  el("div", { class: "card-header" }, el("div", { class: "card-title" }, title), el("div", { class: "card-description" }, description)),
  el("div", { class: "card-content" }, ...content));

export function createMethod(data) {
  const m = data.model;
  $("#method").replaceChildren(el("div", { class: "method-grid" },
    card("1. Space really matters",
      "Share of passes caught, depending on the distance between the receiver and the closest defender when the ball was thrown.",
      barChart(data.validation.map((v) => ({ label: `${v.bin} yd`, value: v.completion, note: `${v.n} passes` })),
        { xLabel: "distance to the closest defender when the ball is thrown" })),
    card("2. The model's predictions are honest",
      `When the model says “70%”, about 70% of those passes are really caught: dots close to the dashed line mean the predictions can be trusted.`,
      calibrationChart(data.calibration)),
    card("3. What we compute",
      "From the position and speed of the 22 players, 10 times per second.",
      el("p", {}, el("b", {}, "Chance of a catch: "), `a ${m.name} model trained on ${m.samples} real throws. It looks at the distance to the closest defender, how fast that defender is closing in, the receiver's speed, how far down the field he is, his distance to the quarterback and to the sideline. Quality score (AUC) ${m.auc}: clearly better than chance (0.5), far from perfect (1.0).`),
      el("p", {}, el("b", {}, "Extra space: "), "a receiver's space when the ball is thrown, minus the average space of players starting from the same spot against the same type of defense. This makes players in different roles comparable."),
      el("p", {}, el("b", {}, "Ignored while open: "), `the receiver had the best chance on the field (at least ${pct(data.summary.openThreshold)}) and the ball went to someone else.`)),
    card("4. Limits",
      "What this analysis cannot see.",
      el("p", {}, `Only 8 weeks of the 2021 season. The tracking does not say who the ball was meant for: we read the receiver's name in the official play text (found for ${data.summary.targets.toLocaleString("en")} passes to WR, TE and RB).`),
      el("p", {}, "The model does not know if the quarterback is under pressure or how accurate the throw is. Probabilities before the throw are an estimate from a model trained at the throw."),
      el("p", {}, "Running backs often catch short safety passes with lots of space, which is why they are only compared with other players starting behind the quarterback."))));
}
