import React from 'react';
import Accordion from '../../Component/Accordion';

const ProductAccordion = ({ longDescription }) => {
  const items = [
    {
      title: "Product Details",
      content: longDescription || "No additional details available."
    },
    {
      title: "Payment Methods",
      content: "We support a variety of payment options including UPI (PhonePe, Google Pay, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) for eligible regions."
    },
    {
      title: "Good for the Planet",
      content: "Holstein Nutrition is committed to sustainability. Our packaging is designed to be eco-friendly, and our production processes prioritize minimal environmental impact."
    }
  ];

  return (
    <div className="mt-20 w-full">
      <Accordion items={items} />
    </div>
  );
};

export default ProductAccordion;

