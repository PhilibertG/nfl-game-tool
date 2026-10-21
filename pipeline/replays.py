"""Pick interesting plays and extract their full tracking so the web app can replay them."""
import pandas as pd

from . import config, geometry, loading
from .geometry import PLAY_KEY

CATEGORIES = {
    "missed": "Open receiver ignored",
    "open_catch": "Wide-open catch",
    "tight_catch": "Tight-window catch",
}


def select_plays(routes):
    """Return (gameId, playId, category) for a balanced set of showcase plays."""
    n = config.REPLAY_PLAYS // len(CATEGORIES)
    caught = routes[routes.target & (routes.passResult == "C")]
    picks = {
        "missed": routes[routes.missed_open].nlargest(n, "missed_gap"),
        "open_catch": caught.nlargest(n, "p_throw"),
        "tight_catch": caught.nsmallest(n, "p_throw"),
    }
    rows = [df[PLAY_KEY].assign(category=cat, focus=df.nflId) for cat, df in picks.items()]
    return pd.concat(rows).drop_duplicates(PLAY_KEY)


def _round(values, digits=2):
    return [round(float(v), digits) for v in values]


def _play_payload(t, play, frames, probs, names, meta):
    first = max(play.snapFrame - 5, t.frameId.min())
    last = min(play.lastFrame, play.throwFrame + config.REPLAY_FRAMES_AFTER_THROW)
    t = t[(t.frameId >= first) & (t.frameId <= last)].sort_values("frameId")
    frame_ids = sorted(t.frameId.unique())

    entities = []
    for nfl_id, rows in t.groupby("nflId", dropna=False, sort=False):
        side = "ball" if rows.team.iat[0] == "football" else (
            "offense" if rows.team.iat[0] == meta.possessionTeam else "defense")
        rows = rows.set_index("frameId").reindex(frame_ids).ffill().bfill()
        entity = {"side": side, "x": _round(rows.x, 1), "y": _round(rows.y, 1)}
        if side != "ball":
            entity.update(id=int(nfl_id), name=names.get(int(nfl_id), ""), role=rows.pff_role.iat[0] or "")
        p = probs.get(int(nfl_id)) if side == "offense" else None
        if p is not None:
            entity["p"] = [round(float(p[f]), 3) if f in p.index else None for f in frame_ids]
        entities.append(entity)

    return {
        "gameId": int(play.gameId), "playId": int(play.playId),
        "snapIndex": frame_ids.index(play.snapFrame), "throwIndex": frame_ids.index(play.throwFrame),
        "entities": entities,
    }


def extract(selection, frames, plays, roles, players):
    """Second pass over the tracking files, only for the selected games."""
    names = dict(zip(players.nflId, players.displayName))
    meta = plays.set_index(PLAY_KEY)
    wanted = selection.set_index(PLAY_KEY)
    probs = frames.merge(selection[PLAY_KEY], on=PLAY_KEY)
    out = []
    for game_id in selection.gameId.unique():
        path = config.TRACKING_DIR / f"tracking_{game_id}.csv"
        t = geometry.normalize_direction(loading.load_tracking(path))
        t = t.merge(selection[PLAY_KEY], on=PLAY_KEY)
        t = t.merge(roles[PLAY_KEY + ["nflId", "pff_role"]], on=PLAY_KEY + ["nflId"], how="left")
        for play in geometry.key_frames(t).itertuples():
            key = (play.gameId, play.playId)
            pt = t[(t.gameId == play.gameId) & (t.playId == play.playId)]
            pp = probs[(probs.gameId == play.gameId) & (probs.playId == play.playId)]
            p_by_player = {int(i): g.set_index("frameId").p for i, g in pp.groupby("nflId")}
            payload = _play_payload(pt, play, frames, p_by_player, names, meta.loc[key])
            pick = wanted.loc[key]
            info = meta.loc[key]
            payload.update(category=pick.category, focus=int(pick.focus),
                           description=info.playDescription, result=info.passResult,
                           yards=int(info.playResult), coverage=str(info.pff_passCoverage),
                           offense=info.possessionTeam, defense=info.defensiveTeam,
                           down=int(info.down), toGo=int(info.yardsToGo))
            out.append(payload)
    return out
