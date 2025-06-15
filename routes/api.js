
'use strict';

const crypto = require('crypto');


const PROXY_URL = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/';
const stockData = {}; // In-memory store for likes + IPs

function saveStock(stock, ip, like) {
  const hash = crypto.createHash('md5').update(ip).digest('hex');
  
  if (!stockData[stock]) {
    stockData[stock] = {
      likes: 0,
      ips: new Set()
    };
  }

  if (like === 'true' && !stockData[stock].ips.has(hash)) {
    stockData[stock].likes++;
    stockData[stock].ips.add(hash);
  }

  return stockData[stock].likes;
}

async function getStock(stock) {
  // Fetch stock data from the proxy API
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(
    `${PROXY_URL}${stock}/quote`
  );
  const {symbol, latestPrice} = await response.json();
  return {
    stock: symbol,
    price: latestPrice
  };
}

module.exports = function (app) {
  app.route('/api/stock-prices').get(async function (req, res) {
    const { stock, like } = req.query;
    try {
      // Handle multiple stocks
      if (Array.isArray(stock)) {
        const [stock1, stock2] = stock;
        if (!stock1 || !stock2) {
          return res.json({ error: "Missing stock symbols" });
        }

        const results = await Promise.all([
          getStock(stock1).catch(() => null),
          getStock(stock2).catch(() => null)
        ]);

        // Check if both stocks were found
        if (!results[0] || !results[1]) {
          return res.json({ error: "One or more stocks not found" });
        }

        const likes1 = saveStock(results[0].stock, req.ip, like);
        const likes2 = saveStock(results[1].stock, req.ip, like);

        return res.json({
          stockData: [
            {
              stock: results[0].stock,
              price: results[0].price,
              rel_likes: likes1 - likes2
            },
            {
              stock: results[1].stock,
              price: results[1].price,
              rel_likes: likes2 - likes1
            }
          ]
        });
      } 
      
      // Single stock handling
      if (!stock) {
        return res.json({ error: "Missing stock symbol" });
      }

      const stockInfo = await getStock(stock).catch(() => null);
      if (!stockInfo) {
        return res.json({ stockData: { likes: 0 } });
      }
      
      const likes = saveStock(stockInfo.stock, req.ip, like);
      return res.json({ 
        stockData: {
          stock: stockInfo.stock,
          price: stockInfo.price,
          likes: likes
        }
      });

    } catch (error) {
      return res.status(500).json({ error: "Error fetching stock data" });
    }
  });
};
