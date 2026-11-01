# BullBear Quality Assurance Audit — 2026-11-01 (corrected evaluation)

## Scope
Investigated the low-performing 55–59 score band and historical evaluation logic. Corrected legacy completed outcomes in the saved performance dataset and updated the evaluator pipeline so completed records are reclassified under the current policy on every performance run. No model weights, score thresholds, signal history, or price data were changed.

## Root cause
Older completed records predated consistent flat-outcome handling. Some small directional price moves were stored as binary correct/incorrect even though the current evaluator defines moves within ±0.10% as flat. Example: a Slightly Bullish signal with a +0.0063% one-hour move had been marked correct. This inflated historical accuracy and distorted the score-band breakdown.

## Correction
- Re-evaluated all 271 completed records with a finite stored one-hour percentage change and a valid direction.
- Applied the existing policy consistently: directional correct only beyond ±0.10%; within ±0.10% is flat; Neutral correct within ±0.25%.
- Wrote the policy metadata onto each corrected evaluation.
- Added an idempotent migration step in `bullbear_performance.js` so old completed rows are corrected again on future scheduled runs.
- Preserved original signal data, target/actual timestamps, prices, and model weights.

## Corrected dataset
- Total signals: 271
- Completed: 271
- Binary-scored: 253
- Correct: 167
- Incorrect: 86
- Binary accuracy: 66.01%
- Flat/excluded: 18
- Directional: 24/44 (54.55%)
- Neutral: 143/209 (68.42%)

## Corrected score bands
| Score band | Scored n | Correct | Incorrect | Accuracy |
|---|---:|---:|---:|---:|
| 0–39 | 2 | 2 | 0 | 100.00% |
| 40–44 | 18 | 11 | 7 | 61.11% |
| 45–49 | 91 | 57 | 34 | 62.64% |
| 50–54 | 118 | 86 | 32 | 72.88% |
| 55–59 | 17 | 7 | 10 | 41.18% |
| 60–69 | 7 | 4 | 3 | 57.14% |
| 70–79 | 0 | 0 | 0 | No observations |
| 80–100 | 0 | 0 | 0 | No observations |

The 55–59 band remains weak after correction (7/17, 41.18%). It is entirely Slightly Bullish in this sample. This points to a directional signal-quality issue, not a score-band reporting defect. Sample size is still too small to justify changing weights.

## Interpretation and remaining limitations
- All 271 records are BTC; the project remains BTC-only.
- Directional performance is materially weaker than neutral performance and is based on a small sample.
- Neutral calls account for most scored records, so aggregate accuracy must not be presented as directional forecasting accuracy.
- No model-weight changes are recommended from this dataset.
- The updated performance workflow will write a fresh accuracy snapshot on its next scheduled run; the corrected history data has also been refreshed.

## Status
Historical outcomes corrected; future scheduled performance runs now apply the same evaluator policy to legacy and newly completed records. Continue validation before making any trading or public accuracy claims.
