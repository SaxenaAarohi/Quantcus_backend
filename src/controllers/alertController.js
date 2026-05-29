const prisma = require("../config/prisma");
const { asyncHandler } = require("../utils/helpers");

const listAlerts = asyncHandler(async (req, res) => {
  const { severity } = req.query;
  const where = {};
  if (severity) where.severity = severity.toUpperCase();

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { skuId: true, title: true } } },
  });
  res.json(alerts);
});

module.exports = { listAlerts };
