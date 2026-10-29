import { useEffect, useState } from 'react'

type StaleNoteProps = {
  lastUpdated: number
}

// only shown while the connection is down, so ticking every second is fine
function StaleNote({ lastUpdated }: StaleNoteProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [])

  const seconds = Math.max(0, Math.round((now - lastUpdated) / 1000))

  return <p className="stale">No connection. Last updated {seconds} sec ago</p>
}

export default StaleNote
