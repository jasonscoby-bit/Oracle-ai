const test = require("node:test");
const assert = require("node:assert/strict");
const {
  percentileRank,
  calculateReturnDistribution,
  standardDeviation,
  calibrateVolatility,
  calibrateVolume,
  calibrateTrend,
  calibrateBullBear
} = require("./bullbear_calibration");

const history = [
  { timestamp: "2026-10-01T00:00:00Z", price: 100, volume24h: 1000 },
  { timestamp: "2026-10-02T00:00:00Z", price: 101, volume24h: 1100 },
  { timestamp: "2026-10-03T00:00:00Z", price: 100, volume24h: 900 },
  { timestamp: "2026-10-04T00:00:00Z", price: 103, volume24h: 1300 },
  { timestamp: "2026-10-05T00:00:00Z", price: 104, volume24h: 1200 },
  { timestamp: "2026-10-06T00:00:00Z", price: 102, volume24h: 800 },
  { timestamp: "2026-10-07T00:00:00Z", price: 105, volume24h: 1500 },
  { timestamp: "2026-10-08T00:00:00Z", price: 106, volume24h: 1400 },
  { timestamp: "2026-10-09T00:00:00Z", price: 107, volume24h: 1600 },
  { timestamp: "2026-10-10T00:00:00Z", price: 108, volume24h: 1700 }
];

test("percentile rank handles empty, tied, and ordered samples", () => {
  assert.equal(percentileRank([], 10), 50);
  assert.equal(percentileRank([1, 2, 3, 4], 2), 50);
  assert.equal(percentileRank([1, 2, 3, 4], 4), 100);
});

test("return distribution calculates consecutive daily returns", () => {
  const returns = calculateReturnDistribution(history.slice(0, 3));
  assert.equal(returns.length, 2);
  assert.ok(Math.abs(returns[0] - 0.01) < 1e-12);
  assert.ok(Math.abs(returns[1] - (100 / 101 - 1)) < 1e-12);
});

test("standard deviation returns zero for fewer than two observations", () => {
  assert.equal(standardDeviation([]), 0);
  assert.equal(standardDeviation([0.1]), 0);
});

test("volume calibration returns a bounded score and percentile", () => {
  const result = calibrateVolume(history);
  assert.ok(result.volumeScore >= 0 && result.volumeScore <= 100);
  assert.ok(result.volumePercentile >= 0 && result.volumePercentile <= 100);
  assert.equal(calibrateVolume(history.slice(0, 1)).volumeScore, 50);
});

test("volatility calibration handles insufficient data and bounded scores", () => {
  assert.equal(calibrateVolatility(history.slice(0, 3)).volatilityScore, 50);
  const result = calibrateVolatility(history);
  assert.ok(result.volatilityScore >= 0 && result.volatilityScore <= 100);
  assert.ok(Number.isFinite(result.currentDailyVolatility));
});

test("trend calibration reflects positive-return frequency", () => {
  const result = calibrateTrend(history);
  assert.ok(result.positiveRatio > 0.5);
  assert.ok(result.trendScore > 50);
  assert.equal(calibrateTrend(history.slice(0, 1)).trendScore, 50);
});

test("full calibration requires at least ten observations", () => {
  assert.throws(() => calibrateBullBear(history.slice(0, 9)), /At least 10/);
  assert.equal(calibrateBullBear(history).observations, 10);
});
