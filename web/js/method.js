// Method tab: how the metrics are built and the evidence that they work.

import { $, el, pct } from "./utils.js";
import { barChart, calibrationChart } from "./charts.js";

export function createMethod(data) {
  const m = data.model;
  const validation = barChart(
    data.validation.map((v) => ({ label: v.bin, value: v.completion, note: `n=${v.n}` })),
    { xLabel: "yards between targeted receiver and nearest defender at the throw" });

  $("#method").replaceChildren(el("div", { class: "method" },
    el("div", { class: "panel" },
      el("h3", {}, "1 · Space matters"),
      el("p", {}, "Completion rate of targeted passes by the space the receiver had when the ball left the quarterback's hand."),
      validation),
    el("div", { class: "panel" },
      el("h3", {}, "2 · The model sees it coming"),
      el("p", {}, `A ${m.name} trained on ${m.samples} targeted throws predicts the catch from ${m.features.length} tracking features `
        + `(${m.features.join(", ")}). Cross-validated AUC ${m.auc} (base completion rate ${pct(m.base_rate)}). `
        + "Points on the dashed line mean the predicted probability matches reality."),
      calibrationChart(data.calibration)),
    el("div", { class: "panel" },
      el("h3", {}, "3 · Metrics"),
      el("p", {}, el("b", {}, "Separation Over Expected (SOE): "), "space at the throw minus the average of receivers lined up in the same spot (PFF alignment) against the same coverage type. Removes the bias of slot vs outside vs backfield."),
      el("p", {}, el("b", {}, "Open at throw: "), `share of routes where the model gives at least ${pct(data.summary.openThreshold)} chance of a catch when the ball is thrown.`),
      el("p", {}, el("b", {}, "Ignored open: "), "the receiver was the best option on the field at the throw, above the threshold, and the ball went to someone else.")),
    el("div", { class: "panel" },
      el("h3", {}, "4 · Limits"),
      el("p", {}, "Only weeks 1-8 of 2021. The target is not in the data: it is inferred as the route runner closest to the ball at the end of the play. "
        + "The model only knows positions and speeds (no ball placement, no quarterback pressure). Running backs get easy space on check-downs, "
        + "which is why SOE compares them only to other backfield alignments."))));
}
