const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const uploadController = require("../controllers/uploadController");
const jobController = require("../controllers/jobController");
const productController = require("../controllers/productController");
const dashboardController = require("../controllers/dashboardController");
const competitorController = require("../controllers/competitorController");
const alertController = require("../controllers/alertController");

router.post("/upload-video", upload.single("video"), uploadController.uploadVideo);
router.post("/upload-products-csv", upload.single("csv"), uploadController.uploadProductsCsv);

router.get("/jobs", jobController.listJobs);
router.get("/jobs/:id", jobController.getJob);

router.get("/products", productController.listProducts);
router.get("/products/:skuId", productController.getProduct);
router.put("/products/:skuId", productController.updateProduct);
router.get("/products/:skuId/issues", productController.getProductIssues);
router.post("/products/:skuId/enhance-title", productController.enhanceProductTitle);
router.get("/products/:skuId/competitor-prices", productController.getCompetitorPrices);

router.get("/dashboard/summary", dashboardController.getQualitySummary);
router.get("/dashboard/quality-summary", dashboardController.getQualitySummary);

router.post("/competitor-prices/upload", upload.single("csv"), competitorController.uploadCompetitorCsv);
router.post("/competitor-prices/refresh", competitorController.refreshPrices);

router.get("/alerts", alertController.listAlerts);

module.exports = router;
