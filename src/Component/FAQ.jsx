import React from "react";
import { FaPlus, FaMinus } from "react-icons/fa6";

const FAQ = () => {
  return (
    <section className="py-24 px-6 md:px-12 ">
      <div className="max-w-4xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-primary uppercase  rounded-full">
            Knowledge Base
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Cattle Feed <span className="text-primary italic">FAQs</span>
          </h2>
          <p className="text-gray-600 text-lg md:text-xl">
            Everything you need to know about Holstein's premium nutrition.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {[
            {
              q: "Which cattle feed is best for increasing milk production?",
              a: "Our high-protein balanced cattle feed is specially formulated to improve digestion, boost milk yield, and maintain animal health for both cows and buffaloes."
            },
            {
              q: "Is this feed suitable for calves?",
              a: "Yes, we offer a dedicated calf starter feed that supports early growth, immunity development, and better weight gain during the initial stages."
            },
            {
              q: "How much cattle feed should be given daily?",
              a: "The daily quantity depends on the animal’s body weight, milk production level, and stage of lactation. Our team recommends a customized feeding plan for best results."
            },
            {
              q: "Does your cattle feed improve digestion and immunity?",
              a: "Absolutely. Our formulations include essential minerals, probiotics, and vitamins that enhance digestion, fertility, and overall immunity of livestock."
            }
          ].map((item, index) => (
            <div 
              key={index} 
              className="group collapse collapse-plus  border border-gray-200 rounded-[2rem] shadow-xl shadow-gray-200/40 hover:border-primary/20 transition-all duration-300"
            >
              <input type="radio" name="faq-accordion" defaultChecked={index === 0} />
              <div className="collapse-title text-xl font-bold py-6 px-8 flex items-center gap-4 text-gray-900 group-hover:text-primary transition-colors duration-300">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/5 text-primary text-xs flex items-center justify-center font-black">0{index + 1}</span>
                {item.q}
              </div>
              <div className="collapse-content px-8 pb-8 text-gray-600 leading-relaxed text-lg">
                <p className="border-t border-gray-50 pt-6">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FAQ;
