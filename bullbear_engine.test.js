const assert = require("node:assert/strict");
const test = require("node:test");
const { scoreBullBear } = require("./bullbear_engine");

const marketData = {
  symbol: "BTC",
  name: "Bitcoin",
  price: 80000,
  change1h: 0.5,
  change24h: -0.2,
  change7d: -1.5,
  change30d: -4,
  marketCap: 1,
  volume24h: 1,
  lastUpdated: "2026-10-27T12:00:00.000Z"
};

const analytics = {
  volume: { volumeRatio: 0.45 },
  volatility: { dailyVolatility: 0.013, annualizedVolatility: 0.25 },
  trend: { positiveDays: 13, negativeDays: 16, positiveRatio: 13 / 29 }
};

function calibration(volumeScore) {
  return {
    volume: { volumeScore, volumePercentile: 20 },
    volatility: { volatilityScore: 55, volatilityPercentile: 60 },
    trend: { trendScore: 45 }
  };
}

test("volume component uses calibrated historical volume score", () => {
  const result = scoreBullBear(marketData, analytics, calibration(40));
  assert.equal(result.componentScores.volume, 40);
  assert.notEqual(result.componentScores.volume, 0);
});

test("higher calibrated volume score increases BullBear score", () => {
  const low = scoreBullBear(marketData, analytics, calibration(40));
  const high = scoreBullBear(marketData, analytics, calibration(70));
  assert.ok(high.bullBearScore > low.bullBearScore);
});

test("component scores and total score remain within 0–100", () => {
  const result = scoreBullBear(marketData, analytics, calibration(70));
  assert.ok(result.bullBearScore >= 0 && result.bullBearScore <= 100);
  for (const score of Object.values(result.componentScores)) {
    assert.ok(score >= 0 && score <= 100);
  }
});
