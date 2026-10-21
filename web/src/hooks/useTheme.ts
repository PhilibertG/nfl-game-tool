import { useEffect, useState } from "react"

const KEY = "owl-theme"

function readSaved() {
  try {
    return localStorage.getItem(KEY) === "dark"
  } catch {
    return false
  }
}

/** Light / dark theme via the `.dark` class used by shadcn. */
export function useTheme() {
  const [dark, setDark] = useState(readSaved)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light")
    } catch {
      /* storage unavailable */
    }
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}
