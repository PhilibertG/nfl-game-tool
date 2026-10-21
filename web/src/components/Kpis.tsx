import { Card, CardContent } from "@/components/ui/card"
import type { AppData } from "@/types"

/** Four headline numbers, each with a plain-language hint. */
export function Kpis({ data }: { data: AppData }) {
  const s = data.summary
  const covered = data.validation[0]
  const free = data.validation[data.validation.length - 2]
  const items = [
    ["routes analysed", s.routes.toLocaleString("en"), "paths run by receivers on pass plays"],
    ["receivers ranked", String(s.players), "players with at least 80 routes"],
    ["free receivers ignored", s.missedOpen.toLocaleString("en"), "best option on the field, ball thrown elsewhere"],
    ["catch rate: free vs covered", `${Math.round(free.completion * 100)}% vs ${Math.round(covered.completion * 100)}%`, `${free.bin} yards of space vs under 2 yards`],
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(([label, value, hint]) => (
        <Card key={label} size="sm">
          <CardContent className="grid gap-0.5">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-2xl font-semibold tracking-tight">{value}</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
