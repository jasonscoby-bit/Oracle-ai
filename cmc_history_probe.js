const apiKey = process.env.CMC_API_KEY;

async function runProbe() {
  try {
    const params = new URLSearchParams({
      symbol: "BTC",
      count: "1",
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

    console.log("CMC COUNT PROBE", {
      httpStatus: response.status,
      params: params.toString(),
      quoteCount: data.data?.BTC?.quotes?.length ?? 0,
      status: data.status
    });

    console.log("CMC COUNT RESULT:", data.data?.BTC?.quotes ?? []);
  } catch (error) {
    console.error("CMC COUNT PROBE ERROR:", error);
    process.exit(1);
  }
}

runProbe();
