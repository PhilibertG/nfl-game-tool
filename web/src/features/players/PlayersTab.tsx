import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { LookingAt } from "@/components/LookingAt"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { POSITION_NAMES, yds } from "@/lib/format"
import type { AppData, Player, Position } from "@/types"
import { PlayerProfile } from "./PlayerProfile"
import { PlayersTable, type Sort } from "./PlayersTable"

type Props = { data: AppData; onWatchPlayer: (id: number) => void }

const POSITIONS: ("ALL" | Position)[] = ["ALL", "WR", "TE", "RB"]

function sortRows(rows: Player[], { key, desc }: Sort) {
  return [...rows].sort((a, b) => {
    const va = a[key] ?? -Infinity
    const vb = b[key] ?? -Infinity
    const cmp = typeof va === "string" ? va.localeCompare(String(vb)) : (va as number) - (vb as number)
    return desc ? -cmp : cmp
  })
}

export function PlayersTab({ data, onWatchPlayer }: Props) {
  const [query, setQuery] = useState("")
  const [position, setPosition] = useState<"ALL" | Position>("ALL")
  const [sort, setSort] = useState<Sort>({ key: "soe", desc: true })
  const [selected, setSelected] = useState<Player>(data.players[0])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = data.players
      .filter((p) => position === "ALL" || p.officialPosition === position)
      .filter((p) => !q || p.displayName.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
    return sortRows(filtered, sort)
  }, [data, query, position, sort])

  const bySpace = useMemo(() => [...data.players].sort((a, b) => b.soe - a.soe), [data])
  const rank = useMemo(() => new Map(bySpace.map((p, i) => [p.nflId, i + 1])), [bySpace])
  const best = bySpace[0]
  const worst = bySpace[bySpace.length - 1]

  return (
    <div className="grid gap-4">
      <LookingAt
        look={
          <>
            the <b>Extra space</b> column. Each row is a receiver; the number after # is his rank out of {data.players.length}. Click a row for his
            profile in plain words.
          </>
        }
        meaning={
          <>
            0 = an average receiver starting from the same spot against the same defense. Above 0 he gets free more often, below 0 less. Range: from{" "}
            {yds(best.soe)} ({best.displayName}) to {yds(worst.soe)} ({worst.displayName}). “vs man” / “vs zone” split it by type of defense.
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a player or a team (e.g. KC, Kelce)" className="pl-9" />
        </div>
        <ToggleGroup variant="outline" value={[position]} onValueChange={(v) => v.length && setPosition(v[0] as "ALL" | Position)}>
          {POSITIONS.map((p) => (
            <ToggleGroupItem key={p} value={p} title={p === "ALL" ? "All positions" : POSITION_NAMES[p]}>
              {p === "ALL" ? "All" : p}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="max-h-[720px] overflow-auto py-0">
          <PlayersTable rows={rows} sort={sort} onSort={setSort} selected={selected.nflId} onSelect={setSelected} rank={rank} />
        </Card>
        <PlayerProfile
          player={selected}
          all={data.players}
          hasPlays={data.replays.some((r) => r.focus === selected.nflId)}
          onWatch={() => onWatchPlayer(selected.nflId)}
        />
      </div>
    </div>
  )
}
