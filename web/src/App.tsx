import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { HelpDialog } from "@/components/HelpDialog"
import { Term } from "@/components/Term"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { HowItWorksTab } from "@/features/method/HowItWorksTab"
import { CompareTab } from "@/features/compare/CompareTab"
import { GamePlanTab } from "@/features/plan/GamePlanTab"
import { PlayersTab } from "@/features/players/PlayersTab"
import { PlaysTab } from "@/features/plays/PlaysTab"
import { StoryTab } from "@/features/story/StoryTab"
import { useAppData } from "@/hooks/useAppData"
import { useTheme } from "@/hooks/useTheme"

const TABS = [
  ["story", "Start here"],
  ["lab", "Watch plays"],
  ["board", "Players"],
  ["compare", "Compare"],
  ["plan", "Game plan"],
  ["method", "How it works"],
] as const
type Tab = (typeof TABS)[number][0]

// tabs can be opened by link: #lab, #board, #compare, #plan, #method
const initialTab = (): Tab => (TABS.find(([id]) => `#${id}` === location.hash)?.[0] ?? "story")

export default function App() {
  const { data, error } = useAppData()
  const theme = useTheme()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [playerFilter, setPlayerFilter] = useState<number | null>(null)
  const [compareFirst, setCompareFirst] = useState<number | null>(null)

  useEffect(() => history.replaceState(null, "", `${location.search}#${tab}`), [tab])

  const watchPlayer = (id: number) => {
    setPlayerFilter(id)
    setTab("lab")
  }

  const comparePlayer = (id: number) => {
    setCompareFirst(id)
    setTab("compare")
    window.scrollTo(0, 0)
  }

  return (
    <TooltipProvider>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-0">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-2.5 md:px-6">
            <div className="flex items-center gap-2 font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">◎</span>
              Open Window Lab
            </div>
            <TabsList>
              {TABS.map(([id, label]) => (
                <TabsTrigger key={id} value={id}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <HelpDialog />
              <Button variant="ghost" size="icon" onClick={theme.toggle} aria-label="Toggle dark mode">
                {theme.dark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 md:px-6">
          <section className="grid gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Who gets open, and does the quarterback see it?</h1>
            <p className="max-w-3xl text-muted-foreground">
              In American football the{" "}
              <Term tip="The player who receives the ball at the start of the play and throws it.">quarterback</Term> throws the ball to a teammate who runs
              a planned path. A pass is much easier to complete when that teammate is <b className="text-foreground">far from every defender</b>, which is
              what “open” means. Using the position of all 22 players measured 10 times per second, we compute at every instant each receiver's chance of
              catching the ball if it were thrown to him right now.
            </p>
          </section>

          {error && <p className="text-destructive">Error: {error}</p>}
          {data && (
            <>
              <TabsContent value="story">
                <StoryTab data={data} dark={theme.dark} goTo={(t) => { setTab(t); window.scrollTo(0, 0) }} />
              </TabsContent>
              <TabsContent value="lab">
                <PlaysTab data={data} dark={theme.dark} playerFilter={playerFilter} onClearFilter={() => setPlayerFilter(null)} />
              </TabsContent>
              <TabsContent value="board">
                <PlayersTab data={data} onWatchPlayer={watchPlayer} onComparePlayer={comparePlayer} />
              </TabsContent>
              <TabsContent value="compare">
                <CompareTab key={compareFirst ?? "default"} data={data} first={compareFirst} />
              </TabsContent>
              <TabsContent value="plan">
                <GamePlanTab data={data} />
              </TabsContent>
              <TabsContent value="method">
                <HowItWorksTab data={data} />
              </TabsContent>
            </>
          )}
        </main>
      </Tabs>
    </TooltipProvider>
  )
}
