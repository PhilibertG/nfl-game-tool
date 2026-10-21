"""Paths and constants shared by every pipeline step."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "raw_data" / "data"
TRACKING_DIR = DATA_DIR / "tracking"
WEB_DATA = ROOT / "web" / "data" / "data.json"
OUTPUT_DIR = ROOT / "outputs"

FPS = 10
FIELD_LENGTH = 120.0
FIELD_WIDTH = 53.3

SNAP_EVENTS = {"ball_snap", "autoevent_ballsnap"}
THROW_EVENTS = {"pass_forward", "autoevent_passforward"}

SKILL_POSITIONS = ("WR", "TE", "RB")
COVERAGE_TYPES = ("Man", "Zone")
PASS_RESULTS_ATTEMPT = ("C", "I", "IN")

# a receiver is "open" when the model gives him at least this completion probability
OPEN_THRESHOLD = 0.80
MIN_ROUTES = 80
MIN_ROUTES_PER_COVERAGE = 30

# frames kept around the throw for the replay viewer
REPLAY_FRAMES_AFTER_THROW = 20
REPLAY_PLAYS = 90
