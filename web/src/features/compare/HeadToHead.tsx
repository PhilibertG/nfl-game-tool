import { Term } from "@/components/Term"
import { pct, percentile, topShare, yds } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Player } from "@/types"
import { catchRate, SMALL_SAMPLE } from "./duel"

type Metric = {
  label: string
  tip: string
  get: (p: Player) => number | null
  format: (v: number | null) => string
  /** routes behind the number, shown when the sample is small */
  sample?: (p: Player) => number | null
  /** false = no winner (a higher value is neither good nor bad for the receiver) */
  compare?: boolean
}

const METRICS: Metric[] = [
  {
    label: "Extra space",
    tip: "Average space between him and the closest defender when the ball is thrown, compared with other players starting from the same spot. Higher = gets open more.",
    get: (p) => p.soe,
    format: (v) => yds(v),
  },
  {
    label: "vs man defense",
    tip: "Extra space when each defender follows one receiver.",
    get: (p) => p.soe_man,
    format: (v) => yds(v),
    sample: (p) => p.routes_man,
  },
  {
    label: "vs zone defense",
    tip: "Extra space when each defender guards an area.",
    get: (p) => p.soe_zone,
    format: (v) => yds(v),
    sample: (p) => p.routes_zone,
  },
  {
    label: "Open when thrown",
    tip: "Share of his routes where he had at least 80% chance of a catch at the moment the ball was thrown.",
    get: (p) => p.open_rate,
    format: (v) => pct(v),
  },
  {
    label: "Chance of a catch at the throw",
    tip: "His average chance of catching the ball, if it had been thrown to him, at the moment the quarterback threw (to him or to someone else).",
    get: (p) => p.p_throw,
    format: (v) => pct(v),
  },
  {
    label: "Balls caught",
    tip: "Share of the balls thrown to him that he caught.",
    get: catchRate,
    format: (v) => pct(v),
  },
  {
    label: "Ignored while open",
    tip: "Share of his routes where he was the most open player on the field but the ball went elsewhere. It says more about his quarterback than about him, so there is no winner here.",
    get: (p) => p.missed_rate,
    format: (v) => pct(v, 1),
    compare: false,
  },
]

type Props = { a: Player; b: Player; all: Player[] }

/** Mirrored rows: player A on the left, player B on the right, bars = rank among all receivers. */
export function HeadToHead({ a, b, all }: Props) {
  return (
    <div className="grid gap-4">
      {METRICS.map((m) => {
        const values = all.map(m.get)
        const [va, vb] = [m.get(a), m.get(b)]
        const tie = m.format(va) === m.format(vb) || va == null || vb == null
        const winner = m.compare === false || tie ? null : va! > vb! ? "a" : "b"
        const side = (p: Player, v: number | null, key: "a" | "b") => {
          const share = percentile(values, v)
          const routes = m.sample?.(p)
          return (
            <div className={cn("grid gap-1", key === "a" ? "justify-items-end text-right" : "justify-items-start")}>
              <span className={cn("tabular-nums", winner === key ? "text-base font-semibold" : "text-muted-foreground")}>
                {m.format(v)}
                {routes != null && routes < SMALL_SAMPLE && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground" title="Small sample: read with care">
                    ({routes} routes)
                  </span>
                )}
              </span>
              <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-muted", key === "a" && "justify-end")}>
                <div
                  className={cn("h-full rounded-full", key === "a" ? "bg-compare-a" : "bg-compare-b")}
                  style={{ width: `${Math.round(share * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{m.compare === false ? `higher than ${Math.round(share * 100)}% of receivers` : topShare(share)}</span>
            </div>
          )
        }
        return (
          <div key={m.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
            {side(a, va, "a")}
            <span className="w-28 text-center text-sm font-medium sm:w-40">
              <Term tip={m.tip}>{m.label}</Term>
            </span>
            {side(b, vb, "b")}
          </div>
        )
      })}
      <p className="text-center text-xs text-muted-foreground">
        Bars: rank among the {all.length} receivers (a full bar = the best). The better value of each row is in bold.
      </p>
    </div>
  )
}
