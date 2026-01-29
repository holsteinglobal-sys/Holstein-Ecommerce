import React from 'react';
import { FaLeaf, FaVials, FaChartLine, FaShieldAlt } from 'react-icons/fa';

const Heading = () => {
  const features = [
    {
      icon: <FaLeaf className="text-4xl text-emerald-500" />,
      title: "Pure & Natural",
      description: "100% natural ingredients sourced from trusted farms to ensure the highest quality feed."
    },
    {
      icon: <FaVials className="text-4xl text-blue-500" />,
      title: "Scientifically Proven",
      description: "Scientifically developed formulas to support animal health, digestion, and immunity."
    },
    {
      icon: <FaShieldAlt className="text-4xl text-amber-500" />,
      title: "Trusted Quality",
      description: "Rigorous quality checks at every stage to deliver the most reliable feed solutions."
    },
    {
      icon: <FaChartLine className="text-4xl text-rose-500" />,
      title: "Higher Productivity",
      description: "Formulated to significantly improve milk yield and long-term livestock performance."
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12  backdrop-blur-sm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64  rounded-full blur-3xl -ml-32 -mt-32"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl -mr-48 -mb-48"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
            The Holstein Edge
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Why Choose Holstein <span className="text-primary italic">for Your Livestock?</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            We combine traditional wisdom with modern nutritional science to deliver premium cattle feed that actually makes a difference in your farm's productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group p-8 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="w-16 h-16 mb-8 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-500">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Heading;
