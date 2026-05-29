const { toNumber } = require("../utils/helpers");

const SEVERITY_PENALTY = { HIGH: 25, MEDIUM: 12, LOW: 5 };

const MIN_TITLE_LENGTH = 15;
const MIN_TITLE_WORDS = 3;
const MIN_DESCRIPTION_LENGTH = 30;

function validateProduct(product, existingSkuCounts = {}) {
  const issues = [];
  const add = (issueType, severity, message, suggestedFix) =>
    issues.push({ issueType, severity, message, suggestedFix });

  const title = (product.title || "").trim();
  if (!title) {
    add("MISSING_TITLE", "HIGH", "Product has no title.", "Add a clear product title.");
  } else if (title.length < MIN_TITLE_LENGTH || title.split(/\s+/).length < MIN_TITLE_WORDS) {
    add(
      "WEAK_TITLE",
      "MEDIUM",
      "Title is too short or weak.",
      "Add brand, product type, color, gender, or material."
    );
  }

  if (!(product.brand || "").trim()) {
    add("MISSING_BRAND", "MEDIUM", "Brand is missing.", "Add brand if known, or mark as unbranded.");
  }

  const price = toNumber(product.price);
  const mrp = toNumber(product.mrp);
  if (price === null || price <= 0) {
    add("INVALID_PRICE", "HIGH", "Price is missing or not a positive number.", "Price should be positive and numeric.");
  }
  if (price !== null && mrp !== null && mrp < price) {
    add("MRP_LOWER_THAN_PRICE", "HIGH", "MRP is lower than the selling price.", "Correct MRP or selling price.");
  }

  const imageUrl = (product.imageUrl || "").trim();
  if (!imageUrl) {
    add("MISSING_IMAGE", "HIGH", "No product image provided.", "Add at least one product image.");
  } else if (!/^https?:\/\/.+/i.test(imageUrl)) {
    add("BROKEN_IMAGE_URL", "MEDIUM", "Image URL looks invalid.", "Replace with an accessible image URL.");
  }

  if (product.skuId && existingSkuCounts[product.skuId] > 1) {
    add("DUPLICATE_SKU", "HIGH", "Duplicate SKU ID found.", "Keep SKU IDs unique.");
  }

  if ((product.description || "").trim().length < MIN_DESCRIPTION_LENGTH) {
    add("WEAK_DESCRIPTION", "LOW", "Description is missing or too short.", "Add more product details and attributes.");
  }

  const missingAttrs = ["color", "size", "material", "category"].filter(
    (key) => !(product[key] || "").toString().trim()
  );
  if (missingAttrs.length > 0) {
    add(
      "MISSING_ATTRIBUTES",
      "MEDIUM",
      `Missing important attributes: ${missingAttrs.join(", ")}.`,
      "Add color, size, material, gender, or category-specific attributes."
    );
  }

  if ((product.availability || "").trim() === "out_of_stock") {
    add("OUT_OF_STOCK", "LOW", "Product is out of stock.", "Mark separately or notify operations team.");
  }

  return issues;
}

function computeQualityScore(issues) {
  const penalty = issues.reduce((sum, issue) => sum + (SEVERITY_PENALTY[issue.severity] || 0), 0);
  return Math.max(0, 100 - penalty);
}

module.exports = { validateProduct, computeQualityScore };
