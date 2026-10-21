import { useEffect, useState } from "react"

import type { AppData } from "@/types"

type State = { data: AppData | null; error: string | null }

/** Load the JSON produced by the Python pipeline. */
export function useAppData(): State {
  const [state, setState] = useState<State>({ data: null, error: null })

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/data.json`)
      .then((r) => {
        if (!r.ok) throw new Error("data/data.json not found: run ./run.sh first")
        return r.json()
      })
      .then((data: AppData) => setState({ data, error: null }))
      .catch((e: Error) => setState({ data: null, error: e.message }))
  }, [])

  return state
}
