"""Find the targeted receiver of each pass from the official play description.

Example: "T.Brady pass short right to C.Godwin to TB 45 for 12 yards" -> Chris Godwin.
Interceptions are written "pass deep left intended for J.Smith INTERCEPTED by ...".
Tracking stops 0.5 s after the throw, so the ball position cannot be used for this.
"""
import re

import pandas as pd

from .geometry import PLAY_KEY


def _pattern(display_name):
    first, _, last = display_name.partition(" ")
    if not last:
        return None
    # the first name can be shortened to 1-3 letters ("D.Williams", "Da.Williams")
    return re.compile(rf"(?:\bto|\bfor) {re.escape(first[0])}[a-z]{{0,2}}\.\s?{re.escape(last)}\b")


def find_targets(plays, roles, players):
    """(gameId, playId, nflId) of the route runner named as the receiver in the play text."""
    runners = roles[roles.pff_role == "Pass Route"][PLAY_KEY + ["nflId"]]
    runners = runners.merge(players[["nflId", "displayName"]], on="nflId")
    runners = runners.merge(plays[PLAY_KEY + ["playDescription"]], on=PLAY_KEY)
    patterns = {name: _pattern(name) for name in runners.displayName.unique()}
    named = [
        bool(patterns[name] and patterns[name].search(str(text)))
        for name, text in zip(runners.displayName, runners.playDescription)
    ]
    hits = runners[pd.Series(named, index=runners.index)]
    # keep plays where exactly one route runner matches
    hits = hits[hits.groupby(PLAY_KEY).nflId.transform("size") == 1]
    return hits[PLAY_KEY + ["nflId"]].assign(target=True)
