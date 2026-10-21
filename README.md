# Open Window Lab

**Who gets open, when, and which open receivers the quarterback leaves on the table (WR · TE · RB).**

We built a model that reads the NFL tracking data frame by frame and gives every route runner (WR, TE, RB) a live *"chance of a catch if the ball were thrown to him right now"*, plus two metrics on top of it: **Separation Over Expected** (space at the throw compared with receivers lined up in the same spot against the same coverage) and **Ignored Open** (the receiver was the best option on the field at the throw, and the ball went elsewhere: 886 times in 8 weeks). The data backs it up: targeted receivers with under 2 yards of space are caught 56% of the time, against 87% with 6-8 yards. It also shows that receivers do not get open against every coverage in the same way: TE Mark Andrews gets +0.92 yds vs man but −0.38 vs zone, and WR Rondale Moore is the most open receiver in the league (+2.1 yds). A **coach** uses the Game Plan tab to pick who to feature against next week's defense, a **scout** uses the Receivers board to rank players independently of their quarterback, and a **broadcaster** uses the Play Lab replays to show the open man the quarterback missed.

![Play Lab](outputs/screenshots/lab.png)

---

## How to launch

One command (Linux / macOS, needs `python3 ≥ 3.10` and `git`):

```bash
./run.sh
```

It will:

1. create a virtual env in `.venv/` and install `requirements.txt` (pandas, numpy, scikit-learn);
2. download the dataset into `raw_data/` (~1 GB, first run only);
3. run the analysis pipeline (~35 s), which writes `web/data/data.json` and `outputs/leaderboard.csv`;
4. serve the web app on **http://localhost:8000** and open it in your browser.

| Option | Effect |
|---|---|
| `./run.sh --no-build` | skip the download and the analysis, reuse the committed `web/data/data.json` (starts in a few seconds) |
| `PORT=9000 ./run.sh` | serve on another port |
| `NO_BROWSER=1 ./run.sh` | do not open the browser automatically |
| `.venv/bin/python -m pipeline` | run only the analysis |

`web/data/data.json` is committed, so the app also works as a static site (for example GitHub Pages pointing at the `web/` folder) without running Python.

---

## What is in the app

| Tab | For | What it shows |
|---|---|---|
| **Play Lab** | broadcaster | 78 showcase plays replayed on a field. Each route runner has a ring coloured by his live catch probability, a dashed line to his nearest defender, and a timeline of the probability of every receiver from snap to throw. Three categories: *Open receiver ignored*, *Wide-open catch*, *Tight-window catch*. |
| **Receivers** | scout | Sortable, searchable table of 180 receivers (≥ 80 routes): SOE, SOE vs man, SOE vs zone, open at throw, ignored opens. Clicking a player opens a card with percentiles, a plain-language verdict ("man-coverage beater", "zone specialist") and a button to watch his plays. |
| **Game Plan** | coach | Pick your offense and the opponent's defense. The opponent's man/zone mix is weighted against each of your receivers' SOE vs man and vs zone to rank who to feature. |
| **Method** | everyone | Validation chart (completion vs space), model calibration chart, metric definitions and limits. |

![Receivers](outputs/screenshots/board.png)
![Game plan](outputs/screenshots/plan.png)

---

## Method

1. **Normalisation**: every play is flipped so the offense attacks to the right (`playDirection`).
2. **Per-frame features** for each route runner (PFF role `Pass Route`) from snap to throw: distance to the nearest defender, how fast that gap is closing, speed, depth past the line of scrimmage, distance to the quarterback, distance to the sideline, time since snap.
3. **Target**: the dataset does not name the targeted receiver, so we take the route runner closest to the ball on the last frame of the play (within 3 yards).
4. **Model**: logistic regression and gradient boosting are compared with 5-fold cross-validation on targeted throws (C vs I/IN). The best one (logistic regression, AUC 0.67) is then applied to **every frame of every route**, which gives the live probability.
5. **Metrics**
   - *Separation Over Expected*: space at the throw minus the mean of the same PFF alignment (e.g. `SLWR`, `TE-L`, `HB`) against the same coverage type (man / zone).
   - *Open at throw*: share of routes with a catch probability ≥ 80% at the throw.
   - *Ignored open*: the receiver had the highest probability on the play, ≥ 80%, and someone else was targeted.
   - *Game plan score*: `man_rate × SOE_man + (1 − man_rate) × SOE_zone`.

**Limits**: only weeks 1-8 of 2021; the target is inferred; the model only knows positions and speeds (no pressure on the QB, no ball placement); probabilities before the throw are an extrapolation of a model trained at the throw; running backs get easy space on check-downs, which is why SOE compares them only to other backfield alignments.

---

## Project structure

```
run.sh                 one command: setup, download, analysis, web server
requirements.txt
pipeline/              Python analysis (python -m pipeline)
  config.py            paths and constants (thresholds, event names)
  loading.py           read the csv files
  geometry.py          field orientation, key frames, nearest defender
  features.py          per-frame features of every route runner
  model.py             completion probability model (train, compare, predict)
  metrics.py           route, player and team metrics, validation tables
  replays.py           pick showcase plays and extract their tracking
  export.py            write web/data/data.json
  __main__.py          runs the steps in order
web/                   static web app, no build step
  index.html
  css/style.css
  js/main.js           loads the data, tabs
  js/replay.js         Play Lab controller
  js/field.js          canvas rendering of the field and players
  js/board.js          Receivers table and player card
  js/planner.js        Game Plan
  js/method.js         Method tab
  js/charts.js         small SVG charts
  js/utils.js          DOM and formatting helpers
  data/data.json       generated by the pipeline
outputs/
  leaderboard.csv      full receiver table
  screenshots/         images of the app
```

Data: [NFL Big Data Bowl regional event data](https://github.com/ThompsonJamesBliss/nfl-big-data-bowl-regional-event-data) (NFL Next Gen Stats tracking + PFF scouting, 2021 weeks 1-8).
