const assert = require("node:assert/strict");
const test = require("node:test");
const { evaluateDirection, validateEvaluationPrice } = require("./bullbear_evaluator");

test("neutral signals are correct only inside the neutral threshold", () => {
  assert.equal(evaluateDirection({ direction: "Neutral", priceChangePercent: 0.25 }), "correct");
  assert.equal(evaluateDirection({ direction: "Neutral", priceChangePercent: 0.2501 }), "incorrect");
});

test("bullish and bearish signals respect directional threshold boundaries", () => {
  assert.equal(evaluateDirection({ direction: "Slightly Bullish", priceChangePercent: 0.1 }), "flat");
  assert.equal(evaluateDirection({ direction: "Slightly Bullish", priceChangePercent: 0.1001 }), "correct");
  assert.equal(evaluateDirection({ direction: "Slightly Bearish", priceChangePercent: -0.1001 }), "correct");
  assert.equal(evaluateDirection({ direction: "Slightly Bearish", priceChangePercent: 0.1001 }), "incorrect");
});

test("evaluation timestamps outside the allowed skew are rejected", () => {
  const result = validateEvaluationPrice({
    targetTimestamp: "2026-10-28T10:00:00.000Z",
    actualTimestamp: "2026-10-28T10:05:01.000Z"
  });
  assert.equal(result.valid, false);
  assert.equal(result.skewSeconds, 301);
});

test("unsupported directions and invalid numeric inputs throw", () => {
  assert.throws(() => evaluateDirection({ direction: "Sideways", priceChangePercent: 1 }), /Unsupported BullBear direction/);
  assert.throws(() => evaluateDirection({ direction: "Neutral", priceChangePercent: NaN }), /finite number/);
  assert.throws(() => evaluateDirection({ direction: "Neutral", priceChangePercent: null }), /finite number/);
  assert.throws(() => evaluateDirection({ direction: "Neutral", priceChangePercent: "" }), /finite number/);
});
