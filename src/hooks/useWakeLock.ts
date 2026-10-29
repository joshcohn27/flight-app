import { useEffect } from 'react'

// keeps the screen on while the app is open, skipped where unsupported
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) {
      return
    }

    let stopped = false
    let sentinel: WakeLockSentinel | null = null

    async function requestLock() {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (stopped) {
          lock.release()
          return
        }
        sentinel = lock
      } catch {
        // low power mode or no permission, nothing to do
      }
    }

    // ios drops the lock whenever the page is hidden
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        requestLock()
      }
    }

    requestLock()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (sentinel !== null) {
        sentinel.release()
      }
    }
  }, [])
}
