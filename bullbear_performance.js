const fs = require("fs");

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

function calculatePerformance() {
  const signals = loadSignals();
  const existing = loadPerformance();

  const results = signals.map(signal => ({
    timestamp: signal.timestamp,
    coin: signal.coin,
    priceAtSignal: signal.price,
    direction: signal.direction,
    confidence: signal.confidence,
    bullBearScore: signal.bullBearScore,
    status: "pending"
  }));

  savePerformance(results);

  console.log(`Performance records: ${results.length}`);
}

calculatePerformance();
