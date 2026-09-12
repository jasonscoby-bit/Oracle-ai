const CMC_HISTORY_URL =
  "https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/historical";

async function getHistoricalBTC(days = 30) {
  const apiKey = process.env.CMC_API_KEY;

  if (!apiKey) {
    throw new Error("CMC_API_KEY is not configured");
  }

  const url =
    `${CMC_HISTORY_URL}?id=1&count=${days}&interval=daily&convert=USD`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-CMC_PRO_API_KEY": apiKey,
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `CoinMarketCap historical API error ${response.status}: ${errorText}`
    );
  }

  const json = await response.json();

  const bitcoin = json.data?.["1"];

  if (!bitcoin || !Array.isArray(bitcoin.quotes)) {
    throw new Error("Historical Bitcoin data was not returned");
  }

  return bitcoin.quotes.map(snapshot => {
    const usd = snapshot.quote?.USD;

    if (!usd) {
      throw new Error("USD historical quote is missing");
    }

    return {
      timestamp: snapshot.timestamp,
      price: usd.price,
      volume24h: usd.volume_24h,
      marketCap: usd.market_cap
    };
  });
}

module.exports = {
  getHistoricalBTC
};
