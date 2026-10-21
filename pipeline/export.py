"""Write everything the web app needs into a single JSON file."""
import json

import numpy as np
import pandas as pd

from . import config
from .replays import CATEGORIES


def _records(df, digits=3):
    clean = df.replace({np.nan: None})
    return [{k: (round(v, digits) if isinstance(v, float) else v) for k, v in row.items()}
            for row in clean.to_dict("records")]


def build_payload(routes, players, teams, model_info, validation, calibration, replays):
    return {
        "summary": {
            "routes": int(len(routes)),
            "plays": int(routes[["gameId", "playId"]].drop_duplicates().shape[0]),
            "targets": int(routes.target.sum()),
            "players": int(len(players)),
            "openThreshold": config.OPEN_THRESHOLD,
            "missedOpen": int(routes.missed_open.sum()),
        },
        "model": model_info,
        "validation": _records(validation.astype({"bin": str})),
        "calibration": _records(calibration.astype({"bin": str})),
        "players": _records(players),
        "teams": _records(teams),
        "categories": CATEGORIES,
        "replays": replays,
    }


def write(payload, path=config.WEB_DATA):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":"), default=_default))
    return path


def _default(value):
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    raise TypeError(type(value))
