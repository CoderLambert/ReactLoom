import { createContext, useEffect, useState } from 'react'

export const ReducedMotionContext = createContext(false)

/** In installed 14.6.0 useReducedMotion is a mount snapshot. This app owns live preference updates. */
export function useLiveReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    change()
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return reduced
}
