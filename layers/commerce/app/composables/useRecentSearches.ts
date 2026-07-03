// Small localStorage-backed recent-search store for the Discover search.
const KEY = 'mx_recent_searches'
const MAX = 8

export function useRecentSearches() {
  const get = (): string[] => {
    if (!import.meta.client) return []
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  }

  const add = (term: string) => {
    if (!import.meta.client) return
    const t = term.trim()
    if (!t) return
    const next = [
      t,
      ...get().filter((x) => x.toLowerCase() !== t.toLowerCase()),
    ].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const clear = () => {
    if (import.meta.client) localStorage.removeItem(KEY)
  }

  return { get, add, clear }
}
