const fs = require("fs");
const { getHistoricalPrice } = require("./cmc_performance_history");
const {
  DEFAULT_EVALUATION_CONFIG,
  evaluateDirection,
  validateEvaluationPrice
} = require("./bullbear_evaluator");

const HISTORY_FILE = "./data/bullbear_signal_history.json";
const PERFORMANCE_FILE = "./data/bullbear_signal_performance.json";

function readArray(path) {
  if (!fs.existsSync(path)) return [];
  const value = JSON.parse(fs.readFileSync(path, "utf8"));
  if (!Array.isArray(value)) throw new Error(`${path} must contain an array`);
  return value;
}

function signalId(signal) {
  return signal.id || `${signal.coin}:${signal.timestamp}`;
}

function deduplicateSignals(signals) {
  const seen = new Set();
  const unique = [];
  const duplicateIds = [];

  for (const signal of signals) {
    const id = signalId(signal);
    if (seen.has(id)) {
      duplicateIds.push(id);
      continue;
    }
    seen.add(id);
    unique.push(signal);
  }

  return { signals: unique, duplicateIds };
}

function safeEvaluationTiming(targetTimestamp, actualTimestamp) {
  try {
    return validateEvaluationPrice({ targetTimestamp, actualTimestamp });
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

function isCompletedEvaluation(record) {
  return record?.status === "complete";
}

function printAccuracyBreakdown(records) {
  const completed = records.filter(r => r.status === "complete");
  const scored = completed.filter(r => ["correct", "incorrect"].includes(r.oneHour?.result));
  const groups = {
    "Overall scored": scored,
    "Directional only": scored.filter(r => typeof r.direction === "string" && r.direction !== "Neutral"),
    "Neutral only": scored.filter(r => r.direction === "Neutral")
  };

  console.log("\n===== BULLBEAR ACCURACY BREAKDOWN =====");
  for (const [label, group] of Object.entries(groups)) {
    const correct = group.filter(r => r.oneHour.result === "correct").length;
    const accuracy = group.length
      ? `${((correct / group.length) * 100).toFixed(2)}%`
      : "N/A";
    console.log(`${label}: ${correct}/${group.length} (${accuracy})`);
  }
  console.log(`Flat/excluded: ${completed.filter(r => r.oneHour?.result === "flat").length}`);
  console.log(`Unavailable: ${records.filter(r => r.status === "unavailable").length}`);
  console.log("========================================\n");
}

async function calculatePerformance() {
  const rawSignals = readArray(HISTORY_FILE);
  const { signals, duplicateIds } = deduplicateSignals(rawSignals);
  if (duplicateIds.length) {
    console.warn(`Skipped ${duplicateIds.length} duplicate signal record(s): ${[...new Set(duplicateIds)].join(", ")}`);
  }
  const existing = readArray(PERFORMANCE_FILE);
  const existingById = new Map(
    existing.map(record => [record.id || `${record.coin}:${record.timestamp}`, record])
  );
  const now = new Date();
  const results = [];

  for (const signal of signals) {
    const id = signalId(signal);
    const signalTime = new Date(signal.timestamp);
    if (Number.isNaN(signalTime.getTime())) throw new Error(`Invalid timestamp for ${id}`);

    const target = new Date(signalTime.getTime() + 60 * 60 * 1000);
    let record = existingById.get(id) || {
      id,
      timestamp: signal.timestamp,
      coin: signal.coin,
      priceAtSignal: signal.price,
      direction: signal.direction,
      confidence: signal.confidence,
      bullBearScore: signal.bullBearScore,
      componentScores: signal.componentScores,
      eligibleAt: target.toISOString(),
      status: "pending"
    };

    // Completed evaluations are immutable: later hourly runs must not
    // re-fetch prices or rewrite the result for the same signal ID.
    if (isCompletedEvaluation(record)) {
      results.push(record);
      continue;
    }

    if (!record.componentScores && signal.componentScores) {
      record.componentScores = signal.componentScores;
    }
    if (record.status === "complete" && record.evaluationError) {
      delete record.evaluationError;
    }
    if ((record.status === "pending" || record.status === "unavailable") && now >= target) {
      let historical;
      try {
        historical = await getHistoricalPrice(target.toISOString(), record.coin);
      } catch (error) {
        // A transient API/network failure for one signal should not discard
        // all other performance updates. Unavailable records are retried on
        // the next scheduled run.
        record.status = "unavailable";
        record.evaluationError = `Historical price lookup failed: ${error.message}`;
        results.push(record);
        console.error(`Historical price lookup failed for ${id}: ${error.message}`);
        continue;
      }

      if (!historical) {
        record.status = "unavailable";
        record.evaluationError = "No historical price returned";
      } else {
        const timing = safeEvaluationTiming(target.toISOString(), historical.timestamp);
        if (timing.error) {
          record.status = "unavailable";
          record.evaluationError = `Invalid historical price timestamp: ${timing.error}`;
          results.push(record);
          console.error(`Invalid historical timestamp for ${id}: ${timing.error}`);
          continue;
        }

        const startPrice = Number(signal.price);
        const endPrice = Number(historical.price);

        if (!timing.valid) {
          record.status = "unavailable";
          record.evaluationError = "Historical price exceeded maximum timestamp skew";
        } else if (!Number.isFinite(startPrice) || startPrice <= 0 || !Number.isFinite(endPrice) || endPrice <= 0) {
          record.status = "unavailable";
          record.evaluationError = "Invalid price data";
        } else {
          const priceChangePercent = ((endPrice - startPrice) / startPrice) * 100;
          record.oneHour = {
            targetTimestamp: target.toISOString(),
            actualTimestamp: historical.timestamp,
            skewSeconds: timing.skewSeconds,
            price: endPrice,
            priceChangePercent,
            result: evaluateDirection({ direction: signal.direction, priceChangePercent }),
            policy: { ...DEFAULT_EVALUATION_CONFIG }
          };
          delete record.evaluationError;
          record.status = "complete";
        }
      }
    }

    results.push(record);
  }

  fs.writeFileSync(PERFORMANCE_FILE, JSON.stringify(results, null, 2));
  printAccuracyBreakdown(results);
  console.log(`Performance records: ${results.length} (history rows: ${rawSignals.length}; duplicates skipped: ${duplicateIds.length})`);
}

if (require.main === module) {
  calculatePerformance().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { calculatePerformance, printAccuracyBreakdown, signalId, safeEvaluationTiming, deduplicateSignals, isCompletedEvaluation };
