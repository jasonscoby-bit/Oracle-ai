const fs = require("fs");
const { getHistoricalPrice } = require("./cmc_performance_history");
const HISTORY_FILE = "./data/bullbear_signal_history.json";
const PERFORMANCE_FILE = "./data/bullbear_signal_performance.json";

function loadSignals() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
}

function loadPerformance() {
  if (!fs.existsSync(PERFORMANCE_FILE)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(PERFORMANCE_FILE, "utf8"));
}

function savePerformance(data) {
  fs.writeFileSync(
    PERFORMANCE_FILE,
    JSON.stringify(data, null, 2)
  );
}


  
async function calculatePerformance() {
  const signals = loadSignals();
  const existing = loadPerformance();

  const now = new Date();

  const results = [];

  for (const signal of signals) {
    const signalTime = new Date(signal.timestamp);
    const oneHourTarget = new Date(
      signalTime.getTime() + 60 * 60 * 1000
    );

    let record = existing.find(
      item => item.timestamp === signal.timestamp
    );

    if (record && !record.componentScores && signal.componentScores) {
  record.componentScores = signal.componentScores;
}

if (!record) {
  record = {
    timestamp: signal.timestamp,
    coin: signal.coin,
    priceAtSignal: signal.price,
    direction: signal.direction,
    confidence: signal.confidence,
    bullBearScore: signal.bullBearScore,
    componentScores: signal.componentScores,
    status: "pending"
  };
}

    if (
    (record.status === "pending" || record.oneHour?.result === "neutral") &&
    now >= oneHourTarget) {
 
      const historicalPrice = await getHistoricalPrice(
        oneHourTarget.toISOString()
      );

      if (historicalPrice) {
        const priceChange =
          (historicalPrice.price - signal.price) /
          signal.price;

        let result = "neutral";

  if (signal.direction.includes("Bullish")) {
  result =
    priceChange > 0 ? "correct" : "incorrect";
} else if (signal.direction.includes("Bearish")) {
  result =
    priceChange < 0 ? "correct" : "incorrect";
} else if (signal.direction === "Neutral") {
  result =
    Math.abs(priceChange) <= 0.01
      ? "correct"
      : "incorrect";
}
            record.oneHour = {
          targetTimestamp: oneHourTarget.toISOString(),
          actualTimestamp: historicalPrice.timestamp,
          price: historicalPrice.price,
          priceChangePercent: priceChange * 100,
          result
        };

        record.status = "complete";
      }
    }

    results.push(record);
  }

  savePerformance(results);

  console.log(`Performance records: ${results.length}`);
}

calculatePerformance().catch(error => {
  console.error(error);
  process.exit(1);
});
