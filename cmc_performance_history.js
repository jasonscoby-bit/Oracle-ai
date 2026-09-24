const CMC_HISTORY_URL =
  "https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical";

async function getHistoricalPrice(timestamp, coin) {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    throw new Error("CMC_API_KEY is not configured");
  }

  const target = new Date(timestamp);
  const start = new Date(target.getTime() - 2 * 60 * 60 * 1000);
const end = new Date(target.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    symbol: coin,
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

  const asset = data.data?.[coin];

  if (!asset || !asset.quotes || asset.quotes.length === 0) {

  return null;
}

  const quote = asset.quotes.reduce((closest, current) => {
  const closestDistance = Math.abs(
    new Date(closest.timestamp).getTime() - target.getTime()
  );

  const currentDistance = Math.abs(
    new Date(current.timestamp).getTime() - target.getTime()
  );

  return currentDistance < closestDistance
    ? current
    : closest;
});

return {
  timestamp: quote.timestamp,
  price: quote.quote.USD.price
};
}

module.exports = {
  getHistoricalPrice
};
