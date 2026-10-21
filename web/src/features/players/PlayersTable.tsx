import { ArrowDown, ArrowUp } from "lucide-react"

import { PositionBadge } from "@/components/PositionBadge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { signClass } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Player } from "@/types"
import { COLUMNS } from "./columns"

export type Sort = { key: keyof Player; desc: boolean }

type Props = {
  rows: Player[]
  sort: Sort
  onSort: (s: Sort) => void
  selected: number
  onSelect: (p: Player) => void
  /** rank of each player on extra space (1 = most open) */
  rank: Map<number, number>
}

export function PlayersTable({ rows, sort, onSort, selected, onSelect, rank }: Props) {
  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-card">
        <TableRow>
          {COLUMNS.map((c, i) => (
            <TableHead
              key={c.key}
              title={c.tip}
              onClick={() => onSort({ key: c.key, desc: c.key === sort.key ? !sort.desc : true })}
              className={cn("cursor-pointer select-none", i > 1 && "text-right", c.key === sort.key && "text-foreground")}
            >
              <span className="inline-flex items-center gap-1">
                {c.label}
                {c.key === sort.key && (sort.desc ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />)}
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow
            key={p.nflId}
            onClick={() => onSelect(p)}
            data-state={p.nflId === selected ? "selected" : undefined}
            className="cursor-pointer"
          >
            <TableCell>
              <span className="flex items-center gap-2">
                <PositionBadge position={p.officialPosition} />
                <span className="font-medium">{p.displayName}</span>
              </span>
            </TableCell>
            <TableCell>{p.team}</TableCell>
            {COLUMNS.slice(2).map((c) => {
              const v = p[c.key] as number | null
              return (
                <TableCell key={c.key} className={cn("text-right tabular-nums", c.signed && signClass(v))}>
                  {c.format ? c.format(v) : v}
                  {c.key === "soe" && <span className="ml-1.5 text-xs text-muted-foreground">#{rank.get(p.nflId)}</span>}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
