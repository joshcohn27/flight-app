# Flight Overhead

A phone web app that shows which plane is flying over you right now. It's built to be read out loud from the passenger seat: big text, no buttons, and it follows your location as you drive.

Live at [flight.joshbcohn.com](https://flight.joshbcohn.com). On an iPhone, open it in Safari and use Share, then Add to Home Screen.

## How it works

- Your location comes from the browser and updates as you move.
- Every 5 seconds the app asks `/api/nearby` for planes within 15 nautical miles (it pauses when the app is in the background).
- The plane closest to you in a straight line through the air (ground distance and altitude combined) is the main card, so low planes passing nearby win over cruisers far overhead. If it's 15 degrees or more above the horizon it's labeled "Overhead", otherwise "Nearest". The next 3 are listed below.
- Routes come from `/api/route` and are looked up once per callsign per session.
- The screen is kept awake with the Wake Lock API where it's supported.

## Running locally

You need Node 20+.

```sh
npm install
npm run dev
```

Then open http://localhost:5173. In dev, Vite answers the `/api` routes itself using the same handlers Vercel runs in production, so no Vercel CLI is needed. `vercel dev` works too if you want to match production exactly.

Other scripts:

- `npm run build` type checks everything (including `/api`) and builds to `dist`
- `npm run lint` runs ESLint

## Project layout

- `api/nearby.ts`: live planes near a point, from adsb.lol with airplanes.live as a fallback
- `api/route.ts`: airline and origin/destination for a callsign, from adsbdb, cached by Vercel for a few hours
- `src/overhead.ts`: distance, elevation angle, compass direction, and picking the main plane
- `src/format.ts`: turns plane data into the text on screen
- `src/hooks/`: location, polling, route lookups, and wake lock

## Data sources

- [adsb.lol](https://adsb.lol): live aircraft positions
- [airplanes.live](https://airplanes.live): live aircraft positions (fallback)
- [adsbdb](https://www.adsbdb.com): flight routes and airlines

All three are free and need no API key. Attribution is shown in the app footer.
