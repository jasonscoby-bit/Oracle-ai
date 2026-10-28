const fs = require("fs");

const PERFORMANCE_FILE = "./data/bullbear_signal_performance.json";

function loadPerformance() {
  if (!fs.existsSync(PERFORMANCE_FILE)) return [];
  return JSON.parse(fs.readFileSync(PERFORMANCE_FILE, "utf8"));
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzeComponents() {
  const records = loadPerformance();
  const completed = records.filter(record => record.status === "complete" && ["correct", "incorrect"].includes(record.oneHour?.result));
  const components = ["momentum", "volume", "shortTerm", "mediumTerm", "longTerm", "volatility", "marketDirection"];

  function report(label, group) {
    const correct = group.filter(record => record.oneHour.result === "correct");
    const incorrect = group.filter(record => record.oneHour.result === "incorrect");
    console.log(`\n${label}`);
    console.log(`Signals: ${group.length} | Correct: ${correct.length} | Incorrect: ${incorrect.length}`);
    for (const component of components) {
      const correctValues = correct.map(record => record.componentScores?.[component]).filter(value => typeof value === "number" && Number.isFinite(value));
      const incorrectValues = incorrect.map(record => record.componentScores?.[component]).filter(value => typeof value === "number" && Number.isFinite(value));
      console.log(`${component.padEnd(18)} Correct: ${average(correctValues).toFixed(2)}  Incorrect: ${average(incorrectValues).toFixed(2)}`);
    }
  }

  console.log("BullBear Component Analysis");
  console.log(`Completed scored signals: ${completed.length}`);
  report("Overall Component Analysis", completed);
  const directional = completed.filter(record => record.direction && record.direction !== "Neutral");
  report("Directional Component Analysis", directional);
}

if (require.main === module) analyzeComponents();
module.exports = { analyzeComponents, average };
