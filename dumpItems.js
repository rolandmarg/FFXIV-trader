const axios = require('axios');
const {getItems} = require('./recipe');
const {calculatePrice} = require("./price");
const fs = require("fs");

async function bootstrap() {
  let results = [];
  const response = await axios.get(`https://xivapi.com/search?filters=LevelItem=1`);
  results.push(response.data.Results);
  const total = response.data.Pagination.PageTotal
  for (let i = 2; i <= total; i++) {
    await Promise.all([axios.get(`https://xivapi.com/search?filters=LevelItem=1&page=${i}`).then(r => results.push(r.data.Results)), new Promise(r => setTimeout(r, 50))]);
  }

  const items = getItems(results.flat().map(r => r.Name)).filter(r => r);
  items.forEach(i => i.amount = 2);
  const prices = await calculatePrice(items);
  let output = '';
  Object.values(prices.itemPrices).sort((a, b) => (b.globalPrice.pricePerUnit - a.globalPrice.pricePerUnit)).forEach(i => {
    if (i.globalPrice.pricePerUnit < 10000) {
      return;
    }
    output += `${i.cheapest && i.cheapest.name}  [${i.globalPrice.pricePerUnit.toLocaleString('en-US')}G]\n`;
  })
  fs.writeFileSync(`./dump/${Date.now()}-items`, output, {enconding: 'utf8'});
}

bootstrap();