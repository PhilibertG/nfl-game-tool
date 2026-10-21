import type { ReactNode } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { pct } from "@/lib/format"
import type { AppData } from "@/types"

const percent = (v: number) => `${Math.round(v * 100)}%`

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">{children}</CardContent>
    </Card>
  )
}

const spaceConfig = { completion: { label: "Caught", color: "var(--chart-2)" } } satisfies ChartConfig
const calibrationConfig = { real: { label: "Real catch rate", color: "var(--chart-1)" } } satisfies ChartConfig

export function HowItWorksTab({ data }: { data: AppData }) {
  const m = data.model
  const space = data.validation.map((v) => ({ ...v, label: `${v.bin} yd` }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="1. Space really matters" description="Share of passes caught, depending on the distance between the receiver and the closest defender when the ball was thrown.">
        <ChartContainer config={spaceConfig} className="aspect-auto h-[260px] w-full">
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
      </Section>

      <Section title="2. The model's predictions are honest" description="When the model says “70%”, about 70% of those passes are really caught: dots close to the dashed line mean the predictions can be trusted.">
        <ChartContainer config={calibrationConfig} className="aspect-auto h-[260px] w-full">
          <ScatterChart margin={{ top: 12, right: 12 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="predicted" domain={[0.2, 1]} tickFormatter={percent} name="Predicted" tickLine={false} />
            <YAxis type="number" dataKey="real" domain={[0.2, 1]} tickFormatter={percent} name="Real" tickLine={false} width={40} />
            <ZAxis type="number" dataKey="n" range={[60, 600]} />
            <ReferenceLine segment={[{ x: 0.2, y: 0.2 }, { x: 1, y: 1 }]} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            <Scatter data={data.calibration} fill="var(--color-real)" fillOpacity={0.8} isAnimationActive={false} />
          </ScatterChart>
        </ChartContainer>
        <p className="text-center text-xs text-muted-foreground">horizontal: predicted chance · vertical: real catch rate · dot size: number of passes</p>
      </Section>

      <Section title="3. What we compute" description="From the position and speed of the 22 players, 10 times per second.">
        <p>
          <b>Chance of a catch:</b> a {m.name} model trained on {m.samples.toLocaleString("en")} real throws. It looks at the distance to the closest
          defender, how fast that defender is closing in, the receiver's speed, how far down the field he is, his distance to the quarterback and to the
          sideline. Quality score (AUC) {m.auc}: clearly better than chance (0.5), far from perfect (1.0).
        </p>
        <p>
          <b>Extra space:</b> a receiver's space when the ball is thrown, minus the average space of players starting from the same spot against the
          same type of defense. This makes players in different roles comparable.
        </p>
        <p>
          <b>Ignored while open:</b> the receiver had the best chance on the field (at least {pct(data.summary.openThreshold)}) and the ball went to
          someone else.
        </p>
      </Section>

      <Section title="4. Limits" description="What this analysis cannot see.">
        <p>
          Only 8 weeks of the 2021 season. The tracking does not say who the ball was meant for: we read the receiver's name in the official play text
          (found for {data.summary.targets.toLocaleString("en")} passes to WR, TE and RB).
        </p>
        <p>
          The model does not know if the quarterback is under pressure or how accurate the throw is. Probabilities before the throw are an estimate from
          a model trained at the throw.
        </p>
        <p>
          Running backs often catch short safety passes with lots of space, which is why they are only compared with other players starting behind the
          quarterback.
        </p>
      </Section>
    </div>
  )
}
