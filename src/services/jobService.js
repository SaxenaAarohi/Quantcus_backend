const prisma = require("../config/prisma");

async function createJob(type) {
  return prisma.job.create({
    data: { type, status: "PENDING", progress: 0 },
  });
}

async function startJob(jobId) {
  return prisma.job.update({
    where: { id: jobId },
    data: { status: "RUNNING", progress: 10, startedAt: new Date(), message: "Processing started." },
  });
}

async function updateProgress(jobId, progress, message) {
  return prisma.job.update({
    where: { id: jobId },
    data: { progress, message },
  });
}

async function completeJob(jobId, { status = "COMPLETED", message, errorDetails } = {}) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status,
      progress: 100,
      completedAt: new Date(),
      message,
      errorDetails: errorDetails ? JSON.stringify(errorDetails) : undefined,
    },
  });
}

async function failJob(jobId, message, errorDetails) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      message,
      errorDetails: errorDetails ? JSON.stringify(errorDetails) : undefined,
    },
  });
}

module.exports = { createJob, startJob, updateProgress, completeJob, failJob };
