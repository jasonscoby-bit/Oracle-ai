const apiKey = process.env.CMC_API_KEY;

async function runProbe() {
  try {
    const target = new Date("2026-09-19T22:50:14.399Z");

    const start = new Date(target.getTime() - 2 * 60 * 60 * 1000);
    const end = new Date(target.getTime() + 2 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      id: "1",
      time_start: start.toISOString(),
      time_end: end.toISOString(),
      interval: "1h",
      convert: "USD"
    });

    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical?${params}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
          "Accept": "application/json"
        }
      }
    );

    const data = await response.json();

    const quotes = data.data?.["1"]?.quotes ?? [];

    console.log("=== CMC TIMESTAMP AUDIT ===");
    console.log("Target:", target.toISOString());
    console.log("Start:", start.toISOString());
    console.log("End:", end.toISOString());
    console.log("HTTP status:", response.status);
    console.log("Quote count:", quotes.length);

    for (const quote of quotes) {
      const quoteTime = new Date(quote.timestamp);
      const skewSeconds =
        (quoteTime.getTime() - target.getTime()) / 1000;

      console.log({
        timestamp: quote.timestamp,
        skewSeconds: skewSeconds,
        price: quote.quote.USD.price
      });
    }
  } catch (error) {
    console.error("CMC TIMESTAMP AUDIT ERROR:", error);
    process.exit(1);
  }
}

runProbe();
