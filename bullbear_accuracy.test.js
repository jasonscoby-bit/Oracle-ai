const assert = require("node:assert/strict");
const test = require("node:test");
const { buildSummary } = require("./bullbear_accuracy");

test("directional accuracy excludes neutral and missing-direction records", () => {
  const records = [
    { status: "complete", direction: "Slightly Bullish", oneHour: { result: "correct" } },
    { status: "complete", direction: "Neutral", oneHour: { result: "correct" } },
    { status: "complete", oneHour: { result: "incorrect" } },
    { status: "complete", direction: "Slightly Bearish", oneHour: { result: "incorrect" } }
  ];
  const summary = buildSummary(records);
  assert.deepEqual(summary.directional, { total: 2, correct: 1, incorrect: 1, accuracy: 50 });
  assert.deepEqual(summary.neutral, { total: 1, correct: 1, incorrect: 0, accuracy: 100 });
});

test("flat outcomes are excluded from binary accuracy and counted separately", () => {
  const summary = buildSummary([
    { status: "complete", direction: "Slightly Bullish", oneHour: { result: "flat" } },
    { status: "complete", direction: "Slightly Bullish", oneHour: { result: "correct" } }
  ]);
  assert.equal(summary.directional.total, 1);
  assert.equal(summary.directional.accuracy, 100);
  assert.equal(summary.excludedFlat, 1);
});
