"""Read the raw csv files of the dataset."""
import pandas as pd

from . import config

PLAY_COLUMNS = [
    "gameId", "playId", "playDescription", "quarter", "down", "yardsToGo",
    "possessionTeam", "defensiveTeam", "passResult", "playResult",
    "pff_passCoverage", "pff_passCoverageType",
]
TRACKING_COLUMNS = ["gameId", "playId", "nflId", "frameId", "team", "playDirection", "x", "y", "s", "event"]


def load_plays():
    return pd.read_csv(config.DATA_DIR / "plays.csv", usecols=PLAY_COLUMNS)


def load_players():
    cols = ["nflId", "displayName", "officialPosition"]
    return pd.read_csv(config.DATA_DIR / "players.csv", usecols=cols)


def load_roles():
    cols = ["gameId", "playId", "nflId", "pff_role", "pff_positionLinedUp"]
    return pd.read_csv(config.DATA_DIR / "pffScoutingData.csv", usecols=cols)


def load_games():
    return pd.read_csv(config.DATA_DIR / "games.csv")


def tracking_files():
    return sorted(config.TRACKING_DIR.glob("tracking_*.csv"))


def load_tracking(path):
    return pd.read_csv(path, usecols=TRACKING_COLUMNS)
