"""Separation Over Expected (SOE): how much more space a receiver (WR/TE/RB) has at the throw
than other receivers lined up in the same spot against the same coverage type.

Usage: python main.py   (expects the dataset cloned in ./raw_data/data)
"""
import glob
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

DATA = "raw_data/data/"
OUT = "outputs/"
MIN_ROUTES = 80
SNAP = {"ball_snap", "autoevent_ballsnap"}
THROW = {"pass_forward", "autoevent_passforward"}
KEEP = SNAP | THROW
COLORS = {"WR": "#1f77b4", "TE": "#2ca02c", "RB": "#d62728"}


def kind(ev):
    return "snap" if ev in SNAP else "throw"


def load_key_frames():
    """Read each tracking file and keep one frame per play for snap / throw / arrival."""
    cols = ["gameId", "playId", "nflId", "frameId", "team", "x", "y", "event"]
    parts = []
    for f in sorted(glob.glob(DATA + "tracking/*.csv")):
        t = pd.read_csv(f, usecols=cols)
        last = t.groupby(["gameId", "playId"]).frameId.transform("max")
        end = t[t.frameId == last].copy()
        end["kind"] = "end"
        k = t[t.event.isin(KEEP)].copy()
        k["kind"] = k.event.map(kind)
        # first frame of each kind in each play
        first = k.groupby(["gameId", "playId", "kind"]).frameId.transform("min")
        parts += [k[k.frameId == first], end]
    return pd.concat(parts, ignore_index=True)


def nearest_defender(frames, plays):
    """For every offensive route runner at every key frame, distance to the closest defender
    and the position of the ball."""
    fr = frames.merge(plays[["gameId", "playId", "possessionTeam", "defensiveTeam"]],
                      on=["gameId", "playId"])
    key = ["gameId", "playId", "kind"]
    ball = fr[fr.team == "football"][key + ["x", "y"]].rename(columns={"x": "bx", "y": "by"})
    off = fr[fr.team == fr.possessionTeam][key + ["nflId", "x", "y"]]
    dfn = fr[fr.team == fr.defensiveTeam][key + ["x", "y"]]
    pairs = off.merge(dfn, on=key, suffixes=("", "_d"))
    pairs["dist"] = np.hypot(pairs.x - pairs.x_d, pairs.y - pairs.y_d)
    sep = pairs.groupby(key + ["nflId"]).dist.min().rename("sep").reset_index()
    sep = sep.merge(off, on=key + ["nflId"]).merge(ball, on=key)
    sep["dist_ball"] = np.hypot(sep.x - sep.bx, sep.y - sep.by)
    return sep


def build_table():
    plays = pd.read_csv(DATA + "plays.csv")
    pff = pd.read_csv(DATA + "pffScoutingData.csv")
    players = pd.read_csv(DATA + "players.csv")[["nflId", "displayName", "officialPosition"]]
    frames = load_key_frames()
    sep = nearest_defender(frames, plays)

    wide = sep.pivot_table(index=["gameId", "playId", "nflId"], columns="kind",
                           values=["sep", "dist_ball"]).dropna(subset=[("sep", "throw"), ("dist_ball", "end")])
    wide.columns = [f"{a}_{b}" for a, b in wide.columns]
    wide = wide.reset_index()

    # route runners only, at WR / TE / RB
    routes = pff[pff.pff_role == "Pass Route"][["gameId", "playId", "nflId", "pff_positionLinedUp"]]
    df = wide.merge(routes, on=["gameId", "playId", "nflId"]).merge(players, on="nflId")
    df = df[df.officialPosition.isin(COLORS)]
    df = df.merge(plays[["gameId", "playId", "passResult", "pff_passCoverageType", "dropBackType"]],
                  on=["gameId", "playId"])
    df = df[df.pff_passCoverageType.isin(["Man", "Zone"])]
    # expected separation = average of receivers with the same alignment vs the same coverage type
    df["expected"] = df.groupby(["pff_positionLinedUp", "pff_passCoverageType"]).sep_throw.transform("mean")
    df["soe"] = df.sep_throw - df.expected

    # target = route runner closest to the ball at the end of the play (within 3 yards)
    near = df.groupby(["gameId", "playId"]).dist_ball_end.transform("min")
    df["target"] = (df.dist_ball_end == near) & (near < 3)
    return df


