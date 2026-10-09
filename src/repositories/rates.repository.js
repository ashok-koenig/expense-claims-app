const fs = require('node:fs/promises');
const path = require('node:path');

const RATES_FILE = path.join(__dirname, '..', '..', 'data', 'exchange-rates.json');

// Read on each call so edits to the file take effect without a restart.
// Returns { base, rates } where rates maps a currency code to units per 1 base unit.
async function load() {
  return JSON.parse(await fs.readFile(RATES_FILE, 'utf8'));
}

module.exports = { load };
