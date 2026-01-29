import React from 'react';

const AboutContent = () => {
  return (
    <section className="py-40 px-6 md:px-12  relative overflow-hidden ">
      {/* Decorative background element */}
      <div className="absolute top-1/2 left-0 w-96 h-96  rounded-full blur-3xl -translate-y-1/2 -ml-48"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Image/Visual Side */}
          <div className="relative group">
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 aspect-square lg:aspect-auto lg:h-[600px]">
              <img 
                src="/public/image/Final-Logo-1.jpg" 
                alt="Holstein Heritage" 
                className="w-full h-full object-contain bg-white p-12 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Design accents */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-full -z-0"></div>
            <div className="absolute -bottom-10 -left-10 p-8 bg-primary rounded-3xl text-white shadow-xl max-w-[240px] z-20 hidden md:block">
              <span className="text-4xl font-black block mb-1">2001</span>
              <p className="text-sm font-bold opacity-90 leading-tight">Founded as Mahajan Molasses Company</p>
            </div>
          </div>

          {/* Text/Content Side */}
          <div className="space-y-8">
            <span className="inline-block px-4 py-1.5 text-sm font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
              Our Heritage
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              A Legacy of <span className="text-primary italic">Excellence in Nutrition.</span>
            </h2>
            
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed text-justify">
              <p>
                Holstein Nutrition is established as a leading livestock feed-producing company, born from the strong foundations of <span className="text-gray-900 font-bold">MMC Group</span>. Founded in 2001 under the name Mahajan Molasses Company, our journey began with a simple mission: to supply top-quality raw materials to the industry.
              </p>
              
              <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm italic text-primary font-medium">
                "Our connection to MMC Group gives us unprecedented access to the finest ingredients like molasses, maize, and DORB, ensuring your cattle receive only the best."
              </div>

              <p>
                As a proud subsidiary, Holstein leverages MMC's decades of expertise in ingredient processing. This deep-rooted knowledge allows us to formulate balanced, high-performance cattle feed that supports superior health and maximized productivity for livestock across India.
              </p>
              
              <p>
                Together, we are not just selling feed; we are building a more prosperous future for the farming community by delivering nutrition you can trust and growth you can see.
              </p>
            </div>

            <div className="pt-6">
              <button className="px-10 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                Explore Our Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutContent;