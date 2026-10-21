import { useMemo, useState } from "react"

import { LookingAt } from "@/components/LookingAt"
import { PositionBadge } from "@/components/PositionBadge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { pct, signClass, yds } from "@/lib/format"
import type { AppData, Player } from "@/types"

/** Space a receiver should get against a defense = his space vs man / zone weighted by how often it plays each. */
const expectedSpace = (p: Player, manRate: number) =>
  manRate * (p.soe_man ?? p.soe) + (1 - manRate) * (p.soe_zone ?? p.soe)

function TeamSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Select items={options.map((o) => ({ value: o, label: o }))} value={value} onValueChange={(v) => onChange(String(v))}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

export function GamePlanTab({ data }: { data: AppData }) {
  const offenses = useMemo(() => [...new Set(data.players.map((p) => p.team))].sort(), [data])
  const defenses = useMemo(() => data.teams.map((t) => t.team).sort(), [data])
  const leagueMan = data.teams.reduce((s, t) => s + t.man_rate, 0) / data.teams.length
  const [offense, setOffense] = useState(offenses.includes("BAL") ? "BAL" : offenses[0])
  const [defense, setDefense] = useState(() => [...data.teams].sort((a, b) => b.man_rate - a.man_rate)[0].team)

  const d = data.teams.find((t) => t.team === defense)!
  const ours = data.players
    .filter((p) => p.team === offense)
    .map((p) => ({ ...p, expected: expectedSpace(p, d.man_rate) }))
    .sort((a, b) => b.expected - a.expected)
  const best = ours[0]
  const style =
    d.man_rate > leagueMan + 0.05 ? "plays a lot of man defense" : d.man_rate < leagueMan - 0.05 ? "plays mostly zone defense" : "mixes man and zone like an average team"

  return (
    <div className="grid gap-4">
      <LookingAt
        look="pick your team and next week's opponent, then read the recommendation on the left and the ranking on the right."
        meaning="some defenses follow receivers one-on-one (man), others guard areas (zone). Each receiver gets free more against one or the other, so the best target changes with the opponent. +0.6 yd = he should get 0.6 yard more space than an average receiver in his spot against this defense."
      />
      <div className="flex flex-wrap gap-4">
        <TeamSelect label="Your team (attack)" value={offense} options={offenses} onChange={setOffense} />
        <TeamSelect label="Next opponent (defense)" value={defense} options={defenses} onChange={setDefense} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How {d.team} defends</CardTitle>
            <CardDescription>Based on {d.plays} pass plays.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex h-8 overflow-hidden rounded-lg border text-xs font-medium">
              <div className="grid place-items-center bg-primary text-primary-foreground" style={{ width: `${d.man_rate * 100}%` }}>Man {pct(d.man_rate)}</div>
              <div className="grid place-items-center bg-muted text-foreground" style={{ width: `${(1 - d.man_rate) * 100}%` }}>Zone {pct(1 - d.man_rate)}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              {d.team} {style} (league average: {pct(leagueMan)} man). Most used scheme: {d.top_coverage}.
            </p>
            <Separator />
            {best ? (
              <p className="text-base">
                Recommendation: make <b>{best.displayName}</b> ({best.officialPosition}) the main target. Against this defense he should get{" "}
                <b className="text-positive">{yds(best.expected)}</b> more space per route than an average receiver in his spot.
              </p>
            ) : (
              <p className="text-muted-foreground">No receiver of this team has enough routes.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{offense} receivers ranked against {d.team}</CardTitle>
            <CardDescription>
              Expected extra space = his space vs man × how often they play man + his space vs zone × how often they play zone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="divide-y">
              {ours.map((p, i) => (
                <li key={p.nflId} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5">
                  <span className="font-medium text-muted-foreground">{i + 1}</span>
                  <div className="grid gap-0.5">
                    <span className="flex items-center gap-2 font-medium">
                      <PositionBadge position={p.officialPosition} />
                      {p.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      vs man {yds(p.soe_man)} · vs zone {yds(p.soe_zone)}
                    </span>
                  </div>
                  <span className={`font-semibold tabular-nums ${signClass(Number(p.expected.toFixed(1)))}`}>{yds(p.expected)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <p className="rounded-lg border bg-muted/50 p-3 text-sm">
          <b>Man defense:</b> each defender follows one receiver everywhere. Fast receivers who change direction sharply beat it.
        </p>
        <p className="rounded-lg border bg-muted/50 p-3 text-sm">
          <b>Zone defense:</b> each defender guards an area. Receivers who find the gaps between areas beat it.
        </p>
      </div>
    </div>
  )
}
