const fs = require("fs");

const PERFORMANCE_FILE = "./data/bullbear_signal_performance.json";
const ACCURACY_HISTORY_FILE = "./data/bullbear_accuracy_history.json";

function readArray(path) {
  if (!fs.existsSync(path)) return [];
  const value = JSON.parse(fs.readFileSync(path, "utf8"));
  if (!Array.isArray(value)) throw new Error(`${path} must contain an array`);
  return value;
}

function metrics(records) {
  const scored = records.filter(r => ["correct", "incorrect"].includes(r.oneHour?.result));
  const correct = scored.filter(r => r.oneHour.result === "correct").length;
  return {
    total: scored.length,
    correct,
    incorrect: scored.length - correct,
    accuracy: scored.length
      ? Number(((correct / scored.length) * 100).toFixed(2))
      : null
  };
}

function buildSummary(records) {
  const completed = records.filter(r => r.status === "complete");
  const values = field => [...new Set(completed.map(r => r[field]).filter(Boolean))].sort();

  return {
    schemaVersion: 2,
    timestamp: new Date().toISOString(),
    totalSignals: records.length,
    status: {
      pending: records.filter(r => r.status === "pending").length,
      complete: completed.length,
      unavailable: records.filter(r => r.status === "unavailable").length
    },
    overall: metrics(completed),
    directional: metrics(completed.filter(r => r.direction !== "Neutral")),
    neutral: metrics(completed.filter(r => r.direction === "Neutral")),
    excludedFlat: completed.filter(r => r.oneHour?.result === "flat").length,
    byDirection: Object.fromEntries(
      values("direction").map(value => [value, metrics(completed.filter(r => r.direction === value))])
    ),
    byConfidence: Object.fromEntries(
      ["Low", "Medium", "High"].map(value => [value, metrics(completed.filter(r => r.confidence === value))])
    )
  };
}

function withoutTimestamp(value) {
  const copy = JSON.parse(JSON.stringify(value));
  delete copy.timestamp;
  return copy;
}

function saveAccuracyHistory(summary) {
  const history = readArray(ACCURACY_HISTORY_FILE);
  const latest = history.at(-1);
  if (latest && JSON.stringify(withoutTimestamp(latest)) === JSON.stringify(withoutTimestamp(summary))) {
    return false;
  }
  history.push(summary);
  fs.writeFileSync(ACCURACY_HISTORY_FILE, JSON.stringify(history, null, 2));
  return true;
}

function calculateAccuracy() {
  const summary = buildSummary(readArray(PERFORMANCE_FILE));
  const saved = saveAccuracyHistory(summary);
  console.log("BullBear Accuracy Summary");
  console.log("=========================");
  console.log(JSON.stringify(summary, null, 2));
  console.log(saved ? "Saved new accuracy snapshot" : "No outcome changes; snapshot skipped");
  return summary;
}

if (require.main === module) calculateAccuracy();

module.exports = { buildSummary, calculateAccuracy, metrics, saveAccuracyHistory };
