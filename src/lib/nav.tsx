import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type Tab = 'journal' | 'insights' | 'settings'
export type Overlay = { kind: 'entry'; id: string } | { kind: 'compose'; id?: string }

interface Nav {
  tab: Tab
  setTab(tab: Tab): void
  overlays: Overlay[]
  open(overlay: Overlay): void
  /** Replaces the top overlay without adding a history step (e.g. compose → saved entry). */
  replace(overlay: Overlay): void
  back(): void
  reset(): void
}

const NavContext = createContext<Nav | null>(null)

export const useNav = () => {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav must be used inside <NavProvider>')
  return ctx
}

/**
 * Overlays live on the browser history stack, so the Android hardware back
 * button and the iOS edge swipe close them on both frameworks for free.
 */
export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>('journal')
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const depth = useRef(0)

  useEffect(() => {
    const onPop = () => {
      if (depth.current === 0) return
      depth.current--
      setOverlays((s) => s.slice(0, -1))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = useCallback((overlay: Overlay) => {
    depth.current++
    history.pushState({ depth: depth.current }, '')
    setOverlays((s) => [...s, overlay])
  }, [])

  const replace = useCallback((overlay: Overlay) => {
    setOverlays((s) => (s.length ? [...s.slice(0, -1), overlay] : [overlay]))
  }, [])

  const back = useCallback(() => {
    if (depth.current > 0) history.back()
  }, [])

  const reset = useCallback(() => {
    if (depth.current > 0) history.go(-depth.current)
    depth.current = 0
    setOverlays([])
  }, [])

  const setTab = useCallback((t: Tab) => {
    setTabState(t)
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <NavContext.Provider value={{ tab, setTab, overlays, open, replace, back, reset }}>{children}</NavContext.Provider>
  )
}
