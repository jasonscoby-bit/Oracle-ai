const test = require("node:test");
const assert = require("node:assert/strict");
const { average, formatAverage, analyzeComponents, COMPONENTS } = require("./bullbear_component_analysis");

test("average returns null for an empty sample instead of zero", () => {
  assert.equal(average([]), null);
});

test("average calculates a numeric mean", () => {
  assert.equal(average([2, 4, 6]), 4);
});

test("formatAverage exposes sample count and missing values", () => {
  assert.equal(formatAverage([]), "N/A (n=0)");
  assert.equal(formatAverage([2, 4]), "3.00 (n=2)");
});

test("component report marks absent samples as N/A", () => {
  const output = [];
  analyzeComponents([{
    status: "complete",
    oneHour: { result: "correct" },
    direction: "Neutral",
    componentScores: { momentum: 60 }
  }], line => output.push(line));
  assert.ok(output.some(line => line.includes("momentum") && line.includes("60.00 (n=1)")));
  assert.ok(output.some(line => line.includes("volume") && line.includes("N/A (n=0)")));
  assert.equal(COMPONENTS.length, 7);
});
