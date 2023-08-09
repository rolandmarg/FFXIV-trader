const utils = './utils';
const MarketItem = require('./entity/marketItem');

const dataCenter = 'aether';
const requestMaxIds = 100;

async function fetch(ids) {
  const requests = utils
    .chunk(ids, requestMaxIds)
    .map((idsChunk) =>
      utils.getByUrl(
        `https://universalis.app/api/${dataCenter}/${idsChunk.join(',')}`
      )
    );

  const responses = await Promise.all(requests);

  return responses
    .map(({ data }) => data.items || [data])
    .flat()
    .filter((i) => i.itemID);
}

async function get(input) {
  const normalizedInput = utils.normalizeItemInput(input);

  const marketData = await fetch(normalizedInput.map((i) => i.id));

  const marketItems = marketData.map((data) =>
    MarketItem.get(
      data,
      normalizedInput.find((i) => i.id == data.itemID).amount
    )
  );

  if (marketItems.length === 1) {
    return marketItems[0];
  } else {
    return marketItems;
  }
}

module.exports = {
  get,
};
