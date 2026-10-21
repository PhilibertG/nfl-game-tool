import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, XAxis, YAxis } from "recharts"

import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { yds } from "@/lib/format"
import type { Player } from "@/types"

const config = { soe: { label: "Extra space", color: "var(--chart-2)" } } satisfies ChartConfig

/** Horizontal bars: the receivers who get the most extra space, with the average receiver at 0. */
export function TopReceiversChart({ players, count = 10 }: { players: Player[]; count?: number }) {
  const top = [...players]
    .sort((a, b) => b.soe - a.soe)
    .slice(0, count)
    .map((p) => ({ ...p, label: `${p.displayName} (${p.officialPosition})` }))

  return (
    <ChartContainer config={config} className="aspect-auto h-[340px] w-full">
      <BarChart data={top} layout="vertical" margin={{ left: 8, right: 56 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" domain={[0, "dataMax"]} tickFormatter={(v) => `+${Number(v).toFixed(1)} yd`} tickLine={false} />
        <YAxis type="category" dataKey="label" width={170} tickLine={false} axisLine={false} />
        <ReferenceLine x={0} stroke="var(--foreground)" label={{ value: "average receiver", position: "insideBottomLeft", fontSize: 11 }} />
        <Bar dataKey="soe" fill="var(--color-soe)" radius={4} isAnimationActive={false}>
          <LabelList dataKey="soe" position="right" formatter={(v) => yds(Number(v))} className="fill-foreground text-xs font-semibold" />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
