import { skyFromCode } from '../weather'
import type { Sky } from '../weather'
import type { Weather } from '../types'

type SkyBackgroundProps = {
  weather: Weather | null
}

type CloudsProps = {
  count: number
}

// a seeded random so the stars land in the same spots every render
function seededRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return value / 2147483647
  }
}

const random = seededRandom(42)
const STARS = Array.from({ length: 120 }, () => ({
  x: random() * 400,
  y: random() * 800,
  radius: 0.4 + random() * 1.2,
  opacity: 0.3 + random() * 0.7,
}))

const CLOUDS = [
  { top: 4, left: -8, width: 230, duration: 70 },
  { top: 18, left: 55, width: 180, duration: 90 },
  { top: 38, left: 10, width: 260, duration: 80 },
  { top: 58, left: 60, width: 200, duration: 100 },
  { top: 72, left: -12, width: 240, duration: 85 },
  { top: 86, left: 45, width: 210, duration: 95 },
]

function Stars() {
  return (
    <svg className="stars" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      {STARS.map((star, index) => (
        <circle key={index} cx={star.x} cy={star.y} r={star.radius} opacity={star.opacity} />
      ))}
    </svg>
  )
}

function Clouds({ count }: CloudsProps) {
  return (
    <>
      {CLOUDS.slice(0, count).map((cloud, index) => (
        <svg
          key={index}
          className="cloud"
          viewBox="0 0 200 90"
          style={{
            top: `${cloud.top}%`,
            left: `${cloud.left}%`,
            width: cloud.width,
            animationDuration: `${cloud.duration}s`,
          }}
        >
          <ellipse cx="60" cy="60" rx="50" ry="28" />
          <ellipse cx="100" cy="42" rx="45" ry="38" />
          <ellipse cx="142" cy="58" rx="48" ry="30" />
          <rect x="30" y="56" width="142" height="32" rx="16" />
        </svg>
      ))}
    </>
  )
}

function cloudCount(sky: Sky): number {
  if (sky === 'partly-cloudy') {
    return 3
  }
  // rain and snow skies are already gray, extra clouds just cover the text
  if (sky === 'cloudy') {
    return 6
  }
  return 0
}

function SkyBackground({ weather }: SkyBackgroundProps) {
  if (weather === null) {
    return <div className="sky sky-default" aria-hidden="true" />
  }

  const sky = skyFromCode(weather.code)

  let time = 'night'
  if (weather.isDay) {
    time = 'day'
  }

  const clearish = sky === 'clear' || sky === 'partly-cloudy'
  const showStars = !weather.isDay && clearish
  const showRain = sky === 'rain' || sky === 'storm'
  const clouds = cloudCount(sky)

  return (
    <div className={`sky sky-${sky} ${time}`} aria-hidden="true">
      {showStars && <Stars />}
      {clouds > 0 && <Clouds count={clouds} />}
      {showRain && <div className="rain" />}
      {sky === 'snow' && <div className="snow" />}
      {sky === 'fog' && <div className="fog" />}
    </div>
  )
}

export default SkyBackground
