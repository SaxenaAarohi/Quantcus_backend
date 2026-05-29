const fs = require("fs");
const prisma = require("../config/prisma");
const { asyncHandler, toNumber } = require("../utils/helpers");
const { parseCsv } = require("../utils/csv");
const { simulateExtractionFromVideo } = require("../services/extractionService");
const { saveAndValidateProduct } = require("../services/productService");
const { enhanceTitle } = require("../services/titleEnhancementService");
const jobService = require("../services/jobService");

const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded. Use form field 'video'." });
  }

  const wantEnhance = req.body.enhanceTitle === "true" || req.body.enhanceTitle === true;

  const job = await jobService.createJob("VIDEO_PROCESSING");
  try {
    await jobService.startJob(job.id);

    const { product: draft, note } = simulateExtractionFromVideo(req.file.originalname);
    await jobService.updateProgress(job.id, 50, "Created draft listing from video.");

    draft.enhanceTitle = wantEnhance;
    draft.extractedAttributes = JSON.stringify({ sourceVideo: req.file.originalname, draft: true });
    draft.jobId = job.id;

    const { product, issues, qualityScore } = await saveAndValidateProduct(draft, {}, { skipAlerts: true });
    await jobService.updateProgress(job.id, 80, "Saved draft listing.");

    await jobService.completeJob(job.id, {
      status: "COMPLETED",
      message: `Draft listing ${product.skuId} created from video. Add the details to complete it.`,
    });

    res.status(201).json({
      jobId: job.id,
      jobStatus: "COMPLETED",
      draft: true,
      product,
      issues,
      qualityScore,
      note,
    });
  } catch (err) {
    await jobService.failJob(job.id, err.message);
    throw err;
  }
});

const uploadProductsCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded. Use form field 'csv'." });
  }

  const job = await jobService.createJob("CSV_VALIDATION");
  try {
    await jobService.startJob(job.id);

    const text = fs.readFileSync(req.file.path, "utf8");
    const rows = parseCsv(text);

    if (rows.length === 0) {
      await jobService.failJob(job.id, "CSV is empty or invalid.");
      return res.status(400).json({ error: "CSV is empty or invalid." });
    }

    const skuCounts = {};
    rows.forEach((r) => {
      const sku = (r.sku_id || "").trim();
      if (sku) skuCounts[sku] = (skuCounts[sku] || 0) + 1;
    });

    const saved = [];
    const failedRows = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const skuId = (row.sku_id || "").trim();
        if (!skuId) {
          failedRows.push({ row: i + 2, reason: "Missing sku_id (required)." });
          continue;
        }

        const productData = {
          skuId,
          title: row.product_title,
          description: row.description,
          brand: row.brand,
          category: row.category,
          price: toNumber(row.price),
          mrp: toNumber(row.mrp),
          imageUrl: row.image_url,
          productUrl: row.product_url,
          availability: row.availability,
          color: row.color,
          size: row.size,
          material: row.material,
          source: "CSV",
          jobId: job.id,
        };

        const { product } = await saveAndValidateProduct(productData, skuCounts);
        saved.push(product);
      } catch (rowErr) {
        failedRows.push({ row: i + 2, reason: rowErr.message });
      }

      await jobService.updateProgress(job.id, Math.round(((i + 1) / rows.length) * 90) + 10, `Processed ${i + 1}/${rows.length} rows.`);
    }

    const status = failedRows.length > 0 ? "PARTIALLY_COMPLETED" : "COMPLETED";
    await jobService.completeJob(job.id, {
      status,
      message: `Saved ${saved.length} products. ${failedRows.length} rows failed.`,
      errorDetails: failedRows.length > 0 ? failedRows : undefined,
    });

    res.status(201).json({
      jobId: job.id,
      jobStatus: status,
      savedCount: saved.length,
      failedRows,
      products: saved,
    });
  } catch (err) {
    await jobService.failJob(job.id, err.message);
    throw err;
  }
});

module.exports = { uploadVideo, uploadProductsCsv };
