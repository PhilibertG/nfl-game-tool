import type { ReactNode } from "react"
import { Eye } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/** "What you are looking at" box shown at the top of every tab: what to look at, and what it means. */
export function LookingAt({ look, meaning }: { look: ReactNode; meaning: ReactNode }) {
  return (
    <Alert>
      <Eye />
      <AlertTitle>What you are looking at</AlertTitle>
      <AlertDescription>
        <p>
          <b className="text-foreground">Look at:</b> {look}
        </p>
        <p>
          <b className="text-foreground">It means:</b> {meaning}
        </p>
      </AlertDescription>
    </Alert>
  )
}
