function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function percentileRank(values, target) {
  if (!values.length) return 50;

  const sorted = [...values].sort((a, b) => a - b);

  const belowOrEqual = sorted.filter(
    value => value <= target
  ).length;

  return (belowOrEqual / sorted.length) * 100;
}

function calculateReturnDistribution(history) {
  const returns = [];

  for (let i = 1; i < history.length; i++) {
    const previousPrice = Number(history[i - 1].price);
    const currentPrice = Number(history[i].price);

    if (!previousPrice || !currentPrice) {
      continue;
    }

    returns.push(
      currentPrice / previousPrice - 1
    );
  }

  return returns;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;

  const mean =
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length;

  const variance =
    values.reduce(
      (sum, value) =>
        sum + Math.pow(value - mean, 2),
      0
    ) / (values.length - 1);

  return Math.sqrt(variance);
}

function calibrateVolatility(history) {
  const returns =
    calculateReturnDistribution(history);

  const windowSize = 5;

  if (returns.length < windowSize + 1) {
    return {
      currentDailyVolatility: 0,
      volatilityPercentile: 50,
      volatilityScore: 50
    };
  }

  const rollingVolatilities = [];

  for (
    let i = windowSize;
    i <= returns.length;
    i++
  ) {
    const window = returns.slice(
      i - windowSize,
      i
    );

    rollingVolatilities.push(
      standardDeviation(window)
    );
  }

  const currentDailyVolatility =
    rollingVolatilities[
      rollingVolatilities.length - 1
    ];

  const previousVolatilities =
    rollingVolatilities.slice(0, -1);

  const volatilityPercentile =
    percentileRank(
      previousVolatilities,
      currentDailyVolatility
    );

  let volatilityScore;

  if (volatilityPercentile <= 40) {
    volatilityScore = 60;
  } else if (volatilityPercentile <= 70) {
    volatilityScore = 55;
  } else if (volatilityPercentile <= 85) {
    volatilityScore = 45;
  } else {
    volatilityScore = 30;
  }

  return {
    currentDailyVolatility,
    volatilityPercentile,
    volatilityScore: clamp(volatilityScore)
  };
}

function calibrateVolume(history) {
  const volumes = history
    .map(item => Number(item.volume24h))
    .filter(
      value =>
        Number.isFinite(value) &&
        value > 0
    );

  if (volumes.length < 2) {
    return {
      currentVolume: 0,
      volumePercentile: 50,
      volumeScore: 50
    };
  }

  const currentVolume =
    volumes[volumes.length - 1];

  const previousVolumes =
    volumes.slice(0, -1);

  const volumePercentile =
    percentileRank(
      previousVolumes,
      currentVolume
    );

  let volumeScore;

  if (volumePercentile >= 80) {
    volumeScore = 70;
  } else if (volumePercentile >= 60) {
    volumeScore = 60;
  } else if (volumePercentile >= 40) {
    volumeScore = 50;
  } else if (volumePercentile >= 20) {
    volumeScore = 45;
  } else {
    volumeScore = 40;
  }

  return {
    currentVolume,
    volumePercentile,
    volumeScore: clamp(volumeScore)
  };
}

function calibrateTrend(history) {
  const returns =
    calculateReturnDistribution(history);

  if (!returns.length) {
    return {
      positiveRatio: 0.5,
      trendScore: 50
    };
  }

  const positiveDays =
    returns.filter(
      value => value > 0
    ).length;

  const positiveRatio =
    positiveDays / returns.length;

  const trendScore = clamp(
    50 + (positiveRatio - 0.5) * 100
  );

  return {
    positiveRatio,
    trendScore
  };
}

function calibrateBullBear(history) {
  if (
    !Array.isArray(history) ||
    history.length < 10
  ) {
    throw new Error(
      "At least 10 historical observations are required"
    );
  }

  return {
  observations: history.length,

  calibration: {
    volatility:
      calibrateVolatility(history),

    volume:
      calibrateVolume(history),

    trend:
      calibrateTrend(history)
  }
};
}

module.exports = {
  percentileRank,
  calculateReturnDistribution,
  standardDeviation,
  calibrateVolatility,
  calibrateVolume,
  calibrateTrend,
  calibrateBullBear
};
