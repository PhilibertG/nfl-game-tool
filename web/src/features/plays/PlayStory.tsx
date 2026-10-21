import { Term } from "@/components/Term"
import { Badge } from "@/components/ui/badge"
import { isManCall, lastValue, pct } from "@/lib/format"
import type { AppData, Replay } from "@/types"

const RESULT: Record<string, string> = {
  C: "caught",
  I: "incomplete (not caught)",
  IN: "intercepted by the defense",
}

const CATEGORY_HELP = {
  missed: "A receiver was clearly open, but the quarterback threw to someone else.",
  open_catch: "The receiver was completely free and caught the ball.",
  tight_catch: "The receiver was closely marked, but still made the catch.",
}

/** One-sentence summary of the play, written for someone who does not know football. */
export function PlayStory({ play, categories }: { play: Replay; categories: AppData["categories"] }) {
  const focus = play.entities.find((e) => e.id === play.focus)!
  const p = pct(lastValue(focus.p!))
  const name = <b>{focus.name}</b>
  const man = isManCall(play.coverage)

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5">
        <Badge>{categories[play.category]}</Badge>
        <Badge variant="outline">{play.offense} (attack) vs {play.defense} (defense)</Badge>
        <Badge variant="outline">
          <Term tip={man ? "Man defense: each defender follows one receiver everywhere." : "Zone defense: each defender guards an area of the field."}>
            {man ? "Man" : "Zone"} defense ({play.coverage})
          </Term>
        </Badge>
        <Badge variant="outline">
          <Term tip={`The attack has 4 tries (downs) to move the ball 10 yards. Here: try number ${play.down}, ${play.toGo} yards still needed.`}>
            Down {play.down}, {play.toGo} yd to go
          </Term>
        </Badge>
      </div>
      <p className="text-base font-medium">
        {play.category === "missed" && <>{name} had a {p} chance of catching it when the ball was thrown, the best on the field. The quarterback threw elsewhere and the pass was {RESULT[play.result] ?? play.result}.</>}
        {play.category === "open_catch" && <>{name} was wide open ({p} chance) when the ball was thrown, and caught it for {play.yards} yards.</>}
        {play.category === "tight_catch" && <>{name} only had a {p} chance when the ball was thrown, a defender was right on him, and he still caught it.</>}
      </p>
      <p className="text-xs text-muted-foreground">
        {CATEGORY_HELP[play.category]} Official play text: <i>{play.description}</i>
      </p>
    </div>
  )
}
