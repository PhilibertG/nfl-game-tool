// What happened at the moment of the throw: who was the most open, who got the ball.

import { lastName, lastValue } from "@/lib/format"
import type { Entity, Replay } from "@/types"

export type ThrowMoment = {
  best: Entity & { pThrow: number }
  target: (Entity & { pThrow: number }) | null
  /** the ball went to the most open receiver */
  smart: boolean
}

export function throwMoment(play: Replay): ThrowMoment {
  const receivers = play.entities
    .filter((e) => e.p)
    .map((e) => ({ ...e, pThrow: lastValue(e.p!) ?? 0 }))
  const best = receivers.reduce((a, b) => (b.pThrow > a.pThrow ? b : a))
  const target = receivers.find((e) => e.id === play.target) ?? null
  return { best, target, smart: target?.id === best.id }
}

/** One sentence describing the throw, shown on the field when the animation stops there. */
export function throwSentence(play: Replay) {
  const { best, target, smart } = throwMoment(play)
  const pct = (p: number) => `${Math.round(p * 100)}%`
  if (!target) return `The ball is thrown. ${lastName(best.name)} was the most open (${pct(best.pThrow)}).`
  if (smart) return `The ball goes to ${lastName(target.name)}, the most open receiver (${pct(target.pThrow)} chance of a catch).`
  return `The ball goes to ${lastName(target.name)} (${pct(target.pThrow)}) while ${lastName(best.name)} was free (${pct(best.pThrow)}).`
}