def leaderboard(df):
    g = df.groupby(["nflId", "displayName", "officialPosition"])
    tab = g.agg(routes=("soe", "size"), soe=("soe", "mean"), sep_throw=("sep_throw", "mean")).reset_index()
    for cov in ["Man", "Zone"]:
        sub = df[df.pff_passCoverageType == cov].groupby("nflId").agg(
            **{f"routes_{cov.lower()}": ("soe", "size"), f"soe_{cov.lower()}": ("soe", "mean")})
        tab = tab.merge(sub, on="nflId", how="left")
    return tab[tab.routes >= MIN_ROUTES].sort_values("soe", ascending=False)


def plot_validation(df):
    """Completion rate by separation at the throw (targeted receivers only)."""
    tg = df[df.target & df.passResult.isin(["C", "I", "IN"])].copy()
    tg["bin"] = pd.cut(tg.sep_throw, [0, 2, 4, 6, 8, 10, 100],
                       labels=["<2", "2-4", "4-6", "6-8", "8-10", "10+"])
    r = tg.groupby("bin", observed=True).passResult.apply(lambda s: (s == "C").mean() * 100)
    n = tg.groupby("bin", observed=True).size()
    fig, ax = plt.subplots(figsize=(7, 4.5))
    ax.bar(r.index.astype(str), r.values, color="#1f77b4")
    for i, (v, c) in enumerate(zip(r.values, n.values)):
        ax.text(i, v + 1, f"{v:.0f}%\n(n={c})", ha="center", fontsize=8)
    ax.set_xlabel("Yards between the targeted receiver and the nearest defender at the throw")
    ax.set_ylabel("Pass completed (%)")
    ax.set_title("More space at the throw = more completions")
    ax.set_ylim(0, 110)
    fig.tight_layout()
    fig.savefig(OUT + "completion_vs_space.png", dpi=150)
    plt.close(fig)
    return r, n


def plot_leaders(tab, col, title, fname, n=15):
    top = tab.dropna(subset=[col]).sort_values(col, ascending=False).head(n).iloc[::-1]
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.barh(top.displayName, top[col], color=[COLORS[p] for p in top.officialPosition])
    ax.set_xlabel("Yards of space vs. an average receiver in the same alignment and coverage")
    ax.set_title(title)
    handles = [plt.Rectangle((0, 0), 1, 1, color=c) for c in COLORS.values()]
    ax.legend(handles, COLORS.keys(), loc="lower right")
    fig.tight_layout()
    fig.savefig(OUT + fname, dpi=150)
    plt.close(fig)


def plot_man_vs_zone(tab):
    t = tab[(tab.routes_man >= 30) & (tab.routes_zone >= 30)]
    fig, ax = plt.subplots(figsize=(7, 6))
    for pos, c in COLORS.items():
        s = t[t.officialPosition == pos]
        ax.scatter(s.soe_zone, s.soe_man, color=c, label=pos, alpha=0.7)
    for _, r in pd.concat([t.nlargest(5, "soe_man"), t.nlargest(4, "soe_zone")]).drop_duplicates("nflId").iterrows():
        ax.annotate(r.displayName, (r.soe_zone, r.soe_man), fontsize=7)
    ax.axhline(0, color="grey", lw=0.5)
    ax.axvline(0, color="grey", lw=0.5)
    ax.set_xlabel("Space vs. expected against ZONE (yards)")
    ax.set_ylabel("Space vs. expected against MAN (yards)")
    ax.set_title("Who gets open against man, who against zone?")
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUT + "man_vs_zone.png", dpi=150)
    plt.close(fig)


def main():
    os.makedirs(OUT, exist_ok=True)
    df = build_table()
    df.to_csv(OUT + "route_level.csv", index=False)
    tab = leaderboard(df)
    tab.round(2).to_csv(OUT + "leaderboard.csv", index=False)
    r, n = plot_validation(df)
    plot_leaders(tab, "soe", f"Separation Over Expected (min {MIN_ROUTES} routes)", "leaders_all.png")
    tm = tab[tab.routes_man >= 30]
    plot_leaders(tm, "soe_man", "Who beats man coverage? (min 30 man routes)", "leaders_man.png")
    plot_man_vs_zone(tab)
    print("routes:", len(df), "| targets:", int(df.target.sum()), "| players ranked:", len(tab))
    print(pd.DataFrame({"completion_%": r.round(1), "n": n}))
    cols = ["displayName", "officialPosition", "routes", "soe", "soe_man", "soe_zone"]
    print(tab.head(12)[cols].round(2).to_string())
    print(tab.tail(5)[cols].round(2).to_string())
    print(tm.sort_values("soe_man", ascending=False).head(8)[cols].round(2).to_string())
    print(df.groupby("officialPosition").soe.mean().round(2))


if __name__ == "__main__":
    main()
