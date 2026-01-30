import React, { useState } from "react";
import Card from "../Component/Card.jsx";
import ProductImage from "../Component/ProductImage.jsx";
import { products } from "../Data/product.js";

const ProductPage = () => {
  const [filter, setFilter] = useState("All");

  const categories = [
    "All",
    ...new Set(products.map((p) => p.category)),
  ];

  const filteredProducts =
    filter === "All"
      ? products
      : products.filter(
          (product) => product.category === filter
        );

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4 min-h-screen p-24">
      <ProductImage />

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* CATEGORY BUTTONS */}
        <div className="flex space-x-4  pb-6 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`btn btn-outline btn-primary rounded-full capitalize
                ${
                  filter === cat
                    ? "bg-primary text-white border-primary"
                    : ""
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-5">
          {filteredProducts.map((item) => (
            <Card
              key={item.id}
              id={item.id}
              image={item.image}
              title={item.title}
              description={item.description}
              price={item.price}
              oldPrice={item.oldPrice}
              quantity={item.Quantity}

            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ProductPage;
