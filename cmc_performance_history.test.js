const assert = require("node:assert/strict");
const test = require("node:test");
const { getHistoricalPrice } = require("./cmc_performance_history");

test("historical price lookup rejects unsupported assets rather than using BTC pricing", async () => {
  await assert.rejects(
    getHistoricalPrice("2026-10-28T00:00:00.000Z", "ETH"),
    /supports BTC only/
  );
});

test("historical BTC price lookup requires the API key", async () => {
  const previous = process.env.CMC_API_KEY;
  delete process.env.CMC_API_KEY;
  try {
    await assert.rejects(
      getHistoricalPrice("2026-10-28T00:00:00.000Z", "BTC"),
      /CMC_API_KEY is not configured/
    );
  } finally {
    if (previous === undefined) delete process.env.CMC_API_KEY;
    else process.env.CMC_API_KEY = previous;
  }
});
