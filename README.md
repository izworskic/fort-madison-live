# Fort Madison Live

Real-time/near-real-time decision-support tool for the Fort Madison, Iowa Mississippi River swing bridge. It reconciles rail, commercial navigation, bridge-opening prediction, Amtrak, river conditions and navigation notices into one answer: **what happens next?**

## Truth model

The app never fabricates freight identities. Every value is labeled internally as OBSERVED, OFFICIAL, SCHEDULED, INFERRED, ESTIMATED, HISTORICAL or UNAVAILABLE.

## Live sources

- NOAA/NWS NWPS gauge `FMDI4` for observed river stage.
- USACE Corps Locks LPMS queue XML for Locks 18 and 19, yielding vessel name, direction, barge count and lockage timing.
- Official 2026 Southwest Chief schedule fallback for Amtrak #3/#4.
- Optional licensed/partner freight and live-Amtrak JSON feeds.
- USACE Rock Island District Notices to Navigation Interests.

## Development

```bash
npm install
npm test
npm run dev
```

## Deployment

Designed for Vercel. Set `NEXT_PUBLIC_SITE_URL` to the production domain. Optional providers are configured using `.env.example`. The page remains useful when one provider fails.

## Freight feed contract

See `docs/data-sources.md`. The normalized contract accepts actual carrier/locomotive/direction observations and train-trip continuity. RailState is the preferred commercial candidate, but the application is provider-independent.

## Release benchmark

`npm run benchmark` prints the current value score, loss, release score, and hard vetoes. The baseline intentionally remains `SHADOW/BETA` until a licensed freight provider, at least 100 representative freight movements, and calibrated tow/bridge outcomes satisfy the external production gates. Use these environment flags only after the corresponding evidence exists:

- `FREIGHT_PRODUCTION_VALIDATED=true`
- `FREIGHT_SHADOW_100_PASS=true`
- `TOW_MODEL_CALIBRATED=true`

`npm run benchmark:check` exits non-zero until every production gate passes.

## Analytics

Set `NEXT_PUBLIC_GA_ID` to enable GA4. The initial build emits `fort_madison_loaded` and `map_interaction`; additional event-detail and camera events can be added as those production integrations become available.
