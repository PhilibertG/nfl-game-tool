"""Per-frame features of every route runner, from the snap to the throw."""
import numpy as np
import pandas as pd

from . import config, geometry, loading
from .geometry import FRAME_KEY, PLAY_KEY

FEATURES = ["sep", "closing", "speed", "depth", "dist_qb", "sideline", "t_since_snap"]
CLOSING_LAG = 3  # frames used to measure how fast the defender closes the gap


def _tag_players(tracking, plays, roles):
    t = tracking.merge(plays[PLAY_KEY + ["possessionTeam", "defensiveTeam"]], on=PLAY_KEY)
    t = t.merge(roles[PLAY_KEY + ["nflId", "pff_role"]], on=PLAY_KEY + ["nflId"], how="left")
    t["is_route"] = t.pff_role == "Pass Route"
    t["is_qb"] = t.pff_role == "Pass"
    t["is_defense"] = t.team == t.defensiveTeam
    t["is_ball"] = t.team == "football"
    return t


def _line_of_scrimmage(t, frames):
    snap = t[t.is_ball].merge(frames, on=PLAY_KEY)
    snap = snap[snap.frameId == snap.snapFrame]
    return snap[PLAY_KEY + ["x"]].rename(columns={"x": "los"})


def game_features(tracking, plays, roles):
    """Receiver x frame table for one game file."""
    t = _tag_players(geometry.normalize_direction(tracking), plays, roles)
    frames = geometry.key_frames(t)
    window = t.merge(frames, on=PLAY_KEY)
    window = window[(window.frameId >= window.snapFrame) & (window.frameId <= window.throwFrame)]

    receivers = window[window.is_route]
    sep = geometry.nearest_distance(receivers, window[window.is_defense], FRAME_KEY)
    qb = window[window.is_qb][FRAME_KEY + ["x", "y"]].rename(columns={"x": "qx", "y": "qy"})

    df = receivers[FRAME_KEY + ["nflId", "x", "y", "s", "snapFrame", "throwFrame"]]
    df = df.merge(sep, on=FRAME_KEY + ["nflId"]).merge(qb, on=FRAME_KEY)
    df = df.merge(_line_of_scrimmage(t, frames), on=PLAY_KEY)
    df = df.sort_values(PLAY_KEY + ["nflId", "frameId"])

    df["speed"] = df.s
    df["depth"] = df.x - df.los
    df["dist_qb"] = geometry.distance(df.x, df.y, df.qx, df.qy)
    df["sideline"] = np.minimum(df.y, config.FIELD_WIDTH - df.y)
    df["t_since_snap"] = (df.frameId - df.snapFrame) / config.FPS
    gap_change = df.groupby(PLAY_KEY + ["nflId"]).sep.diff(CLOSING_LAG)
    df["closing"] = (gap_change * config.FPS / CLOSING_LAG).fillna(0.0)
    df["is_throw"] = df.frameId == df.throwFrame
    return df[FRAME_KEY + ["nflId", "is_throw"] + FEATURES]


def build_all(plays, roles, log=print):
    parts = []
    files = loading.tracking_files()
    for i, path in enumerate(files, 1):
        parts.append(game_features(loading.load_tracking(path), plays, roles))
        if i % 20 == 0 or i == len(files):
            log(f"  features: {i}/{len(files)} games")
    return pd.concat(parts, ignore_index=True)
