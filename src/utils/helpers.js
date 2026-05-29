function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { asyncHandler, toNumber, randomItem, round2 };
