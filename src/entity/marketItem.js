const utils = require('../utils');

function get({ listings, hqSaleVelocity, nqSaleVelocity }, amount) {
  const worldPrices = Object.entries(utils.groupBy(listings, 'worldName')).map(
    ([world, listings]) => ({ world, ...calculatePrice(listings, amount) })
  );

  return {
    amount,
    price: calculatePrice(listings, amount),
    worldPrices,
    velocity: Math.round(hqSaleVelocity || nqSaleVelocity),
    cheapestTotal: worldPrices.sort(
      (a, b) => a.acquiredPrice - b.acquiredPrice
    )[0],
    cheapestPerUnit: worldPrices.sort(
      (a, b) => a.pricePerUnit - b.pricePerUnit
    )[0],
  };
}

function calculatePrice(listings, needed) {
  const result = {
    acquired: 0,
    needed,
    available: 0,
    acquiredPrice: 0,
    price: 0,
    pricePerUnit: 0,
  };
  listings.forEach((listing) => {
    // TODO better logic to decide how to spend minimal gil and not overpurchase
    if (result.acquired < result.needed) {
      if (!result.pricePerUnit) {
        result.pricePerUnit = listing.pricePerUnit;
      } else {
        result.pricePerUnit = Math.round(
          (result.pricePerUnit * result.acquired +
            listing.quantity * listing.pricePerUnit) /
            (result.acquired + listing.quantity)
        );
      }
      result.acquired += listing.quantity;
      result.acquiredPrice += listing.quantity * listing.pricePerUnit;
      result.price = result.needed * result.pricePerUnit;
    }
    result.available += listing.quantity;
  });

  return result;
}

module.exports = {
  get,
};
