const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../server");
const { assert } = chai;

chai.use(chaiHttp);

suite("Functional Tests", function () {
  test("1. Viewing one stock", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .set("content-type", "application/json")
      .query({ stock: "GOOG" })
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.property(res.body.stockData.price, "price");
        done();
      });
  });

  test("2. Viewing one stock and liking it", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .set("content-type", "application/json")
      .query({ stock: "GOOG", like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.equal(res.body.stockData.likes, 1);
        assert.exists(res.body.stockData.price, "price")
        done();
      });
  });

  test("3. Viewing one stock and liking it again", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .set("content-type", "application/json")
      .query({ stock: "GOOG", like: true })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.equal(res.body.stockData.likes, 1);
        assert.exists(res.body.stockData.price, "price")
        done();
      });
  });

  test("4. Viewing two stocks", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .set("content-type", "application/json")
      .query({ stock: ["GOOG", "MSFT"] })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, "stockData");
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);
        assert.property(res.body.stockData[0], "stock");
        assert.property(res.body.stockData[1], "stock");
        assert.exists(res.body.stockData[0], "price");
        assert.exists(res.body.stockData[1], "price");
        done();
      });
  });
  
  test("5. Viewing and liking two stocks", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: ["GOOG", "MSFT"], like: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, "stockData");
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);
        const [stock1, stock2] = res.body.stockData;
        assert.property(stock1, "stock");
        assert.property(stock1, "price");
        assert.property(stock1, "rel_likes");
        assert.property(stock2, "stock");
        assert.property(stock2, "price");
        assert.property(stock2, "rel_likes");

        // rel_likes must be opposite
        assert.equal(stock1.rel_likes, -stock2.rel_likes);

        done();
      });
  });
});



