const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const { assert } = chai;

chai.use(chaiHttp);

suite('Functional Tests', function () {

  test('1. Viewing one stock', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });

  test('2. Viewing one stock and liking it', function (done){
    chai.request(server)
      .get('/api/stock-prices')
      .query({stock: 'GOOG', like: true})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.equal(res.body.stockData.stock, 'GOOG');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        assert.isAbove(res.body.stockData.likes, 0);
        done();
      });
  });

  test('3. Viewing the same stock and liking it again', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'GOOG', like: true })
      .end((err, res1) => {
        const initialLikes = res1.body.stockData.likes;

        chai.request(server)
          .get('/api/stock-prices')
          .query({ stock: 'GOOG', like: true }) // try to like again
          .end((err, res2) => {
            const newLikes = res2.body.stockData.likes;

            assert.equal(res2.status, 200);
            assert.equal(res2.body.stockData.stock, 'GOOG');
            assert.equal(newLikes, initialLikes, 'likes should not increase when liked again from same IP');
            done();
          });
      });
  });

  test('4. Viewing two stocks', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({stock: ['GOOG', 'MSFT']})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);
        assert.property(res.body.stockData[0], 'stock');
        assert.property(res.body.stockData[0], 'price');
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'stock');
        assert.property(res.body.stockData[1], 'price');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });

});
