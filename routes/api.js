
'use strict';
const crypto = require('crypto');
const axios = require('axios');

const PROXY_URL = 'https://stock-price-checker-proxy.freecodecamp.rocks/';
const stockData = {}; // In-memory store for likes + IPs

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const { stock, like } = req.query;

      if (!stock) {
        return res.status(400).json({ error: 'Stock symbol is required' });
      }

      // Handle both single stock (string) and multiple stocks (array)
      const stocks = Array.isArray(stock) ? stock : [stock];
      const symbols = stocks.map(s => s.toUpperCase());
      const ipHash = hashIP(req.ip);

      try {
        // Fetch stock prices from API
        const responses = await Promise.all(
          symbols.map(symbol => axios.get(`${PROXY_URL}v1/stock/${symbol}/quote`))
        );

        const results = responses.map((response, i) => {
          const symbol = symbols[i];
          const data = response.data;

          // Init local store if needed
          if (!stockData[symbol]) {
            stockData[symbol] = { likes: 0, ipHashes: [] };
          }

          // Handle "like" (if not already liked by this IP)
          if (like === 'true' && !stockData[symbol].ipHashes.includes(ipHash)) {
            stockData[symbol].likes++;
            stockData[symbol].ipHashes.push(ipHash);
          }

          return {
            stock: data.symbol,
            price: data.latestPrice,
            likes: stockData[symbol].likes
          };
        });

        // Format response based on number of stocks
        if (results.length === 1) {
          // Single stock response
          res.json({
            stockData: results[0]
          });
        } else {
          // Multiple stocks response with relative likes
          const stocksWithRelLikes = results.map((result, i) => {
            const otherLikes = results.filter((_, j) => j !== i)
              .reduce((sum, other) => sum + other.likes, 0);
            return {
              stock: result.stock,
              price: result.price,
              rel_likes: result.likes - otherLikes
            };
          });

          res.json({
            stockData: stocksWithRelLikes
          });
        }

      } catch (err) {
        res.status(500).json({ error: 'Error fetching stock data' });
      }
    });
};
