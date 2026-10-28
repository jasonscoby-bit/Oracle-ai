const assert = require("node:assert/strict");
const test = require("node:test");
const { signalId, printAccuracyBreakdown } = require("./bullbear_performance");

test("signalId prefers stable IDs and supports legacy records", () => {
  assert.equal(signalId({ id: "signal-123", coin: "BTC", timestamp: "2026-10-28T00:00:00.000Z" }), "signal-123");
  assert.equal(signalId({ coin: "BTC", timestamp: "2026-10-28T00:00:00.000Z" }), "BTC:2026-10-28T00:00:00.000Z");
});

test("performance breakdown excludes missing directions from directional accuracy", () => {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => lines.push(args.join(" "));
  try {
    printAccuracyBreakdown([
      { status: "complete", direction: "Slightly Bullish", oneHour: { result: "correct" } },
      { status: "complete", direction: "Neutral", oneHour: { result: "correct" } },
      { status: "complete", oneHour: { result: "incorrect" } },
      { status: "complete", direction: "Slightly Bearish", oneHour: { result: "incorrect" } },
      { status: "complete", direction: "Slightly Bullish", oneHour: { result: "flat" } }
    ]);
  } finally {
    console.log = originalLog;
  }
  assert.ok(lines.some(line => line.includes("Directional only: 1/2 (50.00%)")));
  assert.ok(lines.some(line => line.includes("Overall scored: 3/4 (75.00%)")));
  assert.ok(lines.some(line => line.includes("Flat/excluded: 1")));
});
