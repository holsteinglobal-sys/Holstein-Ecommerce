import React from "react";
import Accordion from "./Accordion";

const FAQ = () => {
  const faqItems = [
    {
      title: "Which cattle feed is best for increasing milk production?",
      content: "Our high-protein balanced cattle feed is specially formulated to improve digestion, boost milk yield, and maintain animal health for both cows and buffaloes."
    },
    {
      title: "Is this feed suitable for calves?",
      content: "Yes, we offer a dedicated calf starter feed that supports early growth, immunity development, and better weight gain during the initial stages."
    },
    {
      title: "How much cattle feed should be given daily?",
      content: "The daily quantity depends on the animal’s body weight, milk production level, and stage of lactation. Our team recommends a customized feeding plan for best results."
    },
    {
      title: "Does your cattle feed improve digestion and immunity?",
      content: "Absolutely. Our formulations include essential minerals, probiotics, and vitamins that enhance digestion, fertility, and overall immunity of livestock."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-4xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-primary uppercase bg-primary/5 rounded-full">
            Knowledge Base
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Cattle Feed <span className="text-primary italic">FAQs</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium">
            Everything you need to know about Holstein's premium nutrition.
          </p>
        </div>

        {/* FAQ Items */}
        <Accordion items={faqItems} />

      </div>
    </section>
  );
};

export default FAQ;

