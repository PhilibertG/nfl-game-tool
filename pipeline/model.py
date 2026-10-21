"""Completion probability model: 'if the ball were thrown to this receiver now, would it be caught?'

Trained on the throw frame of targeted receivers, then applied to every frame of every route,
which lets us see a receiver's chances evolve before the quarterback decides.
"""
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from . import config
from .features import FEATURES
from .geometry import PLAY_KEY

CANDIDATES = {
    "logistic regression": lambda: make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "gradient boosting": lambda: HistGradientBoostingClassifier(
        max_depth=3, learning_rate=0.05, max_iter=200, random_state=0),
}


def training_set(frames, plays):
    rows = frames[frames.is_throw & frames.target].merge(plays[PLAY_KEY + ["passResult"]], on=PLAY_KEY)
    rows = rows[rows.passResult.isin(config.PASS_RESULTS_ATTEMPT)]
    return rows[FEATURES], (rows.passResult == "C").astype(int)


def train(frames, plays, log=print):
    """Pick the candidate with the best cross-validated AUC and fit it on all targets."""
    X, y = training_set(frames, plays)
    scores = {name: cross_val_score(make(), X, y, cv=5, scoring="roc_auc").mean()
              for name, make in CANDIDATES.items()}
    best = max(scores, key=scores.get)
    for name, auc in scores.items():
        log(f"  model {name}: AUC {auc:.3f}")
    model = CANDIDATES[best]().fit(X, y)
    info = {"name": best, "auc": round(scores[best], 3), "samples": int(len(y)),
            "base_rate": round(float(y.mean()), 3), "features": FEATURES,
            "scores": {k: round(v, 3) for k, v in scores.items()}}
    return model, info


def predict(model, frames):
    out = frames.copy()
    out["p"] = model.predict_proba(out[FEATURES])[:, 1]
    return out
