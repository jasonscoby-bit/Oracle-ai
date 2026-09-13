const fs = require("fs");

const PERFORMANCE_FILE =
  "./data/bullbear_signal_performance.json";
const ACCURACY_HISTORY_FILE =
  "./data/bullbear_accuracy_history.json";
function loadPerformance() {
  if (!fs.existsSync(PERFORMANCE_FILE)) {
    return [];
  }

  return JSON.parse(
    fs.readFileSync(PERFORMANCE_FILE, "utf8")
  );
}
function saveAccuracyHistory(summary) {
  let history = [];

  if (fs.existsSync(ACCURACY_HISTORY_FILE)) {
    history = JSON.parse(
      fs.readFileSync(ACCURACY_HISTORY_FILE, "utf8")
    );
  }

  history.push(summary);

  fs.writeFileSync(
    ACCURACY_HISTORY_FILE,
    JSON.stringify(history, null, 2)
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
  const bullish = completed.filter(
    record => record.direction === "Bullish"
  );

  const bearish = completed.filter(
    record => record.direction === "Bearish"
  );

  const neutral = completed.filter(
    record => record.direction === "Neutral"
  );
    const lowConfidence = completed.filter(
    record => record.confidence === "Low"
  );

  const mediumConfidence = completed.filter(
    record => record.confidence === "Medium"
  );

  const highConfidence = completed.filter(
    record => record.confidence === "High"
  );
    const lowConfidenceCorrect = lowConfidence.filter(
    record => record.oneHour?.result === "correct"
  );

  const mediumConfidenceCorrect = mediumConfidence.filter(
    record => record.oneHour?.result === "correct"
  );

  const highConfidenceCorrect = highConfidence.filter(
    record => record.oneHour?.result === "correct"
  );
  const accuracy =
    completed.length > 0
      ? (correct.length / completed.length) * 100
      : 0;
    const bullishCorrect = bullish.filter(
    record => record.oneHour?.result === "correct"
  );

  const bearishCorrect = bearish.filter(
    record => record.oneHour?.result === "correct"
  );

  const neutralCorrect = neutral.filter(
    record => record.oneHour?.result === "correct"
  );
  const summary = {
    timestamp: new Date().toISOString(),
    totalSignals: records.length,
    completed: completed.length,
    correct: correct.length,
    incorrect: incorrect.length,
    pending: pending.length,
      accuracy: Number(accuracy.toFixed(2)),
    bullish: {
    total: bullish.length,
    correct: bullishCorrect.length,
    accuracy: bullish.length > 0
      ? Number((bullishCorrect.length / bullish.length * 100).toFixed(2))
      : 0
    },
    bearish: {
  total: bearish.length,
  correct: bearishCorrect.length,
  accuracy: bearish.length > 0
    ? Number((bearishCorrect.length / bearish.length * 100).toFixed(2))
    : 0
},
  neutral: {
  total: neutral.length,
  correct: neutralCorrect.length,
  accuracy: neutral.length > 0
    ? Number((neutralCorrect.length / neutral.length * 100).toFixed(2))
    : 0,
    lowConfidence: {
      total: lowConfidence.length,
      correct: lowConfidenceCorrect.length,
      accuracy: lowConfidence.length > 0
        ? Number((lowConfidenceCorrect.length / lowConfidence.length) * 100)
        : 0
    },
    mediumConfidence: {
      total: mediumConfidence.length,
      correct: mediumConfidenceCorrect.length,
      accuracy: mediumConfidence.length > 0
        ? Number((mediumConfidenceCorrect.length / mediumConfidence.length) * 100)
        : 0
    },
    highConfidence: {
      total: highConfidence.length,
      correct: highConfidenceCorrect.length,
      accuracy: highConfidence.length > 0
        ? Number((highConfidenceCorrect.length / highConfidence.length) * 100)
        : 0
    },
  };

  saveAccuracyHistory(summary);
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
