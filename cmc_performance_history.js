const CMC_HISTORY_URL =
  "https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical";

function selectClosestValidQuote(quotes, targetTimestamp) {
  const target = new Date(targetTimestamp);
  if (!Number.isFinite(target.getTime()) || !Array.isArray(quotes)) return null;

  const validQuotes = quotes.filter(quote => {
    const quoteTime = new Date(quote?.timestamp).getTime();
    const price = quote?.quote?.USD?.price;
    return Number.isFinite(quoteTime) &&
      typeof price === "number" &&
      Number.isFinite(price) &&
      price > 0;
  });

  if (validQuotes.length === 0) return null;

  const closest = validQuotes.reduce((best, current) => {
    const bestDistance = Math.abs(new Date(best.timestamp).getTime() - target.getTime());
    const currentDistance = Math.abs(new Date(current.timestamp).getTime() - target.getTime());
    return currentDistance < bestDistance ? current : best;
  });

  return {
    timestamp: closest.timestamp,
    price: closest.quote.USD.price
  };
}

async function getHistoricalPrice(timestamp, coin) {
  // CoinMarketCap asset ID 1 is Bitcoin. Do not silently evaluate another
  // asset using BTC historical prices if multi-coin support is added later.
  if (coin !== "BTC") {
    throw new Error(`Historical performance pricing currently supports BTC only; received ${coin}`);
  }

  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    throw new Error("CMC_API_KEY is not configured");
  }

  const target = new Date(timestamp);
  if (!Number.isFinite(target.getTime())) {
    throw new Error("Historical price target timestamp must be valid");
  }

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
    `${CMC_HISTORY_URL}?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
        "Accept": "application/json"
      }
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `CMC historical request failed: ${response.status} ${text}`
    );
  }

  const data = await response.json();
  const quotes = data.data?.["1"]?.quotes;
  return selectClosestValidQuote(quotes, target.toISOString());
}

module.exports = {
  getHistoricalPrice,
  selectClosestValidQuote
};
