import { memo, useMemo } from "react"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { lastName, lastValue, probColor } from "@/lib/format"
import type { Replay } from "@/types"

type Props = { play: Replay; cursor: number }

/** Catch probability of every receiver from snap to throw, with a moving cursor. */
export const Timeline = memo(function Timeline({ play, cursor }: Props) {
  const { rows, series, config } = useMemo(() => buildSeries(play), [play])

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_180px]">
      <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="i"
            type="number"
            domain={[0, rows.length - 1]}
            ticks={[play.snapIndex, play.throwIndex]}
            tickFormatter={(v) => (v === play.throwIndex ? "ball thrown" : "snap")}
            tickLine={false}
            axisLine={false}
          />
          <YAxis domain={[0, 1]} ticks={[0, 0.5, 0.8, 1]} tickFormatter={(v) => `${v * 100}%`} tickLine={false} axisLine={false} />
          <ReferenceLine y={0.8} stroke="var(--positive)" strokeDasharray="4 4" />
          <ReferenceLine x={play.throwIndex} stroke="var(--ball)" strokeWidth={2} />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              type="monotone"
              dot={false}
              isAnimationActive={false}
              stroke={s.color}
              strokeWidth={s.focus ? 3.5 : 1.8}
              strokeOpacity={s.focus ? 1 : 0.8}
              connectNulls={false}
            />
          ))}
          <ReferenceLine x={cursor} stroke="var(--foreground)" strokeWidth={1.5} />
        </LineChart>
      </ChartContainer>

      <ul className="grid content-start gap-1.5 text-sm">
        {[...series].sort((a, b) => b.final - a.final).map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: s.color }} />
              <span className={s.focus ? "font-semibold" : ""}>{s.label}</span>
            </span>
            <span className="text-muted-foreground tabular-nums">{Math.round(s.final * 100)}%</span>
          </li>
        ))}
        <li className="mt-1 text-xs text-muted-foreground">Value when the ball was thrown. Dashed line = open (80%).</li>
      </ul>
    </div>
  )
})

function buildSeries(play: Replay) {
  const receivers = play.entities.filter((e) => e.p)
  const length = play.entities[0].x.length
  const series = receivers.map((e, k) => {
    const final = lastValue(e.p!) ?? 0
    const focus = e.id === play.focus
    return { key: `r${k}`, label: lastName(e.name), final, focus, color: focus ? "var(--foreground)" : probColor(final), values: e.p! }
  })
  const rows = Array.from({ length }, (_, i) => {
    const row: Record<string, number | null> = { i }
    for (const s of series) row[s.key] = s.values[i] ?? null
    return row
  })
  const config: ChartConfig = Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }]))
  return { rows, series, config }
}
