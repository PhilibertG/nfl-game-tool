// Head-to-head maths: which of two receivers to feature, overall and against each defense.

import { expectedSpace } from "@/lib/plan"
import { pct, yds } from "@/lib/format"
import type { Player, Team } from "@/types"

/** Below this many routes against a type of defense, the split is flagged as a small sample. */
export const SMALL_SAMPLE = 20

export const catchRate = (p: Player) => (p.targets ? p.catches / p.targets : null)

/**
 * Share of man defense at which both receivers should get the same space, or null when one of them is ahead against
 * every possible defense (the difference of two straight lines in the man rate changes sign at most once).
 */
export function crossover(a: Player, b: Player) {
  const atZone = expectedSpace(a, 0) - expectedSpace(b, 0)
  const atMan = expectedSpace(a, 1) - expectedSpace(b, 1)
  if (atZone * atMan >= 0) return null
  return atZone / (atZone - atMan)
}

/** Each defense, with the receiver who should get more space against it. */
export function splitDefenses(a: Player, b: Player, teams: Team[]) {
  const forA: Team[] = []
  const forB: Team[] = []
  for (const t of [...teams].sort((x, y) => x.man_rate - y.man_rate)) {
    if (expectedSpace(a, t.man_rate) >= expectedSpace(b, t.man_rate)) forA.push(t)
    else forB.push(t)
  }
  return { forA, forB }
}

/** Plain-language summary of the duel. */
export function verdicts(a: Player, b: Player, teams: Team[], rank: Map<number, number>, leagueMan: number) {
  const out: string[] = []
  const total = rank.size
  // compared at the precision shown on screen, so the sentence never contradicts the table
  const gap = Number(a.soe.toFixed(1)) - Number(b.soe.toFixed(1))
  const [lead, trail] = gap >= 0 ? [a, b] : [b, a]
  if (gap === 0) {
    out.push(`Overall they get the same space (${yds(a.soe)} vs ${yds(b.soe)}): the type of defense decides who to feature.`)
  } else {
    out.push(
      `Overall, ${lead.displayName} gets ${yds(Math.abs(gap))} more space per route than ${trail.displayName} ` +
        `(#${rank.get(lead.nflId)} vs #${rank.get(trail.nflId)} of ${total} receivers).`,
    )
  }

  const cross = crossover(a, b)
  if (cross == null) {
    const best = expectedSpace(a, leagueMan) >= expectedSpace(b, leagueMan) ? a : b
    out.push(`${best.displayName} should get more space against every type of defense, man or zone.`)
  } else {
    const manFan = expectedSpace(a, 1) > expectedSpace(b, 1) ? a : b
    const zoneFan = manFan === a ? b : a
    out.push(
      `Against defenses that play man more than ${pct(cross)} of the time, feature ${manFan.displayName}; below that, ` +
        `${zoneFan.displayName}. The league average is ${pct(leagueMan)} man.`,
    )
  }

  const { forA, forB } = splitDefenses(a, b, teams)
  if (forA.length && forB.length) {
    out.push(`Among the ${teams.length} NFL defenses, ${a.displayName} is the better pick against ${forA.length} and ${b.displayName} against ${forB.length}.`)
  } else if (cross != null) {
    const best = forA.length ? a : b
    out.push(`In practice every one of the ${teams.length} NFL defenses falls on ${best.displayName}'s side of that line.`)
  }

  if (Math.abs(a.missed_rate - b.missed_rate) >= 0.03) {
    const [more, less] = a.missed_rate > b.missed_rate ? [a, b] : [b, a]
    out.push(
      `${more.displayName} was open and ignored on ${pct(more.missed_rate, 1)} of his routes (${less.displayName}: ${pct(less.missed_rate, 1)}): ` +
        `his quarterback leaves more on the table.`,
    )
  }

  for (const p of [a, b]) {
    for (const [routes, label] of [[p.routes_man, "man"], [p.routes_zone, "zone"]] as const) {
      if (routes != null && routes < SMALL_SAMPLE) {
        out.push(`Careful: ${p.displayName} faced ${label} defense on only ${routes} routes, so his “vs ${label}” number is less reliable.`)
      }
    }
  }
  return out
}
