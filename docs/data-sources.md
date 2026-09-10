# Data-source contract

## NOAA/NWS NWPS

`GET https://api.water.noaa.gov/nwps/v1/gauges/FMDI4/stageflow/observed`

No credential. Observations are provisional. The provider is cached for five minutes.

## USACE LPMS

Default queue endpoints:

- `https://corpslocks.usace.army.mil/lpwb/xml.lockqueue?in_river=MI&in_lock=18`
- `https://corpslocks.usace.army.mil/lpwb/xml.lockqueue?in_river=MI&in_lock=19`

Queue records can contain vessel name/number, direction, number of barges, arrival and end-of-lockage. Fort Madison ETA is **our estimate** from recent lock passage, never an official bridge time.

## Freight feed

Set `RAIL_FEED_URL`. The adapter accepts an array or `{ "trains": [...] }` / `{ "sightings": [...] }` containing any of:

```json
{
  "tripId": "provider-stable-trip-id",
  "carrier": "BNSF",
  "leadLocomotive": "8127",
  "direction": "westbound",
  "trainType": "Double-stack intermodal",
  "detectedAt": "2026-09-10T18:07:00Z",
  "sensorName": "Illinois corridor",
  "lat": 40.7,
  "lon": -91.0,
  "etaStart": "2026-09-10T18:16:00Z",
  "etaBest": "2026-09-10T18:19:00Z",
  "etaEnd": "2026-09-10T18:23:00Z"
}
```

The public tool should only configure this endpoint after contractual rights permit an ad-supported public display and derived predictions.

## Amtrak live override

Set `AMTRAK_LIVE_FEED_URL`. Accepted fields include `trainNumber`, `eta`/`estimatedArrival`, `location`, `lat`, `lon`, `observedAt`/`updatedAt`. If missing, the app uses the official published Southwest Chief #4 10:22 AM and #3 6:05 PM Fort Madison schedule and labels it `SCHEDULED`.

## AIS

Reserved in `.env.example`, not consumed until a licensed provider and schema are selected. LPMS remains the no-credential named-tow source.
