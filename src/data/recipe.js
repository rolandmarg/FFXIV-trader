const utils = require('../utils');

const filePath = './data/recipe.csv';
const fileUrl =
  'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/Recipe.csv';

let recipes = {};

async function load() {
  if (!utils.fileExists(filePath)) {
    await utils.downloadFile(fileUrl, filePath);
  }

  await utils.readCsv(
    filePath,
    { skipLines: 3, headerLine: 2 },
    (line, headers) => {
      const parsed = utils.parseCsvLine(headers, line);

      const recipe = {
        id: parsed['Item{Result}'],
        yieldResult: parsed['Amount{Result}'],
        level: parsed['RecipeLevelTable'],
        ingredients: Object.entries(parsed)
          .filter(
            ([key, value]) => key.startsWith('Item{Ingredient}') && value > 0
          )
          .map(([key, value]) => ({
            id: value,
            amount: parsed[key.replace('Item', 'Amount')],
          })),
      };
      recipes[recipe.id] = recipe;
    }
  );
}

function exists(id) {
  return !!recipes[id];
}

function findOne(id) {
  return recipes[id];
}

function find(ids) {
  return [...new Set(ids)].map((id) => recipes[id]);
}

module.exports = {
  load,
  exists,
  findOne,
  find,
};
