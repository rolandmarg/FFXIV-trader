const fs = require('fs');
const {calculateCraftingPrice} = require('./price');

async function calculateProfit(items, {minimumProfit = 0, minimumVelocity = 0} = {}) {
  const profits = [];
  for (const item of items) {
    const [profit] = await Promise.all([caclulateProfitInternal(item), new Promise(r => setTimeout(r, 50))]);
    profits.push(profit);
    // TODO make faster, 20 request per 1 sec available
  }

  profits.sort((a, b) => (b.crafted.price - b.ingredients.price) - (a.crafted.price - a.ingredients.price));

  dumpProfits(profits);

  let result = profits;
  if (minimumProfit) {
    result = profits.filter(p => p.crafted.price - p.ingredients.price >= minimumProfit);
  }
  if (minimumVelocity) {
    result = profits.filter(p => p.crafted.velocity >= minimumVelocity);
  }

  return result;
}

async function caclulateProfitInternal(item) {
  const [price, materialPrice, ingredients] = await calculateCraftingPrice(item);

  return {
    crafted: {
      id: item.id,
      price: price.spendings.total,
      amount: item.amount,
      name: item.name,
      velocity: Object.values(price.itemPrices).length ? Object.values(price.itemPrices)[0].saleVelocity : 0,
      available: Object.values(price.itemPrices).length ? Object.values(price.itemPrices)[0].globalPrice.totalCount : 0,
    },
    ingredients: {
      price: materialPrice.spendings.total,
      ingredients
    },
    profit: Math.round(price.spendings.total * 100 / materialPrice.spendings.total),
  };
}

function dumpProfits(profits) {
  let output = '';

  for (const profit of profits) {
    output += `x${profit.crafted.amount} ${profit.crafted.name.padEnd(45, ' ')} ${('[' + profit.crafted.price.toLocaleString('en-US') + 'G').padEnd(7, ' ')}] crafting mats [${(profit.ingredients.price.toLocaleString('en-US') + 'G]').padEnd(7, ' ')} profit ${'[' + profit.profit + '%]'.padEnd(3, ' ')} velocity ${'[' + profit.crafted.velocity + '%]'.padEnd(3, ' ')} available ${'[' + profit.crafted.available + ']'.padEnd(4, ' ')}\n`;
  }
  console.log(output);
  fs.writeFileSync(`./dump/${Date.now()}-profit`, output, {enconding: 'utf8'});
}

module.exports = {
  calculateProfit
};