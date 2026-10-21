import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const SEEN_KEY = "owl-help-seen"

const STEPS = [
  ["Receivers run", "Up to 5 teammates run planned paths to get away from the defenders."],
  ["Defenders cover", "Defenders try to stay close to them so a pass can't be caught."],
  ["QB chooses", "The quarterback must spot who is free and throw. That choice decides the play."],
]

const GLOSSARY = [
  ["Quarterback (QB)", "The player who gets the ball at the start of each play and throws it."],
  ["Receiver", "A player who runs a planned path (a “route”) to catch the ball. Three kinds below."],
  ["WR · Wide receiver", "Fast player lined up near the sideline. The main pass catcher."],
  ["TE · Tight end", "Big player next to the blockers. Blocks, and catches short or middle passes."],
  ["RB · Running back", "Starts behind the quarterback. Mostly runs with the ball, also catches short passes."],
  ["Snap", "The moment the play starts: the ball is handed back to the quarterback."],
  ["Open", "A receiver far enough from every defender that a pass to him is likely to be caught."],
  ["Man / Zone defense", "Man: each defender follows one receiver. Zone: each defender guards an area."],
  ["Yard", "Unit of distance, about 0.91 m. The field is 120 yards long."],
  ["Down", "The attack has 4 tries (downs) to advance 10 yards, otherwise it loses the ball."],
]

/** First visit: open automatically (?help=0 in the URL disables it, used for screenshots). */
function shouldOpen() {
  if (new URLSearchParams(location.search).get("help") === "0") return false
  try {
    return localStorage.getItem(SEEN_KEY) !== "1"
  } catch {
    return true
  }
}

export function HelpDialog() {
  const [open, setOpen] = useState(shouldOpen)

  const change = (next: boolean) => {
    setOpen(next)
    if (!next) {
      try {
        localStorage.setItem(SEEN_KEY, "1")
      } catch {
        /* storage unavailable */
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>New to football?</DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>American football in 60 seconds</DialogTitle>
          <DialogDescription>
            Two teams of 11. The attack tries to carry the ball to the far end of the field. On a passing play, the quarterback has about 3 seconds to
            throw the ball to a teammate before defenders reach him.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <Card key={title} size="sm">
              <CardContent className="grid gap-1 text-sm">
                <span className="grid size-7 place-items-center rounded-full bg-secondary text-sm font-semibold">{i + 1}</span>
                <b>{title}</b>
                <span className="text-muted-foreground">{text}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm">
          <b>What this site does:</b> it measures, every tenth of a second, how free each receiver is and his chance of catching the ball if it were
          thrown to him right now. Then it shows who gets free most often, against which defense, and when the quarterback missed a free teammate.
        </p>

        <dl className="grid gap-2 sm:grid-cols-2">
          {GLOSSARY.map(([term, def]) => (
            <div key={term} className="rounded-lg border p-3">
              <dt className="text-sm font-semibold">{term}</dt>
              <dd className="text-xs text-muted-foreground">{def}</dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button onClick={() => change(false)}>Got it, show me the plays</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
