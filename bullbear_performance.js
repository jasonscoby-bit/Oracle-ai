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
function printAccuracyBreakdown(results) {
  const completed = results.filter(
    record => record.status === "complete" && record.oneHour?.result
  );

  const confidenceStats = {
    High: { correct: 0, total: 0 },
    Medium: { correct: 0, total: 0 },
    Low: { correct: 0, total: 0 }
  };

  const directionStats = {};
  const scoreStats = {
  "0-34": { correct: 0, total: 0 },
  "35-44": { correct: 0, total: 0 },
  "45-54": { correct: 0, total: 0 },
  "55-64": { correct: 0, total: 0 },
  "65-100": { correct: 0, total: 0 }
};
  for (const record of completed) {
    const confidence = record.confidence;

    if (confidenceStats[confidence]) {
      confidenceStats[confidence].total++;

      if (record.oneHour.result === "correct") {
        confidenceStats[confidence].correct++;
      }
    }
const score = record.bullBearScore;

let scoreBand;

if (score <= 34) {
  scoreBand = "0-34";
} else if (score <= 44) {
  scoreBand = "35-44";
} else if (score <= 54) {
  scoreBand = "45-54";
} else if (score <= 64) {
  scoreBand = "55-64";
} else {
  scoreBand = "65-100";
}

scoreStats[scoreBand].total++;

if (record.oneHour.result === "correct") {
  scoreStats[scoreBand].correct++;
}
    const direction = record.direction;

    if (!directionStats[direction]) {
      directionStats[direction] = { correct: 0, total: 0 };
    }

    directionStats[direction].total++;

    if (record.oneHour.result === "correct") {
      directionStats[direction].correct++;
    }
  }

  console.log("\n===== BULLBEAR ACCURACY BREAKDOWN =====");

  console.log(`Completed signals: ${completed.length}`);

  console.log("\nBy Confidence:");

  for (const level of ["High", "Medium", "Low"]) {
    const stats = confidenceStats[level];

    const accuracy =
      stats.total > 0
        ? ((stats.correct / stats.total) * 100).toFixed(2)
        : "N/A";

    console.log(
      `${level}: ${stats.correct}/${stats.total} correct (${accuracy}%)`
    );
  }

  console.log("\nBy Direction:");

  for (const direction of Object.keys(directionStats)) {
    const stats = directionStats[direction];

    const accuracy =
      stats.total > 0
        ? ((stats.correct / stats.total) * 100).toFixed(2)
        : "N/A";

    console.log(
      `${direction}: ${stats.correct}/${stats.total} correct (${accuracy}%)`
    );
  }

 console.log("\nBy Score Band:");

for (const band of ["0-34", "35-44", "45-54", "55-64", "65-100"]) {
  const stats = scoreStats[band];

  const accuracy =
    stats.total > 0
      ? ((stats.correct / stats.total) * 100).toFixed(2)
      : "N/A";

  console.log(
    `${band}: ${stats.correct}/${stats.total} correct (${accuracy}%)`
  );
} 
  console.log("========================================\n");
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
  printAccuracyBreakdown(results);
  console.log(`Performance records: ${results.length}`);
}

calculatePerformance().catch(error => {
  console.error(error);
  process.exit(1);
});
