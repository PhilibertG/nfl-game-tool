import { useMemo } from "react"
import { CartesianGrid, LabelList, ReferenceArea, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { lastName, yds } from "@/lib/format"
import type { Player } from "@/types"

type Dot = { id: number; x: number; y: number; name: string; team: string; short: string }

const config = {
  others: { label: "Other receivers", color: "var(--muted-foreground)" },
  a: { label: "Player A", color: "var(--compare-a)" },
  b: { label: "Player B", color: "var(--compare-b)" },
} satisfies ChartConfig

const dot = (p: Player): Dot => ({
  id: p.nflId,
  x: p.soe_zone ?? p.soe,
  y: p.soe_man ?? p.soe,
  name: p.displayName,
  team: p.team,
  short: lastName(p.displayName),
})

const quadrant = (value: string, position: "insideTopRight" | "insideTopLeft" | "insideBottomRight" | "insideBottomLeft") => ({
  value,
  position,
  fontSize: 11,
  fill: "var(--muted-foreground)",
})

type Props = { a: Player; b: Player; all: Player[]; onPick: (id: number) => void }

/** Every receiver placed by his space vs zone (horizontal) and vs man (vertical); the two compared players stand out. */
export function ManZoneChart({ a, b, all, onPick }: Props) {
  const others = useMemo(() => all.filter((p) => p.nflId !== a.nflId && p.nflId !== b.nflId).map(dot), [all, a, b])
  const max = useMemo(() => Math.ceil(Math.max(...all.flatMap((p) => [Math.abs(p.soe_man ?? 0), Math.abs(p.soe_zone ?? 0)]))), [all])
  const ticks = Array.from({ length: 2 * max + 1 }, (_, i) => i - max)

  return (
    <ChartContainer config={config} className="aspect-square max-h-[420px] w-full">
      <ScatterChart margin={{ top: 12, right: 12, bottom: 4, left: -12 }}>
        <CartesianGrid />
        <ReferenceArea x1={0} x2={max} y1={0} y2={max} fill="transparent" label={quadrant("Beats both", "insideTopRight")} />
        <ReferenceArea x1={-max} x2={0} y1={0} y2={max} fill="transparent" label={quadrant("Beats man", "insideTopLeft")} />
        <ReferenceArea x1={0} x2={max} y1={-max} y2={0} fill="transparent" label={quadrant("Beats zone", "insideBottomRight")} />
        <ReferenceArea x1={-max} x2={0} y1={-max} y2={0} fill="transparent" label={quadrant("Covered by both", "insideBottomLeft")} />
        <XAxis type="number" dataKey="x" domain={[-max, max]} ticks={ticks} tickFormatter={(v) => yds(Number(v), 0)} tickLine={false} name="vs zone" />
        <YAxis type="number" dataKey="y" domain={[-max, max]} ticks={ticks} tickFormatter={(v) => yds(Number(v), 0)} tickLine={false} width={56} name="vs man" />
        <ReferenceLine x={0} stroke="var(--muted-foreground)" />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" />
        <ReferenceLine segment={[{ x: -max, y: -max }, { x: max, y: max }]} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
        <ChartTooltip
          cursor={false}
          content={({ active, payload }) => {
            const d = active ? (payload?.[0]?.payload as Dot | undefined) : undefined
            if (!d) return null
            return (
              <div className="grid gap-0.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                <b>
                  {d.name} · {d.team}
                </b>
                <span className="text-muted-foreground">
                  vs man {yds(d.y)} · vs zone {yds(d.x)}
                </span>
              </div>
            )
          }}
        />
        <Scatter
          name="others"
          data={others}
          fill="var(--color-others)"
          fillOpacity={0.35}
          isAnimationActive={false}
          className="cursor-pointer"
          onClick={(point) => {
            const d = (point as { payload?: Dot }).payload
            if (d) onPick(d.id)
          }}
        />
        {(["a", "b"] as const).map((key) => (
          <Scatter
            key={key}
            name={key}
            data={[dot(key === "a" ? a : b)]}
            fill={`var(--color-${key})`}
            stroke="var(--background)"
            strokeWidth={2}
            shape={(props: { cx?: number; cy?: number; fill?: string; stroke?: string }) => (
              <circle cx={props.cx} cy={props.cy} r={8} fill={props.fill} stroke={props.stroke} strokeWidth={2} />
            )}
            isAnimationActive={false}
          >
            <LabelList dataKey="short" position="top" offset={12} className="fill-foreground text-xs font-semibold" />
          </Scatter>
        ))}
      </ScatterChart>
    </ChartContainer>
  )
}
