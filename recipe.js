const idMap = require('./data/ids.json');
const recipes = require('./data/recipe.json');

function getI580Recipes() {
  return Object.values(recipes).filter(r => r.level === 580);
}

function getItems(names) {
  return [...new Set(names)].map(n => recipes[n]);
}

function getItemName(id) {
  return idMap[id].en;
}

function getIngredients(item, amount = 1) {
  const recipeItem = recipes[item.name];
  const ingredients = [];
  if (!recipeItem) {
    return {...item, amount, raw: true};
  } else {
    const itemYield = recipeItem.resultAmount || 1;
    Object.entries(recipeItem.ingredients).forEach(([name, value]) => {
      const amt = Math.ceil(amount * value.amount / itemYield);
      ingredients.push(getIngredients({name, id: value.id}, amt));
      if (recipes[name]) {
        ingredients.push({
          name,
          id: value.id,
          yield: recipes[name].resultAmount,
          amount: amt,
          raw: false
        });
      }
    })
  }

  const map = {};
  ingredients.flat().forEach(i => {
    if (!map[i.id]) {
      map[i.id] = i;
    } else {
      map[i.id].amount += i.amount;
    }
  });

  return Object.values(map);
}

module.exports = {
  getItems,
  getI580Recipes,
  getItemName,
  getIngredients
}