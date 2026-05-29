const prisma = require("../config/prisma");
const { asyncHandler } = require("../utils/helpers");

const listJobs = asyncHandler(async (req, res) => {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: "desc" } });
  res.json(jobs);
});

const getJob = asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { products: { select: { skuId: true, title: true } } },
  });
  if (!job) return res.status(404).json({ error: "Job not found." });

  const parsed = { ...job, errorDetails: job.errorDetails ? JSON.parse(job.errorDetails) : null };
  res.json(parsed);
});

module.exports = { listJobs, getJob };
