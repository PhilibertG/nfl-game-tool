import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

import { SpaceChart } from "@/components/charts/SpaceChart"
import { TopReceiversChart } from "@/components/charts/TopReceiversChart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlayViewer } from "@/features/plays/PlayViewer"
import type { AppData } from "@/types"

type Props = { data: AppData; dark: boolean; goTo: (tab: "lab" | "board" | "plan") => void }

function Step({ n, title, intro, children, action }: { n: number; title: string; intro: ReactNode; children: ReactNode; action: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{intro}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {children}
        <div>{action}</div>
      </CardContent>
    </Card>
  )
}

/** Guided entry point: one example, the proof, the ranking. Each step links to the detailed tab. */
export function StoryTab({ data, dark, goTo }: Props) {
  const example = data.replays.find((r) => r.category === "missed") ?? data.replays[0]
  const covered = data.validation[0]
  const free = data.validation[data.validation.length - 2]
  const leader = [...data.players].sort((a, b) => b.soe - a.soe)[0]

  return (
    <div className="grid gap-6">
      <Step
        n={1}
        title="One play, one question: did the quarterback see the free receiver?"
        intro={
          <>
            Press <b>Play</b>. Each receiver has a circle: <b className="text-positive">green = free</b>, <b className="text-negative">red = covered</b>, and
            the % is his chance of catching the ball if it were thrown to him at that instant. The animation stops when the ball is thrown and labels
            who was the most open and who got the ball.
          </>
        }
        action={
          <Button variant="outline" onClick={() => goTo("lab")}>
            Watch {data.replays.length} other plays <ArrowRight />
          </Button>
        }
      >
        <PlayViewer play={example} categories={data.categories} dark={dark} withTimeline={false} />
      </Step>

      <Step
        n={2}
        title="Why it matters: space turns into catches"
        intro={
          <>
            Over {data.summary.targets.toLocaleString("en")} real passes, a receiver with less than 2 yards between him and the closest defender catches the
            ball <b>{Math.round(covered.completion * 100)}%</b> of the time. With {free.bin} yards it is <b>{Math.round(free.completion * 100)}%</b>. That is
            why we measure space, and why a quarterback who ignores a free receiver loses yards: it happened{" "}
            <b>{data.summary.missedOpen.toLocaleString("en")} times</b> in 8 weeks.
          </>
        }
        action={
          <Button variant="outline" onClick={() => goTo("lab")}>
            See the free receivers who were ignored <ArrowRight />
          </Button>
        }
      >
        <SpaceChart data={data} />
      </Step>

      <Step
        n={3}
        title="Who gets free the most? Our score: extra space"
        intro={
          <>
            For each receiver: his average space when the ball is thrown, <b>minus what an average receiver gets from the same starting spot against
            the same defense</b>. 0 = average. +1 yd = one yard more free than a normal receiver in his place. Leader: {leader.displayName} with{" "}
            <b className="text-positive">+{leader.soe.toFixed(1)} yd</b>.
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => goTo("board")}>
              Rank all {data.players.length} receivers <ArrowRight />
            </Button>
            <Button variant="outline" onClick={() => goTo("plan")}>
              Use it to prepare a game <ArrowRight />
            </Button>
          </div>
        }
      >
        <TopReceiversChart players={data.players} />
      </Step>
    </div>
  )
}
