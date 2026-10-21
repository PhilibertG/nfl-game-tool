"""Run the full pipeline: python -m pipeline"""
import time

from . import config, export, features, loading, metrics, model, replays, targets


def main():
    start = time.time()
    log = lambda msg: print(f"[{time.time() - start:5.1f}s] {msg}", flush=True)

    log("loading tables")
    plays, roles, players = loading.load_plays(), loading.load_roles(), loading.load_players()

    log("computing per-frame features for every route")
    frames = features.build_all(plays, roles, log)

    log("finding the targeted receiver of each pass")
    target = targets.find_targets(plays, roles, players)
    frames = frames.merge(target, on=["gameId", "playId", "nflId"], how="left")
    frames["target"] = frames.target.fillna(False).astype(bool)
    log(f"  {len(target)} targeted passes identified")

    log("training the completion probability model")
    clf, model_info = model.train(frames, plays, log)
    frames = model.predict(clf, frames)

    log("building route, player and team metrics")
    routes = metrics.route_table(frames, plays, roles, players)
    players_tab = metrics.player_table(routes)
    teams = metrics.team_coverage(plays)
    validation = metrics.completion_by_space(routes)
    calibration = metrics.completion_by_probability(routes)

    log("extracting replays")
    selection = replays.select_plays(routes)
    replay_data = replays.extract(selection, frames, plays, roles, players)

    config.OUTPUT_DIR.mkdir(exist_ok=True)
    players_tab.round(3).to_csv(config.OUTPUT_DIR / "leaderboard.csv", index=False)
    payload = export.build_payload(routes, players_tab, teams, model_info, validation, calibration, replay_data)
    path = export.write(payload)
    log(f"done: {len(routes)} routes, {len(players_tab)} players, {len(replay_data)} replays -> {path}")


if __name__ == "__main__":
    main()
