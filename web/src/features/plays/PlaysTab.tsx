import { useMemo, useState } from "react"

import { LookingAt } from "@/components/LookingAt"
import { Card, CardContent } from "@/components/ui/card"
import type { AppData } from "@/types"
import { HowToRead } from "./HowToRead"
import { PlayList } from "./PlayList"
import { PlayViewer } from "./PlayViewer"

type Props = { data: AppData; dark: boolean; playerFilter: number | null; onClearFilter: () => void }

export function PlaysTab({ data, dark, playerFilter, onClearFilter }: Props) {
  const [category, setCategory] = useState("all")
  const [index, setIndex] = useState(0)

  const list = useMemo(() => {
    const filtered = data.replays.filter(
      (r) => (category === "all" || r.category === category) && (playerFilter == null || r.focus === playerFilter),
    )
    return filtered.length ? filtered : data.replays
  }, [data, category, playerFilter])

  const current = Math.min(index, list.length - 1)
  const play = list[current]
  const select = (i: number) => setIndex((i + list.length) % list.length)
  const changeCategory = (c: string) => {
    setCategory(c)
    setIndex(0)
    onClearFilter()
  }

  return (
    <div className="grid gap-4">
      <LookingAt
        look="the coloured circle around each receiver. Press Play: the animation stops when the ball is thrown and labels who was the most open and who got the ball."
        meaning="green = the receiver is free and a pass to him would likely be caught, red = a defender is on him. A good throw goes to the greenest circle."
      />
      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card>
          <CardContent>
            <PlayList data={data} list={list} index={current} category={category} onCategory={changeCategory} onSelect={select} />
          </CardContent>
        </Card>
        <div className="grid min-w-0 gap-4">
          <PlayViewer
            key={`${play.gameId}-${play.playId}`}
            play={play}
            categories={data.categories}
            dark={dark}
            onPrev={() => select(current - 1)}
            onNext={() => select(current + 1)}
          />
          <HowToRead />
        </div>
      </div>
    </div>
  )
}
