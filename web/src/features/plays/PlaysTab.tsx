import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { usePlayback } from "@/hooks/usePlayback"
import type { AppData, Replay } from "@/types"
import { FieldCanvas } from "./FieldCanvas"
import { HowToRead } from "./HowToRead"
import { PlayList } from "./PlayList"
import { PlayStory } from "./PlayStory"
import { Timeline } from "./Timeline"

type Props = { data: AppData; dark: boolean; playerFilter: number | null; onClearFilter: () => void }

function phaseText(play: Replay, i: number) {
  if (i < play.snapIndex) return "Before the play starts"
  if (i < play.throwIndex) return `Quarterback looking for a receiver · ${((i - play.snapIndex) / 10).toFixed(1)} s`
  return "Ball thrown"
}

export function PlaysTab({ data, dark, playerFilter, onClearFilter }: Props) {
  const [category, setCategory] = useState("all")
  const [index, setIndex] = useState(0)

  const list = useMemo(() => {
    const filtered = data.replays.filter(
      (r) => (category === "all" || r.category === category) && (playerFilter == null || r.focus === playerFilter),
    )
    return filtered.length ? filtered : data.replays
  }, [data, category, playerFilter])

  const play = list[Math.min(index, list.length - 1)]
  const length = play.entities[0].x.length
  const pb = usePlayback(length, play.throwIndex)

  const select = (i: number) => setIndex((i + list.length) % list.length)
  const changeCategory = (c: string) => {
    setCategory(c)
    setIndex(0)
    onClearFilter()
  }
  const t = pb.seconds(pb.pos, play.snapIndex)

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Card>
        <CardContent>
          <PlayList data={data} list={list} index={index} category={category} onCategory={changeCategory} onSelect={select} />
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4">
        <Card>
          <CardContent>
            <PlayStory play={play} categories={data.categories} />
          </CardContent>
        </Card>

        <FieldCanvas play={play} posRef={pb.posRef} phase={phaseText(play, pb.pos)} dark={dark} />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => select(index - 1)} aria-label="Previous play">
            <ChevronLeft />
          </Button>
          <Button onClick={pb.playing ? pb.pause : pb.play} className="w-28">
            {pb.playing ? <Pause /> : pb.ended ? <RotateCcw /> : <Play />}
            {pb.playing ? "Pause" : pb.ended ? "Replay" : "Play"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => select(index + 1)} aria-label="Next play">
            <ChevronRight />
          </Button>
          <Slider
            className="mx-2 flex-1"
            min={0}
            max={length - 1}
            step={0.01}
            value={pb.pos}
            onValueChange={(v) => pb.seek(Array.isArray(v) ? v[0] : v)}
            aria-label="Time in the play"
          />
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[String(pb.speed)]}
            onValueChange={(v) => v.length && pb.setSpeed(Number(v[0]))}
          >
            {["0.5", "1", "2"].map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {s}×
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <span className="w-14 text-right text-sm text-muted-foreground tabular-nums">
            {t >= 0 ? "+" : "−"}
            {Math.abs(t).toFixed(1)} s
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chance of a catch if the ball were thrown now</CardTitle>
            <CardDescription>
              One line per receiver, from the start of the play (snap) to the moment the ball is thrown. The bold line is the player this play is about.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline play={play} cursor={pb.pos} />
          </CardContent>
        </Card>

        <HowToRead />
      </div>
    </div>
  )
}
