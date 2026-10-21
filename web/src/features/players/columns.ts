import { yds } from "@/lib/format"
import type { Player } from "@/types"

export type Column = {
  key: keyof Player
  label: string
  tip?: string
  format?: (v: number | null) => string
  signed?: boolean
}

/** Table columns, with the plain-language explanation shown on hover. */
export const COLUMNS: Column[] = [
  { key: "displayName", label: "Player" },
  { key: "team", label: "Team" },
  { key: "routes", label: "Routes", tip: "Number of pass plays where he ran a path to receive the ball.", format: (v) => String(v) },
  {
    key: "soe",
    label: "Extra space",
    tip: "Average space between him and the closest defender when the ball is thrown, compared with other players starting from the same spot. Higher = gets open more.",
    format: (v) => yds(v),
    signed: true,
  },
  { key: "soe_man", label: "vs man", tip: "Extra space when each defender follows one receiver.", format: (v) => yds(v), signed: true },
  { key: "soe_zone", label: "vs zone", tip: "Extra space when each defender guards an area.", format: (v) => yds(v), signed: true },
  {
    key: "missed_open",
    label: "Ignored while open",
    tip: "Plays where he was the most open player on the field, but the ball went to someone else.",
    format: (v) => String(v),
  },
]

export const OPEN_RATE_TIP =
  "Share of his routes where he had at least 80% chance of a catch at the moment the ball was thrown."

export const column = (key: keyof Player): Column | undefined => COLUMNS.find((c) => c.key === key)
