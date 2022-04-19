const utils = require('../utils');

const filePath = './data/ids.json';
const fileUrl = 'https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/master/apps/client/src/assets/data/items.json';

let itemNames;
let itemIds;

async function load() {
  if (!utils.fileExists(filePath)) {
    await utils.downloadFile(fileUrl, filePath);
  }

  itemNames = await utils.readJson(filePath);
  Object.entries(itemNames).forEach(([id, val]) => {
    Object.entries(val).forEach(([lang, name]) => {
      if (!itemIds[lang]) {
        itemIds[lang] = {};
      }
      itemIds[lang][name] = id;
    });
  })
}

function name(id, lang = 'en') {
  return itemNames[id][lang];
}

function id(name, lang = 'en') {
  return itemIds[lang][name];
}

module.exports = {
  load,
  name,
  id
};
