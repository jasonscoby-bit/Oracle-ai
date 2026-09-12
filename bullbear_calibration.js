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
    const previous = Number(history[i - 1].price);
    const current = Number(history[i].price);

    if (!previous || !current) continue;

    returns.push(current / previous - 1);
  }

  return returns;
}

function calibrateVolatility(history) {
  const returns = calculateReturnDistribution(history);

  if (!returns.length) {
    return {
      currentDailyVolatility: 0,
      volatilityPercentile: 50,
      volatilityScore: 50
    };
  }

  const mean =
    returns.reduce((sum, value) => sum + value, 0) /
    returns.length;

  const variance =
    returns.reduce(
      (sum, value) =>
        sum + Math.pow(value - mean, 2),
      0
    ) / Math.max(returns.length - 1, 1);

  const currentDailyVolatility = Math.sqrt(variance);

  const rollingVolatilities = [];

  for (let i = 5; i <= returns.length; i++) {
    const window = returns.slice(i - 5, i);

    const windowMean =
      window.reduce((sum, value) => sum + value, 0) /
      window.length;

    const windowVariance =
      window.reduce(
        (sum, value) =>
          sum + Math.pow(value - windowMean, 2),
        0
      ) / Math.max(window.length - 1, 1);

    rollingVolatilities.push(
      Math.sqrt(windowVariance)
    );
  }

  const volatilityPercentile = percentileRank(
    rollingVolatilities,
    currentDailyVolatility
  );

  // Moderate volatility is preferred.
  // Extremely high volatility lowers the score.
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
      value => Number.isFinite(value) && value > 0
    );

  if (!volumes.length) {
    return {
      currentVolume: 0,
      volumePercentile: 50,
      volumeScore: 50
    };
  }

  const currentVolume =
    volumes[volumes.length - 1];

  const volumePercentile = percentileRank(
    volumes,
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
  const returns = calculateReturnDistribution(history);

  if (!returns.length) {
    return {
      positiveRatio: 0.5,
      trendScore: 50
    };
  }

  const positiveDays =
    returns.filter(value => value > 0).length;

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
  if (!Array.isArray(history) || history.length < 10) {
    throw new Error(
      "At least 10 historical observations are required"
    );
  }

  return {
    observations: history.length,
    volatility: calibrateVolatility(history),
    volume: calibrateVolume(history),
    trend: calibrateTrend(history)
  };
}

module.exports = {
  percentileRank,
  calculateReturnDistribution,
  calibrateVolatility,
  calibrateVolume,
  calibrateTrend,
  calibrateBullBear
};
}

function calibrateVolume(history) {
  const volumes = history
    .map(item => Number(item.volume24h))
    .filter(
      value => Number.isFinite(value) && value > 0
    );

  if (!volumes.length) {
    return {
      currentVolume: 0,
      volumePercentile: 50,
      volumeScore: 50
    };
  }

  const currentVolume =
    volumes[volumes.length - 1];

  const volumePercentile = percentileRank(
    volumes,
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
  const returns = calculateReturnDistribution(history);

  if (!returns.length) {
    return {
      positiveRatio: 0.5,
      trendScore: 50
    };
  }

  const positiveDays =
    returns.filter(value => value > 0).length;

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
  if (!Array.isArray(history) || history.length < 10) {
    throw new Error(
      "At least 10 historical observations are required"
    );
  }

  return {
    observations: history.length,
    volatility: calibrateVolatility(history),
    volume: calibrateVolume(history),
    trend: calibrateTrend(history)
  };
}

module.exports = {
  percentileRank,
  calculateReturnDistribution,
  calibrateVolatility,
  calibrateVolume,
  calibrateTrend,
  calibrateBullBear
};
