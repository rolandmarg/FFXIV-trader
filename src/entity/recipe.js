const data = require('../data');
const utils = require('../utils');

function exists(id) {
  return data.recipe.exists(id);
}

function get({ id, amount }) {
  const recipe = data.recipe.findOne(id);
  if (!recipe) {
    return null;
  }

  return {
    id: recipe.id,
    amount,
    yieldResult: recipe.yieldResult,
    level: recipe.level,
    ingredients: ingredients(recipe, amount),
    materials: ingredients(recipe, amount).filter((i) => !exists(i.id)),
    prerequisites: ingredients(recipe, amount).filter((i) => exists(i.id)),
  };
}

function ingredients(recipe, amount) {
  const total = [];
  recipe.ingredients.forEach((ingredient) => {
    // TODO fix yield amount logic
    const amountNeeded = Math.ceil(
      (amount * ingredient.amount) / recipe.yieldResult
    );

    const rec = data.recipe.get(ingredient.id);
    // if ingredient is a recipe get its ingredients recursively
    if (rec) {
      const ingredientIngredients = rec.ingredients(amountNeeded);
      total.push.apply(total, ingredientIngredients);
    }
    total.push({ id: ingredient.id, amount: amountNeeded });
  });

  // sum up same ingredients
  return utils.sumBy(total, 'id', 'amount');
}

module.exports = {
  get,
  exists,
};
