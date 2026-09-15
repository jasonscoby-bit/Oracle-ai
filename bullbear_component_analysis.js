const fs = require("fs");

const PERFORMANCE_FILE =
  "./data/bullbear_performance_history.json";

function loadPerformance() {
  if (!fs.existsSync(PERFORMANCE_FILE)) {
    return [];
  }

  return JSON.parse(
    fs.readFileSync(PERFORMANCE_FILE, "utf8")
  );
}

function average(values) {
  if (values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function analyzeComponents() {
  const records = loadPerformance();

  const completed = records.filter(
    record =>
      record.status === "complete" &&
      record.oneHour &&
      record.oneHour.result
  );

  const correct = completed.filter(
    record => record.oneHour.result === "correct"
  );

  const incorrect = completed.filter(
    record => record.oneHour.result === "incorrect"
  );

  const components = [
    "momentum",
    "volume",
    "shortTerm",
    "mediumTerm",
    "longTerm",
    "volatility",
    "marketDirection"
  ];

  console.log("BullBear Component Analysis");
  console.log("===========================");
  console.log(`Completed signals: ${completed.length}`);
  console.log(`Correct: ${correct.length}`);
  console.log(`Incorrect: ${incorrect.length}`);
  console.log("");

  console.log("Average Component Scores");
  console.log("------------------------");

  for (const component of components) {
    const correctValues = correct
      .map(record => record.componentScores?.[component])
      .filter(value => typeof value === "number");

    const incorrectValues = incorrect
      .map(record => record.componentScores?.[component])
      .filter(value => typeof value === "number");

    console.log(
      `${component.padEnd(18)} ` +
      `Correct: ${average(correctValues).toFixed(2)}  ` +
      `Incorrect: ${average(incorrectValues).toFixed(2)}`
    );
  }
}

analyzeComponents();
