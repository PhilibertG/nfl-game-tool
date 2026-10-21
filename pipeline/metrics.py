"""Route, player and team level metrics built on top of the per-frame probabilities."""
import pandas as pd

from . import config
from .geometry import PLAY_KEY

ROUTE_KEY = PLAY_KEY + ["nflId"]


def route_table(frames, plays, roles, players):
    """One row per route: space and probability at the throw, missed opportunity."""
    g = frames.groupby(ROUTE_KEY)
    routes = pd.concat([g.target.first(), g.p.max().rename("p_max")], axis=1).reset_index()

    at_throw = frames[frames.is_throw][ROUTE_KEY + ["sep", "p", "depth"]].rename(
        columns={"sep": "sep_throw", "p": "p_throw", "depth": "depth_throw"})
    routes = routes.merge(at_throw, on=ROUTE_KEY)

    routes = routes.merge(roles[ROUTE_KEY + ["pff_positionLinedUp"]], on=ROUTE_KEY)
    routes = routes.merge(players, on="nflId")
    routes = routes[routes.officialPosition.isin(config.SKILL_POSITIONS)]
    routes = routes.merge(plays, on=PLAY_KEY)
    routes = routes[routes.pff_passCoverageType.isin(config.COVERAGE_TYPES)]

    # Separation Over Expected: compared with receivers in the same alignment against the same coverage
    expected = routes.groupby(["pff_positionLinedUp", "pff_passCoverageType"]).sep_throw.transform("mean")
    routes["soe"] = routes.sep_throw - expected
    routes["open_at_throw"] = routes.p_throw >= config.OPEN_THRESHOLD

    # missed opportunity: the most open receiver at the throw, open, but the ball went to someone else
    best_p = routes.groupby(PLAY_KEY).p_throw.transform("max")
    play_has_target = routes.groupby(PLAY_KEY).target.transform("any")
    target_p = routes.p_throw.where(routes.target).groupby([routes.gameId, routes.playId]).transform("max")
    routes["missed_open"] = ((routes.p_throw == best_p) & ~routes.target & play_has_target
                             & (routes.p_throw >= config.OPEN_THRESHOLD))
    routes["missed_gap"] = (routes.p_throw - target_p).where(routes.missed_open)
    return routes


def _coverage_split(routes, coverage):
    sub = routes[routes.pff_passCoverageType == coverage].groupby("nflId")
    suffix = coverage.lower()
    return pd.DataFrame({f"routes_{suffix}": sub.size(), f"soe_{suffix}": sub.soe.mean()})


def player_table(routes):
    g = routes.groupby(["nflId", "displayName", "officialPosition"])
    tab = pd.DataFrame({
        "team": g.possessionTeam.agg(lambda s: s.mode().iat[0]),
        "routes": g.size(),
        "targets": g.target.sum(),
        "catches": g.apply(lambda d: (d.target & (d.passResult == "C")).sum(), include_groups=False),
        "soe": g.soe.mean(),
        "sep_throw": g.sep_throw.mean(),
        "open_rate": g.open_at_throw.mean(),
        "p_throw": g.p_throw.mean(),
        "missed_open": g.missed_open.sum(),
    }).reset_index()
    for coverage in config.COVERAGE_TYPES:
        tab = tab.merge(_coverage_split(routes, coverage), on="nflId", how="left")
    tab["missed_rate"] = tab.missed_open / tab.routes
    tab = tab[tab.routes >= config.MIN_ROUTES]
    tab["soe_pct"] = tab.soe.rank(pct=True)
    return tab.sort_values("soe", ascending=False)


def team_coverage(plays):
    """Share of man coverage each defense plays: the input of the game-plan tool."""
    p = plays[plays.pff_passCoverageType.isin(config.COVERAGE_TYPES)]
    g = p.groupby("defensiveTeam")
    return pd.DataFrame({
        "man_rate": g.pff_passCoverageType.apply(lambda s: (s == "Man").mean()),
        "top_coverage": g.pff_passCoverage.agg(lambda s: s.mode().iat[0]),
        "plays": g.size(),
    }).reset_index().rename(columns={"defensiveTeam": "team"})


def completion_by_space(routes):
    """Validation: completion rate of targeted passes by space at the throw."""
    t = routes[routes.target & routes.passResult.isin(config.PASS_RESULTS_ATTEMPT)].copy()
    t["bin"] = pd.cut(t.sep_throw, [0, 2, 4, 6, 8, 100], labels=["<2", "2-4", "4-6", "6-8", "8+"])
    g = t.groupby("bin", observed=True)
    return pd.DataFrame({"completion": g.passResult.apply(lambda s: (s == "C").mean()),
                         "n": g.size()}).reset_index()


def completion_by_probability(routes):
    """Calibration: predicted probability vs real completion rate of targeted passes."""
    t = routes[routes.target & routes.passResult.isin(config.PASS_RESULTS_ATTEMPT)].copy()
    t["bin"] = pd.cut(t.p_throw, [0, .5, .6, .7, .8, .9, 1], labels=["<50%", "50-60%", "60-70%", "70-80%", "80-90%", "90%+"])
    g = t.groupby("bin", observed=True)
    return pd.DataFrame({"predicted": g.p_throw.mean(), "real": g.passResult.apply(lambda s: (s == "C").mean()),
                         "n": g.size()}).reset_index()
