const { getCryptoQuote } = require("./cmc_api");

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreBullBear(data) {
  const momentum = Number(data.change24h) || 0;
  const shortTerm = Number(data.change1h) || 0;
  const mediumTerm = Number(data.change7d) || 0;
  const longTerm = Number(data.change30d) || 0;
  const volume = Number(data.volume24h) || 0;

  // Normalize momentum signals around a neutral midpoint of 50.
  const momentumScore = clamp(50 + momentum * 4);
  const shortTermScore = clamp(50 + shortTerm * 6);
  const mediumTermScore = clamp(50 + mediumTerm * 2);
  const longTermScore = clamp(50 + longTerm);

  // Volume is currently used as a confirmation signal.
  const volumeScore = volume > 0 ? 60 : 40;

  const score =
    momentumScore * 0.25 +
    volumeScore * 0.15 +
    shortTermScore * 0.20 +
    mediumTermScore * 0.20 +
    longTermScore * 0.10 +
    50 * 0.10;

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

  const distanceFromNeutral = Math.abs(bullBearScore - 50);

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
    lastUpdated: data.lastUpdated
  };
}

async function runBullBear(symbol = "BTC") {
  const marketData = await getCryptoQuote(symbol);
  return scoreBullBear(marketData);
}

module.exports = {
  scoreBullBear,
  runBullBear
};
