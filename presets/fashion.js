const {calculateRoute} = require('../route');
const {getItems} = require('../src/entity/recipe');
const {calculateProfit} = require("../src/profit");
const {calculateCraftingPrice} = require("../src/market");

const expensiveClothing = [
  "Shaded Spectacles",
  "Frontier Ribbon",
  "Minstrel's Spectacles",
  "Replica Sky Pirate's Mask of Striking",
  "Calfskin Rider's Cap",
  "Non La",
  "Summer Indigo Shirt",
  "Rebel Coat",
  "Whisperfine Woolen Coat",
  "Replica Sky Pirate's Vest of Aiming",
  "Quaintrelle's Ruffled Dress",
  "Urban Coat",
  "Ao Dai",
  "Boulevardier's Ruffled Shirt",
  "Hooded Fireglass Leather Vest",
  "Spring Dress",
  "Adventurer's Hooded Vest",
  "Calfskin Rider's Gloves",
  "Wristlet of Happiness",
  "Spring Skirt",
  "Taoist's Slops",
  "Southern Seas Skirt",
  "Calfskin Rider's Bottoms",
  "Quan",
  "Quaintrelle's Ruffled Skirt",
  "Thavnairian Tights",
  "Expeditioner's Pantalettes",
  "Whisperfine Woolen Shorts",
  "Calfskin Rider's Jacket",
  "Hose of Happiness",
  "Frontier Trousers",
  "High House Halfboots",
  "Urban Boots",
  "High House Boots",
  "Rebel Boots",
  "Calfskin Rider's Shoes",
  "Boots of Happiness",
  "Moonfire Sandals",
  "Whisperfine Woolen Boots",
  "Frontier Pumps",
  "Pteroskin Shoes"
];

async function bootstrap() {
  const items = getItems(expensiveClothing);

  items.forEach(i => i.amount = 3);

  const profits = (await calculateProfit(items, {minimumProfit: 10000, minimumVelocity: 8})).slice(0, 5);
  const shoppingList = [];
  for (const profit of profits) {
    shoppingList.push(await calculateCraftingPrice({id: profit.crafted.id, name: profit.crafted.name, amount: 2}));
  }
  await calculateRoute(shoppingList);
}


bootstrap();