const fs = require("fs");

const PERFORMANCE_FILE =
  "./data/bullbear_signal_performance.json";

function loadPerformance() {
  if (!fs.existsSync(PERFORMANCE_FILE)) {
    return [];
  }

  return JSON.parse(
    fs.readFileSync(PERFORMANCE_FILE, "utf8")
  );
}

function calculateAccuracy() {
  const records = loadPerformance();

  const completed = records.filter(
    record => record.status === "complete"
  );

  const correct = completed.filter(
    record => record.oneHour?.result === "correct"
  );

  const incorrect = completed.filter(
    record => record.oneHour?.result === "incorrect"
  );

  const pending = records.filter(
    record => record.status === "pending"
  );

  const accuracy =
    completed.length > 0
      ? (correct.length / completed.length) * 100
      : 0;

  console.log("BullBear Accuracy Summary");
  console.log("=========================");
  console.log(`Total signals: ${records.length}`);
  console.log(`Completed: ${completed.length}`);
  console.log(`Correct: ${correct.length}`);
  console.log(`Incorrect: ${incorrect.length}`);
  console.log(`Pending: ${pending.length}`);
  console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
}

calculateAccuracy();
