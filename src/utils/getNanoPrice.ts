const CoinGecko = require('coingecko-api');

export async function getNanoPrice(
  currency: string,
  date: string
): Promise<Error | number> {
  // Returns nano price on a given date
  const CoinGeckoClient = new CoinGecko();

  const data = await CoinGeckoClient.coins.fetchHistory('nano', {
    date,
    localization: false,
  });

  return new Promise((resolve, reject) => {
    if (data.success === false) {
      return reject(new Error(data.message));
    }
    return resolve(Number(data.data.market_data.current_price[currency]));
  });
}

export async function getCurrentNanoPrice(
  currency: string
): Promise<Error | number> {
  const CoinGeckoClient = new CoinGecko();

  const data = await CoinGeckoClient.coins.fetch('nano', {});

  return new Promise((resolve, reject) => {
    if (data.success === false) {
      return reject(new Error(data.message));
    }
    return resolve(Number(data.data.market_data.current_price[currency]));
  });
}
