const MOCK_EXTRACTED_PRODUCTS = [
  {
    title: "Nike Shoes Blue",
    brand: "Nike",
    category: "Shoes",
    color: "Blue",
    material: "Mesh",
    price: 3999,
    mrp: 4999,
    description: "Comfortable running shoes.",
    availability: "in_stock",
    size: "9",
  },
  {
    title: "Red Dress",
    brand: "Zara",
    category: "Dresses",
    color: "Red",
    material: "Cotton",
    price: 1799,
    mrp: 2499,
    description: "Casual summer dress.",
    availability: "in_stock",
    size: "M",
  },
  {
    title: "Puma Backpack",
    brand: "Puma",
    category: "Bags",
    color: "Black",
    material: "Polyester",
    price: 1299,
    mrp: 1999,
    description: "",
    availability: "out_of_stock",
    size: "",
  },
  {
    title: "Boat Wireless Earbuds",
    brand: "boAt",
    category: "Electronics",
    color: "White",
    material: "Plastic",
    price: 1499,
    mrp: 2999,
    description: "True wireless earbuds with deep bass.",
    availability: "in_stock",
    size: "",
  },
];

const COMPETITOR_PLATFORMS = ["Amazon", "Myntra", "Ajio", "Meesho", "Nykaa"];

const KEYWORD_BANK = {
  Shoes: ["running shoes", "lightweight shoes", "sports shoes", "casual sneakers"],
  Dresses: ["summer dress", "party wear", "trendy outfit", "casual dress"],
  Bags: ["travel backpack", "waterproof bag", "laptop backpack", "everyday bag"],
  Electronics: ["wireless", "long battery life", "noise cancelling", "fast charging"],
  GENERIC: ["best seller", "premium quality", "top rated", "value for money"],
};

module.exports = {
  MOCK_EXTRACTED_PRODUCTS,
  COMPETITOR_PLATFORMS,
  KEYWORD_BANK,
};
