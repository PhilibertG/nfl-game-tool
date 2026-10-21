import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { POSITION_NAMES } from "@/lib/format"
import type { Position } from "@/types"

const COLORS: Record<Position, string> = {
  WR: "bg-pos-wr",
  TE: "bg-pos-te",
  RB: "bg-pos-rb",
}

export function PositionBadge({ position }: { position: Position }) {
  return (
    <Badge className={cn("text-white", COLORS[position])} title={POSITION_NAMES[position]}>
      {position}
    </Badge>
  )
}
