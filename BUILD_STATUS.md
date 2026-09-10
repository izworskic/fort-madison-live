# Build status — Fort Madison Live

## Code status

- Next.js 16 / React 19 / MapLibre application shell: built.
- NOAA/NWS FMDI4 river provider: built.
- USACE LPMS Lock 18 / 19 named-tow provider: built.
- Southwest Chief #3 / #4 scheduled fallback: built.
- Optional live Amtrak provider contract: built.
- Licensed/partner freight observation provider contract: built.
- Train physical-identity normalization: built.
- Tow arrival + bridge-window conservative model: built.
- Rail/bridge convergence engine: built.
- Interactive geographic map: built; only observed provider coordinates become movement markers.
- Data-health/truth layer: built.
- SEO metadata, SSR copy, sitemap, robots, OG image, JSON-LD: built.
- GA4 bootstrap + initial/map events: built.
- Executable value/loss/release benchmark: built.
- CI workflow: built.

## Verification

`npm test`: 16 passing tests, 0 failing.

The executable benchmark intentionally reports SHADOW/BETA until real external validation gates pass. It must not be overridden merely to make the score green.

## External production gates

1. Contract and configure a licensed freight observation source (RailState is the preferred candidate).
2. Shadow-test at least 100 representative freight movements before publishing production-grade freight ETAs.
3. Accumulate/obtain Fort Madison bridge ground truth and calibrate the initial conservative tow-to-bridge travel distributions.
4. Confirm public/derived-data rights for any commercial rail or AIS provider before display.
5. Full `next build` must run in a dependency-enabled environment (Vercel/GitHub CI or local npm install). This working container cannot fetch npm packages.

## Truth rules

- No public BNSF GPS feed is assumed.
- No train gets a lead locomotive/direction that its source did not provide.
- Scheduled Amtrak events never receive fake observed map coordinates.
- LPMS named tow identity is observed; Fort Madison arrival and bridge windows are estimated.
- Window overlap is not represented as a dispatch order or confirmed train hold.
