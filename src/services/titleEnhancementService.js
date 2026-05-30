const { KEYWORD_BANK } = require("../utils/mockData");

function enhanceTitle(product) {
  const originalTitle = (product.title || "").trim();
  const brand = (product.brand || "").trim();
  const color = (product.color || "").trim();
  const category = (product.category || "").trim();

  const keywords = KEYWORD_BANK[category] || KEYWORD_BANK.GENERIC;
  const keyword = keywords[0] || "";

  const parts = [brand, color, keyword || category];
  const enhancedTitle = parts.filter(Boolean).join(" ") || originalTitle;

  const reason = `Combined brand, color and category with the trending keyword "${keyword}".`;

  return { originalTitle, enhancedTitle, keywords: keywords.slice(0, 3), reason };
}

module.exports = { enhanceTitle };
