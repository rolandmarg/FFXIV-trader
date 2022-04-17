const fs = require('fs')
const csv = require('csv-parser')
const ids = require('./data/ids.json');

async function bootstrap() {

    const recipes = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream('./data/recipe.csv')
            .pipe(csv({ skipLines: 4, headers: ["#","Number","CraftType","RecipeLevelTable","Item{Result}","Amount{Result}","Item{Ingredient}[0]","Amount{Ingredient}[0]","Item{Ingredient}[1]","Amount{Ingredient}[1]","Item{Ingredient}[2]","Amount{Ingredient}[2]","Item{Ingredient}[3]","Amount{Ingredient}[3]","Item{Ingredient}[4]","Amount{Ingredient}[4]","Item{Ingredient}[5]","Amount{Ingredient}[5]","Item{Ingredient}[6]","Amount{Ingredient}[6]","Item{Ingredient}[7]","Amount{Ingredient}[7]","Item{Ingredient}[8]","Amount{Ingredient}[8]","Item{Ingredient}[9]","Amount{Ingredient}[9]","","IsSecondary","MaterialQualityFactor","DifficultyFactor","QualityFactor","DurabilityFactor","","RequiredCraftsmanship","RequiredControl","QuickSynthCraftsmanship","QuickSynthControl","SecretRecipeBook","Quest","CanQuickSynth","CanHq","ExpRewarded","Status{Required}","Item{Required}","IsSpecializationRequired","IsExpert","PatchNumber"]}))
            .on('data', (data) => results.push(data))
            .on('end', () => { resolve(results); });
    });

    const result= {};
    recipes.forEach(recipe => {
        if (!Number(recipe['Item{Result}'])) {
            return;
        }
        const obj = {
            id: recipe['Item{Result}'],
            name: ids[recipe['Item{Result}']].en,
            resultAmount: +recipe['Amount{Result}'],
            level: +recipe['RecipeLevelTable'],
            ingredients: {}
        };
        Object.entries(recipe).forEach(([key, value]) => {
            if (+value <= 0) {
                return;
            }
            if (key.startsWith('Item{Ingredient}')) {
                const name = ids[value].en;
                const [_, number] = key.split('Item{Ingredient}');
                obj.ingredients[name]  = { id: value, amount: +recipe['Amount{Ingredient}' + number] };
            }
        });
        result[obj.name] = obj;
    })

    fs.writeFileSync(`./data/recipe.json`, JSON.stringify(result), { enconding: 'utf8' });
}

bootstrap();