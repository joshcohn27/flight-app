import { useState } from 'react'

type AirlineLogoProps = {
  code: string
  size: 'large' | 'small'
}

// give it key={code} so a new airline gets a fresh try at loading
function AirlineLogo({ code, size }: AirlineLogoProps) {
  const [failed, setFailed] = useState(false)

  // no logo is better than a broken image
  if (failed) {
    return null
  }

  return (
    <span className={`logo logo-${size}`}>
      <img
        src={`https://pics.avs.io/400/160/${code}.png`}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => {
          setFailed(true)
        }}
      />
    </span>
  )
}

export default AirlineLogo
