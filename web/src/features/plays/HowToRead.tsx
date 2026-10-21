import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"

const Dot = ({ color }: { color: string }) => (
  <span className="mx-1 inline-block size-2.5 rounded-full align-middle" style={{ background: color }} />
)

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <Card size="sm">
      <CardContent className="grid grid-cols-[28px_1fr] items-start gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-secondary text-sm font-semibold">{n}</span>
        <p className="text-sm">{children}</p>
      </CardContent>
    </Card>
  )
}

/** Three-step legend of the field, for readers who do not know football. */
export function HowToRead() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Step n={1}>
        <b>Who is who.</b>
        <Dot color="var(--offense)" />Blue = the attacking team,
        <Dot color="var(--defense)" />red = the defense,
        <Dot color="var(--ball)" />the ball. The attack moves left to right.
      </Step>
      <Step n={2}>
        <b>The circles.</b> Each possible receiver has a ring:{" "}
        <span className="inline-block h-2 w-20 rounded-full bg-gradient-to-r from-[hsl(0,80%,52%)] via-[hsl(60,80%,52%)] to-[hsl(130,80%,45%)] align-middle" />{" "}
        red = covered, green = open. The dotted line links him to the closest defender.
      </Step>
      <Step n={3}>
        <b>The question.</b> Press play and watch the rings. When the ball leaves the quarterback's hand, did it go to the greenest ring?
      </Step>
    </div>
  )
}
