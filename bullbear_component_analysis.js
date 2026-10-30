const fs = require("fs");

const PERFORMANCE_FILE = "./data/bullbear_signal_performance.json";
const COMPONENTS = ["momentum", "volume", "shortTerm", "mediumTerm", "longTerm", "volatility", "marketDirection"];

function loadPerformance() {
  if (!fs.existsSync(PERFORMANCE_FILE)) return [];
  return JSON.parse(fs.readFileSync(PERFORMANCE_FILE, "utf8"));
}

// Return null rather than a misleading zero when no observations exist.
function average(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(values) {
  const result = average(values);
  return result === null ? "N/A (n=0)" : result.toFixed(2) + " (n=" + values.length + ")";
}

function analyzeComponents(records = loadPerformance(), log = console.log) {
  const completed = records.filter(record =>
    record.status === "complete" &&
    ["correct", "incorrect"].includes(record.oneHour?.result)
  );

  function report(label, group) {
    const correct = group.filter(record => record.oneHour.result === "correct");
    const incorrect = group.filter(record => record.oneHour.result === "incorrect");
    log("\\n" + label);
    log("Signals: " + group.length + " | Correct: " + correct.length + " | Incorrect: " + incorrect.length);
    for (const component of COMPONENTS) {
      const correctValues = correct.map(record => record.componentScores?.[component]).filter(value => typeof value === "number" && Number.isFinite(value));
      const incorrectValues = incorrect.map(record => record.componentScores?.[component]).filter(value => typeof value === "number" && Number.isFinite(value));
      log(component.padEnd(18) + " Correct: " + formatAverage(correctValues) + "  Incorrect: " + formatAverage(incorrectValues));
    }
  }

  log("BullBear Component Analysis");
  log("Completed scored signals: " + completed.length);
  report("Overall Component Analysis", completed);
  const directional = completed.filter(record => record.direction && record.direction !== "Neutral");
  report("Directional Component Analysis", directional);
}

if (require.main === module) analyzeComponents();
module.exports = { analyzeComponents, average, formatAverage, COMPONENTS };
