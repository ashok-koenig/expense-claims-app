const service = require('../services/rates.service');

async function convert(req, res) {
  const { amount, currency } = res.locals.conversion;
  res.json(await service.convert(amount, currency));
}

module.exports = { convert };
