import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { expectedSpace } from "@/lib/plan"
import { lastName, pct, yds } from "@/lib/format"
import type { Player, Team } from "@/types"
import { crossover } from "./duel"

type Props = { a: Player; b: Player; teams: Team[]; leagueMan: number }

const STEPS = 20

/** Expected extra space of both receivers as the opponent plays more and more man defense. */
export function MatchupChart({ a, b, teams, leagueMan }: Props) {
  const rows = useMemo(
    () =>
      Array.from({ length: STEPS + 1 }, (_, i) => {
        const m = i / STEPS
        return { m, a: expectedSpace(a, m), b: expectedSpace(b, m) }
      }),
    [a, b],
  )
  const config = {
    a: { label: lastName(a.displayName), color: "var(--compare-a)" },
    b: { label: lastName(b.displayName), color: "var(--compare-b)" },
  } satisfies ChartConfig
  const cross = crossover(a, b)
  const rates = teams.map((t) => t.man_rate)

  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      <LineChart data={rows} margin={{ top: 20, right: 16, bottom: 4, left: -4 }}>
        <CartesianGrid vertical={false} />
        <ReferenceArea
          x1={Math.min(...rates)}
          x2={Math.max(...rates)}
          fill="var(--muted-foreground)"
          fillOpacity={0.08}
        />
        <XAxis
          dataKey="m"
          type="number"
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(v) => (v === 0 ? "all zone" : v === 1 ? "all man" : `${pct(Number(v))} man`)}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tickFormatter={(v) => yds(Number(v))} tickLine={false} axisLine={false} width={64} />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" />
        <ReferenceLine
          x={leagueMan}
          stroke="var(--foreground)"
          strokeDasharray="4 4"
          label={{ value: "league avg", position: "top", fontSize: 11, fill: "var(--foreground)" }}
        />
        {cross != null && <ReferenceLine x={cross} stroke="var(--muted-foreground)" strokeWidth={2} />}
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => `Opponent plays man ${pct(Number(payload?.[0]?.payload?.m))} of the time`}
              formatter={(v, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ background: `var(--color-${name})` }} />
                    {config[name as "a" | "b"].label}
                  </span>
                  <b className="tabular-nums">{yds(Number(v))}</b>
                </span>
              )}
            />
          }
        />
        <Line dataKey="a" type="linear" stroke="var(--color-a)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line dataKey="b" type="linear" stroke="var(--color-b)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  )
}
