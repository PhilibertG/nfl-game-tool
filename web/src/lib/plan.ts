// Game plan maths shared by the Game plan and Compare tabs.

import type { Player } from "@/types"

/** Space a receiver should get against a defense = his space vs man / zone weighted by how often it plays each. */
export const expectedSpace = (p: Player, manRate: number) =>
  manRate * (p.soe_man ?? p.soe) + (1 - manRate) * (p.soe_zone ?? p.soe)

/** League average share of man defense. */
export const leagueManRate = (teams: { man_rate: number }[]) => teams.reduce((s, t) => s + t.man_rate, 0) / teams.length
