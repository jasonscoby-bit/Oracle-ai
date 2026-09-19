const DEFAULT_EVALUATION_CONFIG = Object.freeze({
  directionalThresholdPercent: 0.1,
  neutralThresholdPercent: 0.25,
  maxPriceSkewSeconds: 300
});

function finiteNumber(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function configWithDefaults(config = {}) {
  const merged = { ...DEFAULT_EVALUATION_CONFIG, ...config };
  for (const key of Object.keys(DEFAULT_EVALUATION_CONFIG)) {
    merged[key] = finiteNumber(merged[key], key);
    if (merged[key] < 0) throw new Error(`${key} cannot be negative`);
  }
  return merged;
}

function evaluateDirection({ direction, priceChangePercent, config }) {
  const change = finiteNumber(priceChangePercent, "priceChangePercent");
  const policy = configWithDefaults(config);

  if (direction === "Neutral") {
    return Math.abs(change) <= policy.neutralThresholdPercent
      ? "correct"
      : "incorrect";
  }

  if (direction?.includes("Bullish")) {
    if (change > policy.directionalThresholdPercent) return "correct";
    if (change < -policy.directionalThresholdPercent) return "incorrect";
    return "flat";
  }

  if (direction?.includes("Bearish")) {
    if (change < -policy.directionalThresholdPercent) return "correct";
    if (change > policy.directionalThresholdPercent) return "incorrect";
    return "flat";
  }

  throw new Error(`Unsupported BullBear direction: ${direction}`);
}

function validateEvaluationPrice({ targetTimestamp, actualTimestamp, config }) {
  const target = new Date(targetTimestamp);
  const actual = new Date(actualTimestamp);
  if (Number.isNaN(target.getTime()) || Number.isNaN(actual.getTime())) {
    throw new Error("Evaluation timestamps must be valid dates");
  }

  const policy = configWithDefaults(config);
  const skewSeconds = Math.abs(actual - target) / 1000;
  return {
    valid: skewSeconds <= policy.maxPriceSkewSeconds,
    skewSeconds
  };
}

module.exports = {
  DEFAULT_EVALUATION_CONFIG,
  evaluateDirection,
  validateEvaluationPrice
};
