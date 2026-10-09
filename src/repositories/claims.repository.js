// In-memory storage; data is lost when the server restarts.
const claims = new Map();

function findAll() {
  return [...claims.values()];
}

function findById(id) {
  return claims.get(id);
}

function save(claim) {
  claims.set(claim.id, claim);
  return claim;
}

function remove(id) {
  return claims.delete(id);
}

module.exports = { findAll, findById, save, remove };
