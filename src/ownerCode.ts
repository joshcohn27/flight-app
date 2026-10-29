// the owner code turns on flightaware routes, which cost money, for just this device.
// friends opening the same site don't have it, so they get the free routes

const STORAGE_KEY = 'flight-overhead-owner-code'

export function readOwnerCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // private mode or storage blocked
    return null
  }
}

export function saveOwnerCode(code: string): void {
  try {
    const trimmed = code.trim()
    if (trimmed === '') {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, trimmed)
  } catch {
    // nowhere to save it, so it just stays off
  }
}

// a link like /?owner=abc saves the code, then drops it from the address bar
export function takeOwnerCodeFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('owner')
  if (code === null) {
    return
  }

  saveOwnerCode(code)
  params.delete('owner')

  let cleanUrl = window.location.pathname
  const rest = params.toString()
  if (rest !== '') {
    cleanUrl = `${cleanUrl}?${rest}`
  }
  window.history.replaceState(null, '', cleanUrl)
}

// tapping the copyright line asks for the code, since a home screen app has no address bar
export function askForOwnerCode(): void {
  const current = readOwnerCode() ?? ''
  const answer = window.prompt('Owner code (leave empty to turn it off)', current)
  if (answer === null) {
    return
  }
  saveOwnerCode(answer)
  // routes already looked up this session came from the other source, so start fresh
  window.location.reload()
}
