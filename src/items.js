const Item = require('./entity/item');
const utils = require('./utils');

function get(input) {
  const items = utils.normalizeItemInput(input).map((i) => Item.get(i));

  async function craftProfit(minimumProfit = 0, minimumVelocity = 0) {
    const itemsChunk = utils.chunk(items, 10);
    for (const chunk of itemsChunk) {
      const responses = await Promise.all([
        ...chunk.map((i) => i.buyCraft()),
        new Promise((r) => setTimeout(r, 1000)),
      ]);
      chunk.forEach((item, idx) => (item.craftInfo = responses[idx]));
    }

    logProfit();

    return items
      .filter((i) => i.craftInfo.price.price >= minimumProfit)
      .filter((i) => i.craftInfo.price.velocity >= minimumVelocity);
  }

  function logProfit() {
    let output = '';

    items.forEach((i) => {
      output += `x${i.craftInfo.price.amount} ${i.name.padEnd(45, ' ')} `;
      output += `${(
        '[' +
        i.craftInfo.price.price.toLocaleString('en-US') +
        'G'
      ).padEnd(7, ' ')}] `;
      output += `crafting mats [${(
        i.craftInfo.materialPrices.price.toLocaleString('en-US') + 'G]'
      ).padEnd(7, ' ')} `;
      output += `profit ${
        '[' + i.craftInfo.price.profit + '%]'.padEnd(3, ' ')
      } `;
      output += `velocity ${
        '[' + i.craftInfo.price.velocity + '%]'.padEnd(3, ' ')
      } `;
      output += `available ${
        '[' + i.craftInfo.price.available + ']'.padEnd(4, ' ')
      }\n`;
    });

    console.log(output);
    utils.dumpFile('profits', output);
  }

  return {
    items,
    craftProfit,
  };
}

get([32055]).craftProfit();

//
// const costs = this._items.map(i => i.cheapestPerUnit());
// this._costByWorld = utils.sumBy(costs, 'world', 'neededPrice');
// this._totalCost = this._costByWorld.reduce((total, curr) => total + curr.neededPrice, 0);

module.exports = {
  get,
};
