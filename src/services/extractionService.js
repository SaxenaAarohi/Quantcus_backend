function simulateExtractionFromVideo(originalFilename) {

  const skuId = `DRAFT-${Date.now().toString().slice(-6)}`;

  const product = {
    skuId,
    source: "VIDEO",
    title: "",
    brand: "",
    category: "",
    description: "",
    color: "",
    size: "",
    material: "",
    price: null,
    mrp: null,
    imageUrl: "",
    availability: "",
  };

  return {
    product,
    note: `Draft listing created from "${originalFilename}". Add the product details (title, category, price, image, etc.) to complete it.`,
  };
}

module.exports = { simulateExtractionFromVideo };
