const fs = require('fs');
const {getItemName} = require('./src/entity/recipe');

function calculateRoute(shoppingList, worthHop = 3000) {
  const [route, ingredients, craft] = calculateRouteInternal(shoppingList, worthHop);
  dumpRoute(route, ingredients, craft);
}

function calculateRouteInternal(shoppingList, worthHop) {
  const ingredientMap = {};
  shoppingList.map(([_craft, _raw_, ingredients]) => ingredients).flat().filter(i => !i.raw).forEach(i => {
    if (!ingredientMap[i.name]) {
      ingredientMap[i.name] = i;
    } else {
      ingredientMap[i.name].amount += i.amount;
    }
  });
  const crafting = shoppingList.map(([craftingItem]) => Object.values(craftingItem.itemPrices).length && Object.values(craftingItem.itemPrices)[0].cheapestPPU);
  const rawMaterials = shoppingList.map(([_craft, raw, _i]) => raw);

  let possibleWorlds = new Set();
  rawMaterials.forEach(r => Object.values(r.itemPrices).forEach(({prices}) => Object.keys(prices).forEach(world => possibleWorlds.add(world))));
  possibleWorlds = [...possibleWorlds];
  const possibleWorldCombinations = new Array(1 << possibleWorlds.length).fill().map(
    (e1, i) => possibleWorlds.filter((e2, j) => i & 1 << j)).filter(worlds => worlds.length > 0);

  const routes = [];
  for (const worlds of possibleWorldCombinations) {
    const route = generateRoute(worlds, rawMaterials);
    if (route && Object.keys(route).length) {
      routes.push(route);
    }
  }

  let bestRoute = routes[0];
  routes.forEach((r, id) => {
    const currHops = Object.keys(r).length;
    const bestHops = Object.keys(bestRoute).length;
    let currPrice = 0, bestPrice = 0;
    Object.values(r).forEach(world => Object.values(world).forEach(item => currPrice += item.needed * item.pricePerUnit));
    Object.values(bestRoute).forEach(world => Object.values(world).forEach(item => bestPrice += item.needed * item.pricePerUnit));
    if (currHops === bestHops) {
      if (currPrice < bestPrice) {
        bestRoute = r;
      }
    } else if (currHops < bestHops) {
      if (currPrice < (bestPrice + worthHop * (bestHops - currHops))) {
        bestRoute = r;
      }
    } else {
      if ((currPrice + worthHop * (currHops - bestHops)) < bestPrice) {
        bestRoute = r;
      }
    }
  });

  return [bestRoute, Object.values(ingredientMap), crafting];
}

function generateRoute(worlds, rawMaterials) {
  const route = {};
  const addItem = (id, world, needed, pricePerUnit) => {
    const name = getItemName(id);
    if (!route[world]) {
      route[world] = {};
    }
    if (!route[world][id]) {
      route[world][id] = {name, world, needed, pricePerUnit};
    } else {
      route[world][id].needed += needed;
    }
  };
  rawMaterials.forEach(r => {
    Object.entries(r.itemPrices).forEach(([id, obj]) => {
      const sortedPrices = Object.entries(obj.prices).filter(([world]) => worlds.includes(world)).sort((a, b) => a[1].pricePerUnit - b[1].pricePerUnit);
      const bestWorld = sortedPrices && sortedPrices[0] && sortedPrices[0][0];
      if (!bestWorld) {
        return;
      }
      addItem(id, bestWorld, obj.prices[bestWorld].needed, obj.prices[bestWorld].pricePerUnit);
    });
  });

  return route;
}

function dumpRoute(route, ingredients, crafting) {
  let output = '';
  let total = 0;
  Object.values(route).forEach(world => {
    Object.values(world).forEach(item => total += item.pricePerUnit * item.needed);
  })
  output += '\n' + `raw materical cost [${total.toLocaleString('en-US')}G]`;
  Object.entries(route).forEach(([world, items]) => {
    let total = 0;
    Object.values(items).forEach(item => total += item.pricePerUnit * item.needed);
    output += '\n\n' + world + `[${total.toLocaleString('en-US')}G]`;
    Object.values(items).forEach(item => output += '\n' + `  ${item.needed}x ` + item.name + `[${item.pricePerUnit}G]`);
  })
  output += '\n\n' + 'prerequisite crafting';
  ingredients.forEach(i => {
    output += '\n' + `  ${Math.ceil(i.amount / i.yield)}x ` + i.name + `   - ${i.amount}`;
  })

  let totalC = 0;
  crafting.forEach(c => {
    totalC += c.price;
  })
  let totalP = Math.round(totalC * 100 / total);
  output += '\n\n' + `crafting [${totalC.toLocaleString('en-US')}G][${totalP}%]`;
  crafting.forEach(c => {
    if (c) {
      output += '\n' + `  ${c.needed}x ` + c.name + `[${c.pricePerUnit.toLocaleString('en-US')}G]  [${c.price.toLocaleString('en-US')}G]`;
    }
  })

  console.log(output);
  fs.writeFileSync(`./dump/${Date.now()}-route`, output, {enconding: 'utf8'});
}

module.exports = {
  calculateRoute
};

// let fastestRoute = 0;
// const fastestRoutes = [];
// Object.values(itemData).forEach(item => {
//     const [cheapest, second] = Object.values(item).sort((a, b) => a.pricePerUnit - b.pricePerUnit);
//     fastestRoute += cheapest.price;
//     cheapest.second = second;
//     fastestRoutes.push(cheapest);
// })
// fastestRoutes.sort((a, b) => {
//     if (a.server > b.server) {
//         return 1;
//     } else if (a.server < b.server) {
//         return -1;
//     } else {
//         return b.price - a.price;
//     }
// })
// let output = `total price - ${fastestRoute.toLocaleString('en-US')}`;
// output += '\n' + '-'.padEnd(70, '-');
// output += '\n' + `${'name'.padEnd(20, ' ')} | ${'price'.padEnd(7, ' ')} | ${'world'.padEnd(12, ' ')} | ${'needed'.padEnd(6, ' ')} | ${'pricePerUnit'.padEnd(12, ' ')}`;
// output += '\n' + '-'.padEnd(70, '-');
// fastestRoutes.forEach(route => {
//     output += '\n' + `${route.itemName.padEnd(20, ' ')} | ${String(route.price + 'g').padEnd(7, ' ')} | ${route.server.padEnd(12, ' ')} | ${String(route.needed).padEnd(6, ' ')} | ${String(shoppingList[route.id].cheapestPPU).padEnd(12, ' ')}`;
//     // console.log('-'.padEnd(70, '-'));
// });
//
// console.log(output);
// fs.writeFileSync(`./dump/${Date.now()}`, output, {enconding: 'utf8'});