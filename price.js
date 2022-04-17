const axios = require('axios')
const {getIngredients} = require("./recipe");


const groupBy = (arr, property) => {
  return arr.reduce((acc, cur) => {
    acc[cur[property]] = [...acc[cur[property]] || [], cur];
    return acc;
  }, {});
}

//TODO accept multiple inputs
async function calculatePrice(items, options = {dataCenter: 'aether'}) {
  let t1,t2;
  const ids = items.map(i => i.id);
  const itemPrices = {};
  // TODO reconsider API for multiple inputs;
  let data = [];
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const idsChunk = ids.slice(i, i + chunkSize);
    const url = `https://universalis.app/api/${options.dataCenter}/${idsChunk.join(',')}`;
    t1 = process.hrtime();
    console.log('starting request', ids.join(','));
    const response = await axios.get(url);
    data = data.concat(response.data.items || [response.data]);
    t2 = process.hrtime(t1);
    console.log(`received response in ${t2[0]}s`, ids.join(','));
  }
  data.forEach((item, index) => {
    if (!item.itemID) {
        return;
    }
    const needed = items.filter(i => i.id == item.itemID)[0].amount || 1;
    const globalPrice = calculatePriceInternal(item.listings, needed);
    const serverListings = groupBy(item.listings, 'worldName');
    const worldPrices = {};
    Object.entries(serverListings).forEach(([world, listings]) => {
      worldPrices[world] = calculatePriceInternal(listings, needed);
    });
    const bestPPU = Object.entries(worldPrices).sort(([aw, ap], [bw, bp]) => (ap.pricePerUnit - bp.pricePerUnit));
    const bestPrice = Object.entries(worldPrices).sort(([aw, ap], [bw, bp]) => (ap.price - bp.price));
    const bestPriceWorld = bestPrice && bestPrice[0] && bestPrice[0][0];
    const bestPriceWorldObj = bestPrice && bestPrice[0] && bestPrice[0][1];
    const bestPPUWorld = bestPPU && bestPPU[0] && bestPPU[0][0];
    const bestPPUWorldObj = bestPPU && bestPPU[0] && bestPPU[0][1];
    itemPrices[item.itemID] = {
      prices: {...worldPrices},
      globalPrice,
      saleVelocity: Math.round(item.hqSaleVelocity || item.nqSaleVelocity),
      cheapest: {name: items.filter(i => i.id == item.itemID)[0].name, world: bestPriceWorld, ...bestPriceWorldObj},
      cheapestPPU: {name: items.filter(i => i.id == item.itemID)[0].name, world: bestPPUWorld, ...bestPPUWorldObj},
    }
  });

  const spendings = {total: 0};
  Object.values(itemPrices).forEach(i => {
    if (!i.cheapestPPU) {
      return;
    }
    const cost = i.cheapestPPU.pricePerUnit * i.cheapestPPU.needed;
    spendings.total += cost;
    if (!spendings[i.cheapestPPU.world]) {
      spendings[i.cheapestPPU.world] = cost;
    } else {
      spendings[i.cheapestPPU.world] += cost;
    }
  })

  return {
    spendings,
    itemPrices,
  };
}

async function calculateCraftingPrice(item) {
  const ingredients = getIngredients(item, item.amount);
  const rawMaterials = Object.values(ingredients).filter(i => i.raw);
  const [price, materialPrice] = await Promise.all([calculatePrice([item]), calculatePrice(rawMaterials)]);
  return [price, materialPrice, ingredients];
}

function calculatePriceInternal(listings, needed) {
  const result = {acquired: 0, needed, totalCount: 0, hasEnough: false, price: 0, pricePerUnit: 0};
  for (const listing of listings) {
    // TODO better logic to decide how to spend minimal gil and not overpurchase
    if (result.acquired < needed) {
      if (!result.pricePerUnit) {
        result.pricePerUnit = listing.pricePerUnit;
      } else {
        result.pricePerUnit = Math.round((result.pricePerUnit * result.acquired + listing.quantity * listing.pricePerUnit) / (result.acquired + listing.quantity));
      }
      result.acquired += listing.quantity;
      result.price += listing.quantity * listing.pricePerUnit;
    }
    result.totalCount += listing.quantity;
  }
  if (result.acquired >= needed) {
    result.hasEnough = true;
  }

  return result;
}

module.exports = {
  calculatePrice,
  calculateCraftingPrice
};
