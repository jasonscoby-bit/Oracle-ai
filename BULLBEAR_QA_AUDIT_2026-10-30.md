# BullBear Quality Assurance Audit — 2026-10-30

## Scope and safety
Read-only review of the current `main` branch and the saved signal/performance JSON. No scoring weights, evaluator thresholds, historical records, or workflows were changed. This is a diagnostic snapshot, not investment advice or proof of predictive edge.

## Current dataset
- Signal history records: 262
- Performance records: 262
- Completed records: 262
- Duplicate signal IDs: 0
- Missing/invalid timestamps: 0
- Missing/non-finite BullBear scores: 0
- Scored one-hour outcomes: 252
- Correct: 175
- Incorrect: 77
- Binary accuracy on scored outcomes: 69.44%
- Flat outcomes excluded from binary accuracy: 10

All 262 records in the current sample are BTC. The engine currently explicitly rejects non-BTC symbols because historical analytics supports BTC only. Do not market this as multi-asset performance.

## Directional vs neutral results
| Signal class | Scored n | Correct | Incorrect | Accuracy |
|---|---:|---:|---:|---:|
| Neutral | 202 | 147 | 55 | 72.77% |
| Directional (bullish + bearish) | 50 | 28 | 22 | 56.00% |
| Slightly Bullish | 29 | 14 | 15 | 48.28% |
| Slightly Bearish | 21 | 14 | 7 | 66.67% |

The 69.44% aggregate is dominated by neutral calls (202 of 252 scored outcomes, 80.2%). Public reporting should always show neutral and directional performance separately, plus the flat/excluded count. Do not present the aggregate alone as evidence of directional forecasting skill.

## Score-band results
| Score band | n | Correct | Incorrect | Accuracy |
|---|---:|---:|---:|---:|
| 0–39 | 2 | 2 | 0 | 100.00% |
| 40–44 | 19 | 12 | 7 | 63.16% |
| 45–49 | 84 | 58 | 26 | 69.05% |
| 50–54 | 118 | 89 | 29 | 75.42% |
| 55–59 | 22 | 10 | 12 | 45.45% |
| 60–69 | 7 | 4 | 3 | 57.14% |
| 70–79 | 0 | 0 | 0 | Not enough observations |
| 80–100 | 0 | 0 | 0 | Not enough observations |

There are no observations in the 70+ bands. The 55–59 band has 22 outcomes and only 45.45% accuracy. Treat these as descriptive sample results, not stable estimates; avoid optimizing weights to these small groups.

## Component comparison
Mean component scores among records with numeric values:

| Component | Correct mean (n=172) | Incorrect mean (n=77) |
|---|---:|---:|
| Momentum | 50.61 | 50.02 |
| Volume | 43.38 | 45.32 |
| Short-term | 50.02 | 50.17 |
| Medium-term | 51.21 | 51.34 |
| Long-term | 57.06 | 54.88 |
| Volatility | 50.52 | 50.65 |
| Market direction | 52.69 | 51.86 |

These are univariate averages, not causal feature importance. They do not justify changing component weights. Component coverage is 249 records for these comparisons, three fewer than the 252 scored outcomes.

## Evaluator methodology
The current evaluator uses:
- Neutral: correct when absolute one-hour price change is at most 0.25%.
- Bullish/bearish: correct only when price moves in the predicted direction by more than 0.10%; moves within +/-0.10% are classified flat and excluded from binary accuracy.
- Historical price timestamp tolerance: at most 300 seconds.

This means neutral accuracy and directional accuracy answer different questions. Future reports should show coverage and flat outcomes alongside accuracy, and retain the exact evaluation rules and horizon.

## QA recommendations — next work
1. Preserve the existing scoring weights and evaluation thresholds while gathering more observations.
2. Add explicit per-class coverage and flat-rate reporting to any public performance summary.
3. Continue to label this dataset BTC-only until the signal collector and historical evaluator genuinely support additional assets.
4. Investigate why the score distribution is concentrated between 40 and 59 and why no high-confidence signals are present; do not force score inflation.
5. Add minimum-sample warnings to score-band reports (for example, suppress percentage claims for bands with fewer than 30 scored observations).
6. Improve component analysis output so missing component samples display N/A and sample counts rather than a misleading 0.00.
7. Run the existing unit-test workflows after any future code change and compare before/after outputs.

## Current conclusion
The pipeline is operating and its saved data has no duplicate IDs or invalid timestamps in this snapshot. The aggregate one-hour binary accuracy is 69.44%, but directional-only accuracy is 56.00%, based on just 50 scored directional signals. BullBear should remain in validation mode; this sample is not yet sufficient to claim a reliable trading edge or publish a headline accuracy figure without the full breakdown.
