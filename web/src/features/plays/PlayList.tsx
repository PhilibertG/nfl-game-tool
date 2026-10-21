import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { AppData, Replay } from "@/types"

type Props = {
  data: AppData
  list: Replay[]
  index: number
  category: string
  onCategory: (c: string) => void
  onSelect: (i: number) => void
}

export function PlayList({ data, list, index, category, onCategory, onSelect }: Props) {
  const options = [
    { value: "all", label: `All plays (${data.replays.length})` },
    ...Object.entries(data.categories).map(([key, label]) => ({
      value: key,
      label: `${label} (${data.replays.filter((r) => r.category === key).length})`,
    })),
  ]

  return (
    <div className="grid gap-3">
      <Select items={options} value={category} onValueChange={(v) => onCategory(String(v))}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ScrollArea className="h-[620px] pr-2">
        <ul className="grid gap-0.5">
          {list.map((r, i) => (
            <li key={`${r.gameId}-${r.playId}`}>
              <button
                onClick={() => onSelect(i)}
                className={cn(
                  "grid w-full gap-0.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                  i === index && "bg-secondary shadow-[inset_3px_0_0_var(--primary)]",
                )}
              >
                <span className="font-medium">{r.entities.find((e) => e.id === r.focus)?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {data.categories[r.category]} · {r.offense} vs {r.defense}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
