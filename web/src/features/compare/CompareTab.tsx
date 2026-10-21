import { useMemo, useState } from "react"
import { ArrowLeftRight } from "lucide-react"

import { LookingAt } from "@/components/LookingAt"
import { PositionBadge } from "@/components/PositionBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { pct } from "@/lib/format"
import { leagueManRate } from "@/lib/plan"
import { cn } from "@/lib/utils"
import type { AppData, Player, Team } from "@/types"
import { HeadToHead } from "./HeadToHead"
import { catchRate, crossover, splitDefenses, verdicts } from "./duel"
import { ManZoneChart } from "./ManZoneChart"
import { MatchupChart } from "./MatchupChart"

type Side = "a" | "b"
type Props = { data: AppData; /** player opened from the Players tab, compared with the best at his position */ first: number | null }

const SWATCH: Record<Side, string> = { a: "bg-compare-a", b: "bg-compare-b" }

/**
 * Default duel: Mark Andrews (big man / zone gap) vs the receiver whose lines cross closest to the league average, so the
 * choice really depends on the opponent. Opened from a profile: that player vs the best at his position.
 */
function defaultPair(players: Player[], first: number | null, leagueMan: number): [number, number] {
  const bySpace = [...players].sort((x, y) => y.soe - x.soe)
  const others = (a: Player) => bySpace.filter((p) => p.nflId !== a.nflId)
  if (first != null) {
    const a = players.find((p) => p.nflId === first) ?? bySpace[0]
    return [a.nflId, (others(a).find((p) => p.officialPosition === a.officialPosition) ?? others(a)[0]).nflId]
  }
  const a = players.find((p) => p.displayName === "Mark Andrews") ?? bySpace[0]
  const distance = (b: Player) => Math.abs((crossover(a, b) ?? Infinity) - leagueMan)
  const rival = others(a).reduce((best, p) => (distance(p) < distance(best) ? p : best))
  return [a.nflId, rival.nflId]
}

function PlayerSelect({ side, value, players, other, onChange }: { side: Side; value: number; players: Player[]; other: number; onChange: (id: number) => void }) {
  const items = players.map((p) => ({ value: String(p.nflId), label: `${p.displayName} · ${p.team}` }))
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", SWATCH[side])} />
        Player {side.toUpperCase()}
      </span>
      <Select items={items} value={String(value)} onValueChange={(v) => v != null && onChange(Number(v))}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {players.map((p) => (
            <SelectItem key={p.nflId} value={String(p.nflId)} disabled={p.nflId === other}>
              <PositionBadge position={p.officialPosition} />
              {p.displayName} · {p.team}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

function Identity({ side, p, rank, total }: { side: Side; p: Player; rank: number; total: number }) {
  return (
    <div className={cn("grid gap-1", side === "a" ? "justify-items-end text-right" : "justify-items-start")}>
      <span className={cn("flex items-center gap-2 text-lg font-semibold", side === "a" && "flex-row-reverse")}>
        <span className={cn("size-3 shrink-0 rounded-full", SWATCH[side])} />
        {p.displayName}
      </span>
      <span className={cn("flex items-center gap-2 text-xs text-muted-foreground", side === "a" && "flex-row-reverse")}>
        <PositionBadge position={p.officialPosition} />
        {p.team} · {p.routes} routes · {p.targets} balls thrown to him · #{rank} of {total}
      </span>
    </div>
  )
}

function TeamChips({ side, player, teams }: { side: Side; player: Player; teams: Team[] }) {
  return (
    <div className="grid gap-2">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className={cn("size-2.5 rounded-full", SWATCH[side])} />
        Feature {player.displayName} against ({teams.length})
      </span>
      {teams.length ? (
        <div className="flex flex-wrap gap-1.5">
          {teams.map((t) => (
            <span key={t.team} className="rounded-md border px-2 py-0.5 text-xs tabular-nums" title={`${t.team} plays man ${pct(t.man_rate)} of the time`}>
              <b>{t.team}</b> <span className="text-muted-foreground">{pct(t.man_rate)} man</span>
            </span>
          ))}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">None: the other receiver is the better pick against every NFL defense.</span>
      )}
    </div>
  )
}

export function CompareTab({ data, first }: Props) {
  const players = useMemo(() => [...data.players].sort((x, y) => x.displayName.localeCompare(y.displayName)), [data])
  const rank = useMemo(() => new Map([...data.players].sort((x, y) => y.soe - x.soe).map((p, i) => [p.nflId, i + 1])), [data])
  const leagueMan = leagueManRate(data.teams)
  const [ids, setIds] = useState(() => defaultPair(data.players, first, leagueMan))

  const byId = (id: number) => data.players.find((p) => p.nflId === id)!
  const a = byId(ids[0])
  const b = byId(ids[1])
  const { forA, forB } = splitDefenses(a, b, data.teams)
  const pick = (side: Side) => (id: number) => setIds(([x, y]) => (side === "a" ? [id, y] : [x, id]))

  return (
    <div className="grid gap-4">
      <LookingAt
        look="two receivers side by side. The longer the bar, the higher he ranks among all receivers; the better value of each row is in bold."
        meaning="who gets free more, and against which defense. The chart at the bottom answers the coach's question: against next week's opponent, which of the two should get the ball?"
      />

      <div className="flex flex-wrap items-end gap-3">
        <PlayerSelect side="a" value={a.nflId} players={players} other={b.nflId} onChange={pick("a")} />
        <Button variant="outline" size="icon" onClick={() => setIds(([x, y]) => [y, x])} aria-label="Swap the two players" title="Swap">
          <ArrowLeftRight />
        </Button>
        <PlayerSelect side="b" value={b.nflId} players={players} other={a.nflId} onChange={pick("b")} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardHeader>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              <Identity side="a" p={a} rank={rank.get(a.nflId)!} total={data.players.length} />
              <span className="w-28 text-center text-sm font-semibold text-muted-foreground sm:w-40">vs</span>
              <Identity side="b" p={b} rank={rank.get(b.nflId)!} total={data.players.length} />
            </div>
          </CardHeader>
          <CardContent>
            <HeadToHead a={a} b={b} all={data.players} />
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>In plain words</CardTitle>
            <CardDescription>
              {a.displayName}: {pct(catchRate(a))} of his {a.targets} balls caught. {b.displayName}: {pct(catchRate(b))} of {b.targets}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {verdicts(a, b, data.teams, rank, leagueMan).map((t) => (
              <p key={t} className="rounded-lg border bg-muted/50 p-3 text-sm">
                {t}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Who to feature, depending on the opponent</CardTitle>
            <CardDescription>
              Expected extra space of each receiver (the Game plan formula) as the defense plays more man. Where the lines cross, the better choice
              changes. The shaded band is the range of the {data.teams.length} NFL defenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <MatchupChart a={a} b={b} teams={data.teams} leagueMan={leagueMan} />
            <TeamChips side="a" player={a} teams={forA} />
            <TeamChips side="b" player={b} teams={forB} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Man or zone: where they stand among all receivers</CardTitle>
            <CardDescription>
              Each dot is a receiver: to the right he gets free against zone, at the top against man. Above the dashed line he is better against man than
              zone. Click a grey dot to compare it with {a.displayName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManZoneChart a={a} b={b} all={data.players} onPick={pick("b")} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
