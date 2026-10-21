// Shape of public/data/data.json, written by the Python pipeline (pipeline/export.py).

export type Position = "WR" | "TE" | "RB"
export type Category = "missed" | "open_catch" | "tight_catch"

export interface Player {
  nflId: number
  displayName: string
  officialPosition: Position
  team: string
  routes: number
  targets: number
  catches: number
  soe: number
  sep_throw: number
  open_rate: number
  p_throw: number
  missed_open: number
  missed_rate: number
  routes_man: number | null
  soe_man: number | null
  routes_zone: number | null
  soe_zone: number | null
  soe_pct: number
}

export interface Team {
  team: string
  man_rate: number
  top_coverage: string
  plays: number
}

export interface Entity {
  side: "offense" | "defense" | "ball"
  x: number[]
  y: number[]
  id?: number
  name?: string
  role?: string
  /** catch probability per frame, null after the throw */
  p?: (number | null)[]
}

export interface Replay {
  gameId: number
  playId: number
  snapIndex: number
  throwIndex: number
  entities: Entity[]
  category: Category
  /** receiver this play is about */
  focus: number
  /** receiver who actually got the ball */
  target: number | null
  description: string
  result: string
  yards: number
  coverage: string
  offense: string
  defense: string
  down: number
  toGo: number
}

export interface AppData {
  summary: {
    routes: number
    plays: number
    targets: number
    players: number
    openThreshold: number
    missedOpen: number
  }
  model: { name: string; auc: number; samples: number; base_rate: number; features: string[] }
  validation: { bin: string; completion: number; n: number }[]
  calibration: { bin: string; predicted: number; real: number; n: number }[]
  players: Player[]
  teams: Team[]
  categories: Record<Category, string>
  replays: Replay[]
}
