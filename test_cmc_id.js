const apiKey = process.env.CMC_API_KEY;

async function test() {
  const target = new Date("2026-09-21T02:54:14.774Z");

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

  console.log("HTTP:", response.status);

  const data = await response.json();

  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
