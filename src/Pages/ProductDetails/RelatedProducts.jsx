import React from 'react';
import Card from '../../Component/Card.jsx';

const RelatedProducts = ({ products }) => {
  return (
    <div className="my-15 mx-auto max-w-7xl px-3">
      {/* Heading */}
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
        Related Products
      </h2>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        {products.map((item) => (
          <Card
             key={item.id}
              id={item.id}
              image={item.image}
              title={item.title}
              longDescription={item.longDescription}
              price={item.price}
              oldPrice={item.oldPrice}
              quantity={item.Quantity}
              category={item.category}
              subcategory={item.subcategory}
              slug={item.slug}
             
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
