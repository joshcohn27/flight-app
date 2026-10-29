# Flight Overhead

A phone web app that shows which plane is flying over you right now. It's built to be read out loud from the passenger seat: big text, no buttons, and it follows your location as you drive.

Live at [flight.joshbcohn.com](https://flight.joshbcohn.com). On an iPhone, open it in Safari and use Share, then Add to Home Screen.

## How it works

- Your location comes from the browser and updates as you move.
- Every 5 seconds the app asks `/api/nearby` for planes within 15 nautical miles (it pauses when the app is in the background).
- Only commercial airline flights are shown: an airline style callsign (like UAL1234) on an airliner type. Private planes, business jets, helicopters and military flights are left out.
- Regional flights show the brand passengers know, like "American Eagle 5441", with an "Operated by PSA Airlines" line under it. Major airlines get their logo.
- The plane closest to you in a straight line through the air (ground distance and altitude combined) is the main card, so low planes passing nearby win over cruisers far overhead. If it's 15 degrees or more above the horizon it's labeled "Overhead", otherwise "Nearest". The next 3 are listed below.
- With a FlightAware key set, routes come from FlightAware's AeroAPI, which knows the real flight in the air today. Without one, or if FlightAware fails, the app falls back to adsbdb.
- adsbdb's route data is stored per flight number and is often out of date, so one of its routes is only shown when the plane is actually between the two airports and, once it's away from them, heading toward the destination. Otherwise the route line is hidden and the airline and flight number still show.
- Routes come from `/api/route` and aircraft details (exact model, owner, photo) from `/api/aircraft`. Each is looked up once per plane per session, and failed lookups are retried after a minute.
- The background follows the local weather from `/api/weather`: blue sky when it's clear, clouds, rain, snow or fog when there's weather, and stars at night.
- The screen is kept awake with the Wake Lock API where it's supported.

## Running locally

You need Node 20+.

```sh
npm install
npm run dev
```

Then open http://localhost:5173. In dev, Vite answers the `/api` routes itself using the same handlers Vercel runs in production, so no Vercel CLI is needed. `vercel dev` works too if you want to match production exactly.

### FlightAware key (for accurate routes)

1. Make an AeroAPI account at https://www.flightaware.com/aeroapi/portal on the Personal tier and create an API key.
2. For local dev, copy `.env.example` to `.env.local` and put the key in it. `.env.local` is ignored by git.
3. On Vercel, add `FLIGHTAWARE_API_KEY` under Project Settings, Environment Variables, then redeploy.

Each new callsign costs one lookup. Vercel caches each one for 30 minutes and the app never asks twice in a session.

Other scripts:

- `npm run build` type checks everything (including `/api`) and builds to `dist`
- `npm run lint` runs ESLint

## Project layout

- `api/nearby.ts`: live planes near a point, from adsb.lol with adsb.fi as a fallback
- `api/route.ts`: airline and origin/destination for a callsign, from adsbdb, cached by Vercel for a few hours
- `api/aircraft.ts`: model, owner and photo for an airframe, from adsbdb, cached for a day
- `api/weather.ts`: current weather and day or night, from Open-Meteo, cached for ten minutes
- `src/overhead.ts`: distance, elevation angle, compass direction, and picking the main plane
- `src/format.ts`: turns plane data into the text on screen
- `src/aircraftTypes.ts`: airliner type codes and their friendly names, which also decide what counts as commercial
- `src/airlines.ts`: major airline logo codes and regional brands
- `src/weather.ts`: maps weather codes to the background sky
- `src/hooks/`: location, polling, route lookups, and wake lock

## Data sources

- [adsb.lol](https://adsb.lol): live aircraft positions
- [adsb.fi](https://adsb.fi): live aircraft positions (fallback)
- [FlightAware AeroAPI](https://www.flightaware.com/commercial/aeroapi/): live flight routes (optional, needs a key)
- [adsbdb](https://www.adsbdb.com): flight routes, airlines and aircraft details
- [Open-Meteo](https://open-meteo.com): current weather
- [airport-data.com](https://www.airport-data.com): aircraft photos, linked through adsbdb
- [avs.io](https://pics.avs.io): airline logos

All of them except FlightAware are free and need no API key. Attribution is shown in the app.

Airline names and logos are trademarks of their owners and are used only to identify flights. This project is not affiliated with or endorsed by any airline.

© 2026 Josh Cohn
