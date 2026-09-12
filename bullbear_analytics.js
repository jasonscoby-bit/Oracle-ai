function calculateReturns(history) {
  const returns = [];

  for (let i = 1; i < history.length; i++) {
    const previousPrice = Number(history[i - 1].price);
    const currentPrice = Number(history[i].price);

    if (!previousPrice || !currentPrice) {
      continue;
    }

    const dailyReturn = currentPrice / previousPrice - 1;
    returns.push(dailyReturn);
  }

  return returns;
}

function calculateMean(values) {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStandardDeviation(values) {
  if (values.length < 2) return 0;

  const mean = calculateMean(values);

  const variance =
    values.reduce((sum, value) => {
      return sum + Math.pow(value - mean, 2);
    }, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

function calculateVolatility(history) {
  const returns = calculateReturns(history);

  const dailyVolatility = calculateStandardDeviation(returns);

  // Annualized realized volatility.
  const annualizedVolatility =
    dailyVolatility * Math.sqrt(365);

  return {
    dailyVolatility,
    annualizedVolatility
  };
}

function calculateVolumeStrength(history) {
  if (!history.length) {
    return {
      latestVolume: 0,
      averageVolume: 0,
      volumeRatio: 0
    };
  }

  const volumes = history
    .map(item => Number(item.volume24h))
    .filter(volume => Number.isFinite(volume) && volume > 0);

  if (!volumes.length) {
    return {
      latestVolume: 0,
      averageVolume: 0,
      volumeRatio: 0
    };
  }

  const latestVolume = volumes[volumes.length - 1];

  const averageVolume = calculateMean(volumes);

  const volumeRatio =
    averageVolume > 0
      ? latestVolume / averageVolume
      : 0;

  return {
    latestVolume,
    averageVolume,
    volumeRatio
  };
}

function calculateTrendConsistency(history) {
  const returns = calculateReturns(history);

  if (!returns.length) {
    return {
      positiveDays: 0,
      negativeDays: 0,
      positiveRatio: 0,
      negativeRatio: 0
    };
  }

  const positiveDays = returns.filter(value => value > 0).length;
  const negativeDays = returns.filter(value => value < 0).length;

  return {
    positiveDays,
    negativeDays,
    positiveRatio: positiveDays / returns.length,
    negativeRatio: negativeDays / returns.length
  };
}

function analyzeBullBearHistory(history) {
  if (!Array.isArray(history) || history.length < 2) {
    throw new Error(
      "At least 2 historical observations are required"
    );
  }

  const volatility = calculateVolatility(history);
  const volume = calculateVolumeStrength(history);
  const trend = calculateTrendConsistency(history);

  return {
    observations: history.length,

    volatility,

    volume,

    trend,

    latestPrice: Number(
      history[history.length - 1].price
    ),

    oldestPrice: Number(
      history[0].price
    )
  };
}

module.exports = {
  calculateReturns,
  calculateMean,
  calculateStandardDeviation,
  calculateVolatility,
  calculateVolumeStrength,
  calculateTrendConsistency,
  analyzeBullBearHistory
};
