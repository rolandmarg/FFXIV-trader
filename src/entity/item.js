const data = require('../data');
const Recipe = require('./recipe');
const Market = require('../market');

function get(id, amount) {
  const recipe = Recipe.get({ id, amount });

  async function buy() {
    return Market.get({ id, amount });
  }

  async function buyCraft() {
    if (!recipe) {
      throw new Error('not craftable');
    }

    const [ price, materialPrices ] = await Promise.all([
      Market.get({ id, amount }),
      Market.get(recipe.materials)
    ]);

    const materialPriceSum = materialPrices.reduce((acc, cur) => acc + cur.cheapestPerUnit().price, 0);
    const profit = Math.round(price.cheapestPerUnit() * 100 / materialPriceSum);

    return {
      price,
      materialPrices,
      materialPriceSum,
      profit
    }
  }

  return {
    id,
    amount,
    recipe,
    name: data.item.name(id),
    buy,
    buyCraft
  }
}

module.exports = {
  get
};
