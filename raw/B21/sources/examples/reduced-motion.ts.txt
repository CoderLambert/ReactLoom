import { createContext, useEffect, useState } from 'react'

export const ReducedMotionContext = createContext(false)

// Installed Motion14.6.0 useReducedMotion is a mount snapshot, so this example
// owns the live media subscription and every target/duration/layout decision.
export function useLiveReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reduced
}
