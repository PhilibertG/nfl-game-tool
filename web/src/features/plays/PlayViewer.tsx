import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { usePlayback } from "@/hooks/usePlayback"
import { throwSentence } from "@/lib/throw"
import type { AppData, Replay } from "@/types"
import { FieldCanvas } from "./FieldCanvas"
import { PlayStory } from "./PlayStory"
import { Timeline } from "./Timeline"

type Props = {
  play: Replay
  categories: AppData["categories"]
  dark: boolean
  /** show the probability chart under the field */
  withTimeline?: boolean
  onPrev?: () => void
  onNext?: () => void
}

function phaseText(play: Replay, i: number) {
  if (i < play.snapIndex) return "Before the play starts"
  if (i < play.throwIndex) return `Quarterback looking for a receiver · ${((i - play.snapIndex) / 10).toFixed(1)} s`
  return "Ball thrown"
}

/** One play: summary, animated field (stops on the throw with annotations), controls and timeline. */
export function PlayViewer({ play, categories, dark, withTimeline = true, onPrev, onNext }: Props) {
  const length = play.entities[0].x.length
  const pb = usePlayback(length, play.throwIndex, play.throwIndex)
  const atThrow = pb.pos >= play.throwIndex
  const t = pb.seconds(pb.pos, play.snapIndex)
  const label = pb.playing ? "Pause" : pb.ended ? "Replay" : !pb.fresh && atThrow ? "Continue" : "Play"

  return (
    <div className="grid min-w-0 gap-4">
      <Card>
        <CardContent>
          <PlayStory play={play} categories={categories} />
        </CardContent>
      </Card>

      <FieldCanvas
        play={play}
        posRef={pb.posRef}
        phase={phaseText(play, pb.pos)}
        caption={atThrow ? throwSentence(play) : null}
        dark={dark}
      />

      <div className="flex items-center gap-2">
        {onPrev && (
          <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous play">
            <ChevronLeft />
          </Button>
        )}
        <Button onClick={pb.playing ? pb.pause : pb.play} className="w-32">
          {pb.playing ? <Pause /> : pb.ended ? <RotateCcw /> : <Play />}
          {label}
        </Button>
        {onNext && (
          <Button variant="outline" size="icon" onClick={onNext} aria-label="Next play">
            <ChevronRight />
          </Button>
        )}
        <Slider
          className="mx-2 flex-1"
          min={0}
          max={length - 1}
          step={0.01}
          value={pb.pos}
          onValueChange={(v) => pb.seek(Array.isArray(v) ? v[0] : v)}
          aria-label="Time in the play"
        />
        <ToggleGroup variant="outline" size="sm" value={[String(pb.speed)]} onValueChange={(v) => v.length && pb.setSpeed(Number(v[0]))}>
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

      {withTimeline && (
        <Card>
          <CardHeader>
            <CardTitle>Chance of a catch if the ball were thrown now</CardTitle>
            <CardDescription>
              One line per receiver, from the start of the play (snap) to the moment the ball is thrown. The bold line is the player this play is about.
              Above the dashed line (80%), a receiver is considered open.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline play={play} cursor={pb.pos} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
