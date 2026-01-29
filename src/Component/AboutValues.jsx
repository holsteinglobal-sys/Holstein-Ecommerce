import React from 'react';
import { FaShieldAlt, FaLightbulb, FaHandshake } from 'react-icons/fa';

const AboutValues = () => {
  const values = [
    {
      icon: <FaShieldAlt className="text-4xl text-primary" />,
      title: "Uncompromising Quality",
      description: "We source only the finest raw materials to ensure every bag of Holstein feed meets the highest nutritional standards."
    },
    {
      icon: <FaLightbulb className="text-4xl text-amber-500" />,
      title: "Scientific Innovation",
      description: "Our formulas are developed using the latest nutritional science to optimize animal health and productivity."
    },
    {
      icon: <FaHandshake className="text-4xl text-emerald-500" />,
      title: "Farmer-First Trust",
      description: "Building long-term relationships with farmers based on transparency, reliability, and consistent results."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12  relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Our Core Values</h2>
          <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {values.map((value, index) => (
            <div 
              key={index}
              className="group p-10 bg-white border border-gray-100 rounded-[40px] shadow-2xl shadow-gray-200/40 hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="w-16 h-16 mb-8 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-500">
                {value.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutValues;
