import { useCallback, useEffect, useRef, useState } from "react"

const FPS = 10 // tracking data frequency
const UI_STEP = 0.5 // React state (slider, clock, timeline) moves by half frames; the canvas reads posRef every frame

/**
 * Smooth playback of a play. The exact fractional frame index lives in `posRef` and is read by the
 * canvas on every animation frame; `pos` is a coarser copy for the rest of the UI (cheap re-renders).
 * A new play opens paused on its throw frame; Play then restarts from the beginning.
 */
export function usePlayback(length: number, startAt: number) {
  const last = Math.max(0, length - 1)
  const posRef = useRef(startAt)
  const fresh = useRef(true)
  const [pos, setPos] = useState(startAt)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const moveTo = useCallback((p: number) => {
    posRef.current = p
    setPos(Math.round(p / UI_STEP) * UI_STEP)
  }, [])

  useEffect(() => {
    moveTo(startAt)
    setPlaying(false)
    fresh.current = true
  }, [startAt, length, moveTo])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - previous) / 1000)
      previous = now
      const next = Math.min(last, posRef.current + dt * FPS * speed)
      moveTo(next)
      if (next >= last) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed, last, moveTo])

  const play = useCallback(() => {
    if (fresh.current || posRef.current >= last) moveTo(0)
    fresh.current = false
    setPlaying(true)
  }, [last, moveTo])

  const seek = useCallback(
    (p: number) => {
      fresh.current = false
      setPlaying(false)
      moveTo(p)
    },
    [moveTo],
  )

  return {
    posRef,
    pos,
    playing,
    speed,
    ended: pos >= last,
    play,
    pause: () => setPlaying(false),
    seek,
    setSpeed,
    seconds: (i: number, snap: number) => (i - snap) / FPS,
  }
}
