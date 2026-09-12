const { getCryptoQuote } = require("./cmc_api");
const { getHistoricalBTC } = require("./cmc_history");
const { analyzeBullBearHistory } = require("./bullbear_analytics");

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreBullBear(data, analytics) {
  const momentum = Number(data.change24h) || 0;
  const shortTerm = Number(data.change1h) || 0;
  const mediumTerm = Number(data.change7d) || 0;
  const longTerm = Number(data.change30d) || 0;

  // Price momentum
  const momentumScore = clamp(50 + momentum * 4);

  // Short-term trend
  const shortTermScore = clamp(50 + shortTerm * 6);

  // Medium-term trend
  const mediumTermScore = clamp(50 + mediumTerm * 2);

  // Long-term trend
  const longTermScore = clamp(50 + longTerm);

  // Historical volume strength
  const volumeRatio = analytics.volume.volumeRatio || 1;
  const volumeScore = clamp(50 + (volumeRatio - 1) * 100);

  // Historical volatility.
  // Around 2% daily volatility is treated as neutral.
  // Higher volatility reduces the score because it represents
  // greater uncertainty/risk.
  const dailyVolatility =
    analytics.volatility.dailyVolatility || 0;

  const volatilityScore = clamp(
    50 - ((dailyVolatility - 0.02) * 1000)
  );

  // Historical market direction based on the percentage
  // of positive daily returns.
  const marketDirectionScore = clamp(
    analytics.trend.positiveRatio * 100
  );

  const score =
    momentumScore * 0.25 +
    volumeScore * 0.15 +
    shortTermScore * 0.20 +
    mediumTermScore * 0.20 +
    volatilityScore * 0.10 +
    marketDirectionScore * 0.10;

  const bullBearScore = Math.round(clamp(score));

  let direction;

  if (bullBearScore >= 80) {
    direction = "Strong Bullish";
  } else if (bullBearScore >= 65) {
    direction = "Bullish";
  } else if (bullBearScore >= 55) {
    direction = "Slightly Bullish";
  } else if (bullBearScore >= 45) {
    direction = "Neutral";
  } else if (bullBearScore >= 35) {
    direction = "Slightly Bearish";
  } else if (bullBearScore >= 20) {
    direction = "Bearish";
  } else {
    direction = "Strong Bearish";
  }

  const distanceFromNeutral =
    Math.abs(bullBearScore - 50);

  let confidence;

  if (distanceFromNeutral >= 25) {
    confidence = "High";
  } else if (distanceFromNeutral >= 12) {
    confidence = "Medium";
  } else {
    confidence = "Low";
  }

  const factors = [];

  if (momentum > 0) {
    factors.push("Positive 24h price momentum");
  } else if (momentum < 0) {
    factors.push("Negative 24h price momentum");
  }

  if (shortTerm > 0) {
    factors.push("Positive short-term trend");
  } else if (shortTerm < 0) {
    factors.push("Negative short-term trend");
  }

  if (mediumTerm > 0) {
    factors.push("Positive 7-day trend");
  } else if (mediumTerm < 0) {
    factors.push("Negative 7-day trend");
  }

  if (longTerm > 0) {
    factors.push("Positive 30-day trend");
  } else if (longTerm < 0) {
    factors.push("Negative 30-day trend");
  }

  if (volumeRatio > 1.1) {
    factors.push("Above-average trading volume");
  } else if (volumeRatio < 0.9) {
    factors.push("Below-average trading volume");
  } else {
    factors.push("Normal trading volume");
  }

  if (dailyVolatility > 0.03) {
    factors.push("Elevated market volatility");
  } else if (dailyVolatility < 0.015) {
    factors.push("Lower market volatility");
  } else {
    factors.push("Moderate market volatility");
  }

  return {
    coin: data.symbol,
    name: data.name,
    price: data.price,

    bullBearScore,
    direction,
    confidence,

    factors,

    marketCap: data.marketCap,
    volume24h: data.volume24h,

    change1h: data.change1h,
    change24h: data.change24h,
    change7d: data.change7d,
    change30d: data.change30d,

    historicalVolumeRatio: volumeRatio,
    dailyVolatility,
    annualizedVolatility:
      analytics.volatility.annualizedVolatility,

    positiveDays: analytics.trend.positiveDays,
    negativeDays: analytics.trend.negativeDays,
    positiveRatio: analytics.trend.positiveRatio,

    lastUpdated: data.lastUpdated
  };
}

async function runBullBear(symbol = "BTC") {
  const marketData = await getCryptoQuote(symbol);

  if (symbol !== "BTC") {
    throw new Error(
      "Historical analytics currently supports BTC only"
    );
  }

  const history = await getHistoricalBTC(30);

  const analytics =
    analyzeBullBearHistory(history);

  return scoreBullBear(
    marketData,
    analytics
  );
}

module.exports = {
  scoreBullBear,
  runBullBear
};
