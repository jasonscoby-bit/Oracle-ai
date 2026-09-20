const fs = require("fs");

const filePath = "./data/bullbear_signal_performance.json";

const records = JSON.parse(fs.readFileSync(filePath, "utf8"));

const scored = records.filter(record =>
  record.status === "complete" &&
  ["correct", "incorrect"].includes(record.oneHour?.result) &&
  Number.isFinite(Number(record.bullBearScore))
);

const bands = [
  { name: "0-39", min: 0, max: 39 },
  { name: "40-44", min: 40, max: 44 },
  { name: "45-49", min: 45, max: 49 },
  { name: "50-54", min: 50, max: 54 },
  { name: "55-59", min: 55, max: 59 },
  { name: "60-69", min: 60, max: 69 },
  { name: "70-79", min: 70, max: 79 },
  { name: "80-100", min: 80, max: 100 }
];

console.log("===== BULLBEAR SCORE-BAND ANALYSIS =====");
console.log(`Completed scored signals: ${scored.length}`);
console.log("");

for (const band of bands) {
  const matches = scored.filter(record => {
    const score = Number(record.bullBearScore);
    return score >= band.min && score <= band.max;
  });

  const correct = matches.filter(
    record => record.oneHour.result === "correct"
  ).length;

  const incorrect = matches.length - correct;

  const accuracy = matches.length
    ? ((correct / matches.length) * 100).toFixed(2)
    : "N/A";

  console.log(
    `${band.name}: ${correct}/${matches.length} correct (${accuracy}%)`
  );

  if (matches.length > 0) {
    console.log(`  Incorrect: ${incorrect}`);
  }
}

const correctScores = scored
  .filter(record => record.oneHour.result === "correct")
  .map(record => Number(record.bullBearScore));

const incorrectScores = scored
  .filter(record => record.oneHour.result === "incorrect")
  .map(record => Number(record.bullBearScore));

const average = values =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

console.log("");
console.log("===== SCORE COMPARISON =====");
console.log(
  `Average score when correct: ${average(correctScores)?.toFixed(2) ?? "N/A"}`
);
console.log(
  `Average score when incorrect: ${average(incorrectScores)?.toFixed(2) ?? "N/A"}`
);
