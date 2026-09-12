const CMC_API_URL =
  "https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/latest";

async function getCryptoQuote(symbol = "BTC") {
  const apiKey = process.env.CMC_API_KEY;

  if (!apiKey) {
    throw new Error("CMC_API_KEY is not configured");
  }

  // Bitcoin = CoinMarketCap ID 1
  const url = `${CMC_API_URL}?id=1&convert=USD`;

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
      `CoinMarketCap API error ${response.status}: ${errorText}`
    );
  }

  const json = await response.json();

  const coin = Array.isArray(json.data)
    ? json.data[0]
    : json.data?.[1] || json.data?.[symbol];

  if (!coin) {
    throw new Error("Bitcoin data was not returned by CoinMarketCap");
  }

  const quote = Array.isArray(coin.quote)
    ? coin.quote.find(q => q.symbol === "USD")
    : coin.quote?.USD;

  if (!quote) {
    throw new Error("USD quote was not returned by CoinMarketCap");
  }

  return {
    symbol: coin.symbol,
    name: coin.name,
    price: quote.price,
    marketCap: quote.market_cap,
    volume24h: quote.volume_24h,
    change1h: quote.percent_change_1h,
    change24h: quote.percent_change_24h,
    change7d: quote.percent_change_7d,
    change30d: quote.percent_change_30d,
    lastUpdated: quote.last_updated
  };
}

module.exports = {
  getCryptoQuote
};
