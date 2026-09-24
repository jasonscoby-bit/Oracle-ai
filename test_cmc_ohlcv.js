const CMC_OHLCV_URL =
  "https://pro-api.coinmarketcap.com/v2/cryptocurrency/ohlcv/historical";

async function run() {
  const apiKey = process.env.CMC_API_KEY;

  if (!apiKey) {
    throw new Error("CMC_API_KEY is not configured");
  }

  // Known BullBear signal that currently has no historical quote
  const target = new Date("2026-09-21T02:54:14.774Z");

  const start = new Date(target.getTime() - 2 * 60 * 60 * 1000);
  const end = new Date(target.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    id: "1",
    time_start: start.toISOString(),
    time_end: end.toISOString(),
    time_period: "hourly",
    interval: "1h",
    convert: "USD"
  });

  const response = await fetch(
    `${CMC_OHLCV_URL}?${params.toString()}`,
    {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        "Accept": "application/json"
      }
    }
  );

  const data = await response.json();

  console.log("===== CMC OHLCV TEST =====");
  console.log({
    httpStatus: response.status,
    target: target.toISOString(),
    params: params.toString(),
    quoteCount: data.data?.quotes?.length ?? 0,
    cmcStatus: data.status
  });

  const quotes = data.data?.quotes ?? [];

  for (const quote of quotes) {
    console.log({
      timeOpen: quote.time_open,
      timeClose: quote.time_close,
      price: quote.quote?.USD?.close
    });
  }
}

run().catch(error => {
  console.error("CMC OHLCV TEST FAILED:", error);
  process.exit(1);
});
