const { KEYWORD_BANK } = require("../utils/mockData");

function enhanceTitle(product) {
  const originalTitle = (product.title || "").trim();

  const attributes = {
    brand: (product.brand || "").trim(),
    color: (product.color || "").trim(),
    productType: (product.category || "").trim(),
    material: (product.material || "").trim(),
    size: (product.size || "").trim(),
  };

  const bank = KEYWORD_BANK[attributes.productType] || KEYWORD_BANK.GENERIC;
  const keywords = bank.slice(0, 3);

  const parts = [
    attributes.brand,
    attributes.color,
    keywords[0],
    attributes.material ? `${attributes.material} Upper` : "",
  ].filter(Boolean);

  const seen = new Set();
  const words = [];
  parts
    .join(" ")
    .split(/\s+/)
    .forEach((word) => {
      const key = word.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        words.push(word);
      }
    });

  const enhancedTitle =
    words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || originalTitle;

  const reason =
    "Combined the product attributes (" +
    Object.entries(attributes)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ") +
    `) with trending keywords (${keywords.join(", ")}) to make the title more descriptive and searchable.`;

  return { originalTitle, attributes, keywords, enhancedTitle, reason };
}

module.exports = { enhanceTitle };
