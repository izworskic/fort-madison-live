# Release scorecard

| Dimension | Weight | Current gate |
|---|---:|---|
| Actual train identification | 15 | Provider adapter built; production feed required |
| Tow identification | 10 | LPMS Lock 18/19 adapters built |
| Train ETA | 10 | Amtrak schedule + freight provider ETA contract |
| Bridge ETA | 10 | Conservative lock-to-bridge model; calibration required |
| Cross-system prediction | 15 | Interval overlap engine built |
| Data truth/provenance | 15 | Built; no freight fabrication |
| Search opportunity | 10 | Metadata, SSR copy, sitemap, robots, JSON-LD |
| Repeat-visit value | 8 | 60s refresh + event lists; history storage not yet connected |
| Performance | 4 | Map client-only; secondary map lazy-loaded |
| Accessibility | 3 | Semantic sections, reduced motion, map labels |

## Hard production gates

1. Do not market freight as live until a licensed/authorized provider is configured.
2. Run at least 100 representative freight movements in shadow validation before claiming production-grade freight ETA accuracy.
3. Replace the conservative tow transit envelope with calibrated distributions as Fort Madison ground truth accumulates.
4. Never state a freight train is being held for the bridge unless directly observed; publish only interval overlap / likely interaction.
