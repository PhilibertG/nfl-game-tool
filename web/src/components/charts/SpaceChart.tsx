import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { AppData } from "@/types"

const percent = (v: number) => `${Math.round(v * 100)}%`
const config = { completion: { label: "Caught", color: "var(--chart-2)" } } satisfies ChartConfig

/** Catch rate of targeted passes by the space the receiver had when the ball was thrown. */
export function SpaceChart({ data }: { data: AppData }) {
  const space = data.validation.map((v) => ({ ...v, label: `${v.bin} yd` }))
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <BarChart data={space} margin={{ top: 24 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis domain={[0, 1]} tickFormatter={percent} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v, _n, item) => `${percent(Number(v))} caught (${item.payload.n} passes)`} />} />
        <Bar dataKey="completion" fill="var(--color-completion)" radius={6} isAnimationActive={false}>
          <LabelList dataKey="completion" position="top" formatter={(v) => percent(Number(v))} className="fill-foreground font-semibold" />
        </Bar>
      </BarChart>
    </ChartContainer>
    )
}
