import { useEffect, useRef, type RefObject } from "react"

import { drawFrame, fitCanvas } from "@/lib/field"
import type { Replay } from "@/types"

type Props = { play: Replay; posRef: RefObject<number>; phase: string; caption: string | null; dark: boolean }

/**
 * The animated field. Its own requestAnimationFrame loop reads the exact position from `posRef`
 * and redraws only when something changed, so React does not re-render 60 times per second.
 */
export function FieldCanvas({ play, posRef, phase, caption, dark }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let frame = 0
    let drawn = { pos: NaN, w: 0 }
    const loop = () => {
      fitCanvas(canvas)
      const pos = posRef.current ?? 0
      if (pos !== drawn.pos || canvas.width !== drawn.w) {
        drawFrame(canvas, play, pos)
        drawn = { pos, w: canvas.width }
      }
      frame = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(frame)
  }, [play, posRef, dark])

  return (
    <div className="relative overflow-hidden rounded-xl">
      <canvas ref={ref} className="block aspect-[120/53.3] w-full" />
      <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">{phase}</span>
      {caption && (
        <p className="absolute inset-x-3 bottom-3 rounded-lg bg-black/75 px-4 py-2 text-center text-sm font-medium text-white">{caption}</p>
      )}
    </div>
  )
}
