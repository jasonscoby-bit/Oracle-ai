const { getHistoricalPrice } = require("./cmc_performance_history");

async function runProbe() {
  try {
    const result = await getHistoricalPrice(
      "2026-09-18T02:45:55.128Z",
      "BTC"
    );

    console.log("CMC PROBE RESULT:", result);
  } catch (error) {
    console.error("CMC PROBE ERROR:", error);
    process.exit(1);
  }
}

runProbe();
