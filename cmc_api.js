const CMC_API_URL =
  "https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/latest";

async function getCryptoQuote(symbol = "BTC") {
  const apiKey = process.env.CMC_API_KEY;

  if (!apiKey) {
    throw new Error("CMC_API_KEY is not configured.");
  }

  const url = `${CMC_API_URL}?symbol=${symbol}&convert=USD`;

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

  const coin = json.data[symbol];
  const quote = coin.quote.USD;

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
