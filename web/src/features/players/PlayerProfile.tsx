import { ArrowLeftRight, Play } from "lucide-react"

import { PositionBadge } from "@/components/PositionBadge"
import { Term } from "@/components/Term"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { pct, percentile, signClass, topShare, yds } from "@/lib/format"
import type { Player } from "@/types"
import { column, OPEN_RATE_TIP } from "./columns"

function verdicts(p: Player) {
  const man = p.soe_man ?? 0
  const zone = p.soe_zone ?? 0
  const out: string[] = []
  if (p.soe_pct >= 0.8) out.push(`One of the best at getting free: ${topShare(p.soe_pct)} of all receivers for space.`)
  else if (p.soe_pct <= 0.2) out.push("Usually tightly covered: wins by catching in traffic rather than with space.")
  if (man - zone > 0.5) out.push(`Beats man defense: ${yds(man - zone)} more space against it than against zone. Feature him when the opponent plays man.`)
  else if (zone - man > 0.5) out.push(`Finds holes in zone defense: ${yds(zone - man)} more space against it than against man. Feature him against zone-heavy opponents.`)
  else out.push("Gets about the same space against both defenses: a reliable option whatever the opponent does.")
  if (p.missed_rate > 0.05) out.push(`Was open and ignored on ${pct(p.missed_rate, 1)} of his routes (${p.missed_open} plays): the quarterback could use him more.`)
  return out
}

type Props = { player: Player; all: Player[]; hasPlays: boolean; onWatch: () => void; onCompare?: () => void }

export function PlayerProfile({ player: p, all, hasPlays, onWatch, onCompare }: Props) {
  const stat = (key: keyof Player, label: string, format: (v: number | null) => string, signed = true) => {
    const value = p[key] as number | null
    const share = percentile(all.map((x) => x[key] as number | null), value)
    return (
      <div className="grid gap-1.5">
        <div className="flex justify-between text-sm">
          <Term tip={column(key)?.tip ?? OPEN_RATE_TIP}>{label}</Term>
          <b className={signed ? signClass(value) : ""}>{format(value)}</b>
        </div>
        <Progress value={Math.round(share * 100)} />
        <span className="text-xs text-muted-foreground">
          Better than {Math.round(share * (all.length - 1))} of the {all.length} receivers ({topShare(share)})
        </span>
      </div>
    )
  }
  const catchRate = p.targets ? p.catches / p.targets : null

  return (
    <Card className="lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PositionBadge position={p.officialPosition} />
          {p.displayName}
        </CardTitle>
        <CardDescription>
          {p.team} · {p.routes} routes · {p.targets} balls thrown to him · {pct(catchRate)} caught
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {stat("soe", "Extra space", (v) => yds(v))}
        {stat("soe_man", "vs man defense", (v) => yds(v))}
        {stat("soe_zone", "vs zone defense", (v) => yds(v))}
        {stat("open_rate", "Open when thrown", (v) => pct(v), false)}
        <Separator />
        <div className="grid gap-2">
          <h4 className="text-sm font-semibold">In plain words</h4>
          {verdicts(p).map((t) => (
            <p key={t} className="rounded-lg border bg-muted/50 p-3 text-sm">
              {t}
            </p>
          ))}
        </div>
        {hasPlays && (
          <Button onClick={onWatch} className="w-full">
            <Play /> Watch his plays
          </Button>
        )}
        {onCompare && (
          <Button variant="outline" onClick={onCompare} className="w-full">
            <ArrowLeftRight /> Compare with another receiver
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
