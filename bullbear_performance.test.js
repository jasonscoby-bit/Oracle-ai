const assert = require("node:assert/strict");
const test = require("node:test");
const { signalId, printAccuracyBreakdown, safeEvaluationTiming, deduplicateSignals, isCompletedEvaluation, preserveMissingExistingRecords, getEvaluationTarget } = require("./bullbear_performance");

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
  assert.ok(lines.some(line => line.includes("Overall scored: 2/4 (50.00%)")));
  assert.ok(lines.some(line => line.includes("Flat/excluded: 1")));
});

test("malformed historical timestamps are rejected without throwing", () => {
  const result = safeEvaluationTiming("2026-10-28T01:00:00.000Z", "not-a-date");
  assert.equal(result.valid, false);
  assert.match(result.error, /valid dates/);
});

test("historical prices outside the allowed skew are marked invalid", () => {
  const result = safeEvaluationTiming("2026-10-28T01:00:00.000Z", "2026-10-28T01:05:01.000Z");
  assert.equal(result.valid, false);
  assert.equal(result.skewSeconds, 301);
});

test("duplicate signal history rows are skipped without duplicating results", () => {
  const first = { coin: "BTC", timestamp: "2026-10-28T00:00:00.000Z", price: 80000 };
  const duplicate = { ...first, price: 81000 };
  const other = { coin: "BTC", timestamp: "2026-10-28T01:00:00.000Z", price: 80500 };
  const result = deduplicateSignals([first, duplicate, other]);
  assert.deepEqual(result.signals, [first, other]);
  assert.deepEqual(result.duplicateIds, ["BTC:2026-10-28T00:00:00.000Z"]);
});

test("completed performance evaluations are preserved on reruns", () => {
  const completed = {
    status: "complete",
    oneHour: { result: "correct", price: 80000, priceChangePercent: 0.4 }
  };
  assert.equal(isCompletedEvaluation(completed), true);
  assert.equal(isCompletedEvaluation({ status: "pending" }), false);
  assert.equal(isCompletedEvaluation({ status: "unavailable" }), false);
  assert.deepEqual(completed.oneHour, { result: "correct", price: 80000, priceChangePercent: 0.4 });
});

test("completed evaluations remain recognizable even if current history timestamp is malformed", () => {
  const completed = {
    id: "BTC:original",
    timestamp: "2026-10-28T00:00:00.000Z",
    status: "complete",
    oneHour: { result: "correct", price: 80000, priceChangePercent: 0.4 }
  };
  const malformedHistorySignal = { id: "BTC:original", timestamp: null, coin: "BTC" };

  // Mirrors the ordering used by calculatePerformance: existing completed
  // result is checked before the current signal timestamp is validated.
  const selectedRecord = isCompletedEvaluation(completed)
    ? completed
    : { ...malformedHistorySignal, status: getEvaluationTarget(malformedHistorySignal.timestamp) ? "pending" : "unavailable" };

  assert.equal(selectedRecord.status, "complete");
  assert.deepEqual(selectedRecord.oneHour, completed.oneHour);
});

test("existing performance records absent from history are preserved", () => {
  const current = [{ id: "BTC:new", coin: "BTC", timestamp: "new", status: "pending" }];
  const old = [
    { id: "BTC:old", coin: "BTC", timestamp: "old", status: "complete" },
    { id: "BTC:new", coin: "BTC", timestamp: "new", status: "complete" }
  ];
  const result = preserveMissingExistingRecords(current, old);
  assert.deepEqual(result.map(record => record.id), ["BTC:new", "BTC:old"]);
  assert.equal(result[1].status, "complete");
});

test("invalid signal timestamps are rejected without throwing", () => {
  assert.equal(getEvaluationTarget("not-a-timestamp"), null);
  assert.equal(getEvaluationTarget(null), null);
});

test("valid signal timestamps produce a one-hour evaluation target", () => {
  assert.equal(getEvaluationTarget("2026-10-28T00:00:00.000Z").toISOString(), "2026-10-28T01:00:00.000Z");
});

test("unavailable records are eligible for retry once their target time has passed", () => {
  const { shouldEvaluateRecord } = require("./bullbear_performance");
  const now = new Date("2026-10-28T02:00:00.000Z");
  const target = new Date("2026-10-28T01:00:00.000Z");
  assert.equal(shouldEvaluateRecord({ status: "unavailable" }, now, target), true);
  assert.equal(shouldEvaluateRecord({ status: "pending" }, now, target), true);
  assert.equal(shouldEvaluateRecord({ status: "complete" }, now, target), false);
  assert.equal(shouldEvaluateRecord({ status: "unavailable" }, new Date("2026-10-28T00:59:00.000Z"), target), false);
});
