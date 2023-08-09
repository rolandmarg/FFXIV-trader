const fs = require('fs');
const stream = require('stream');
const readLine = require('readline');
const axios = require('axios');
const { promisify } = require('util');
const MarketItem = require('./entity/marketItem');

const finished = promisify(stream.finished);

function fileExists(path) {
  return fs.existsSync(path);
}

async function getByUrl(url) {
  return axios.get(url);
}

// credit to https://stackoverflow.com/a/61269447
async function downloadFile(url, path) {
  const writer = stream.createWriteStream(path);
  return axios({
    method: 'get',
    url,
    responseType: 'stream',
  }).then((response) => {
    response.data.pipe(writer);
    return finished(writer);
  });
}

async function readCsv(path, { skipLines = 0, headerLine } = {}, callback) {
  const rl = readLine.createInterface({
    input: fs.createReadStream(path),
  });

  let headers,
    lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (lineCount === headerLine) {
      headers = line.split(',');
    }
    if (lineCount > skipLines) {
      callback(line, headers);
    }
  }
}

async function readJson(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(JSON.parse(data));
    });
  });
}

function parseCsvLine(headers, line) {
  const result = {};
  line.split(',').forEach((val, idx) => {
    result[headers[idx]] = isNaN(val) ? val : +val;
  });

  return result;
}

function sumBy(array, key, valueKey) {
  return Array.from(
    array.reduce((map, obj) => {
      const curr = map.get(obj[key]);
      if (!curr) {
        map.set(obj[key], obj);
      } else {
        curr[valueKey] += obj[valueKey];
        map.set(obj[key], curr);
      }
      return map;
    }, new Map()),
    ([_key, value]) => value
  );
}

function groupBy(array, key) {
  return array.reduce((acc, cur) => {
    acc[cur[key]] = [...(acc[cur[key]] || []), cur];
    return acc;
  }, {});
}

// credit to https://stackoverflow.com/a/56768137
function dedupe(array, key) {
  return [...new Map(array.map((item) => [item[key], item])).values()];
}

function isNumeric(n) {
  return !isNaN(n);
}

function normalizeItemInput(i) {
  let normalized;
  if (Array.isArray(i)) {
    normalized = dedupe(
      i.map((input) =>
        isNumeric(input)
          ? { id: input, amount: 1 }
          : { id: input.id, amount: input.amount || 1 }
      ),
      'id'
    );
  } else if (isNumeric(i)) {
    normalized = { id: i, amount: 1 };
  } else {
    normalized = { id: i.id, amount: i.amount || 1 };
  }

  return normalized;
}

async function chunk(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function dumpFile(name, data) {
  return fs.writeFileSync(`./dump/${Date.now()}-${name}`, data, {
    enconding: 'utf8',
  });
}

module.exports = {
  fileExists,
  downloadFile,
  readCsv,
  parseCsvLine,
  readJson,
  sumBy,
  groupBy,
  getByUrl,
  dedupe,
  isNumeric,
  normalizeItemInput,
  chunk,
  dumpFile,
};
