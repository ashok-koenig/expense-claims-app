const service = require('../services/claims.service');

function list(req, res) {
  res.json(service.list());
}

function get(req, res) {
  res.json(service.get(req.params.id));
}

async function submit(req, res) {
  res.status(201).json(await service.submit(req.body));
}

async function update(req, res) {
  res.json(await service.update(req.params.id, req.body));
}

function remove(req, res) {
  service.remove(req.params.id);
  res.status(204).end();
}

module.exports = { list, get, submit, update, remove };
