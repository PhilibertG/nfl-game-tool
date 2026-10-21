"""Coordinate helpers: field orientation and key frames of a play."""
import numpy as np
import pandas as pd

from . import config

PLAY_KEY = ["gameId", "playId"]
FRAME_KEY = ["gameId", "playId", "frameId"]


def normalize_direction(tracking):
    """Make every play go left to right, so 'downfield' always means increasing x."""
    t = tracking.copy()
    left = t.playDirection == "left"
    t.loc[left, "x"] = config.FIELD_LENGTH - t.loc[left, "x"]
    t.loc[left, "y"] = config.FIELD_WIDTH - t.loc[left, "y"]
    return t


def key_frames(tracking):
    """One row per play with the snap, throw and last frame ids. Plays without a throw are dropped."""
    def first_frame(events, name):
        rows = tracking[tracking.event.isin(events)]
        return rows.groupby(PLAY_KEY).frameId.min().rename(name)

    frames = pd.concat([
        first_frame(config.SNAP_EVENTS, "snapFrame"),
        first_frame(config.THROW_EVENTS, "throwFrame"),
        tracking.groupby(PLAY_KEY).frameId.max().rename("lastFrame"),
    ], axis=1).dropna().astype(int).reset_index()
    return frames[frames.throwFrame > frames.snapFrame]


def distance(x1, y1, x2, y2):
    return np.hypot(x1 - x2, y1 - y2)


def nearest_distance(receivers, defenders, keys):
    """Distance from each receiver row to the closest defender sharing the same keys."""
    pairs = receivers[keys + ["nflId", "x", "y"]].merge(
        defenders[keys + ["x", "y"]], on=keys, suffixes=("", "_d"))
    pairs["dist"] = distance(pairs.x, pairs.y, pairs.x_d, pairs.y_d)
    return pairs.groupby(keys + ["nflId"]).dist.min().rename("sep").reset_index()
