import React from 'react';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';

const Testimonial = () => {
  const testimonials = [
    {
      name: "Leslie Alexander",
      role: "Dairy Farmer, Punjab",
      content: "Holstein's cattle feed has significantly improved the milk yield of my cows. The scientific formula really makes a difference in their digestion and overall health.",
      avatar: "https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-male-1.png",
      rating: 5
    },
    {
      name: "Jacob Jones",
      role: "Livestock Manager",
      content: "Transitioning to Holstein was the best decision for our farm. The specialized feeding guide for different stages ensures our calves grow healthy and strong.",
      avatar: "https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-male-2.png",
      rating: 5
    },
    {
      name: "Arlene McCoy",
      role: "Progressive Farmer",
      content: "The support and quality Holstein provides are unparalleled. My livestock's immunity has visibly increased, and the results are consistent every season.",
      avatar: "https://cdn.rareblocks.xyz/collection/clarity/images/testimonial/4/avatar-female-1.png",
      rating: 5
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12  relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-96 h-96  rounded-full blur-3xl -mr-48 -mt-48"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
            Success Stories
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Our Happy Clients <span className="text-primary italic font-medium">Say About Us</span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg md:text-xl leading-relaxed">
            Join thousands of successful farmers who have transformed their livestock productivity with Holstein's premium feed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {testimonials.map((item, index) => (
            <div 
              key={index} 
              className="group relative p-10 bg-white border border-gray-100 rounded-[40px] shadow-2xl shadow-gray-200/40 hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
            >
              {/* Quote Icon Accent */}
              <div className="absolute top-8 right-10 text-6xl text-primary/5 group-hover:text-primary/10 transition-colors duration-500">
                <FaQuoteLeft />
              </div>

              <div className="relative z-10">
                {/* Rating */}
                <div className="flex gap-1 mb-8">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <FaStar key={i} className="text-amber-400 text-sm" />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="mb-10">
                  <p className="text-xl text-gray-700 leading-relaxed font-medium line-clamp-4 ">
                    "{item.content}"
                  </p>
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4 border-t border-gray-100 pt-8">
                  <img
                    className="w-14 h-14 rounded-2xl object-cover ring-4 ring-primary/5 group-hover:ring-primary/10 transition-all duration-500"
                    src={item.avatar}
                    alt={item.name}
                  />
                  <div>
                    <p className="text-lg font-bold text-gray-900">{item.name}</p>
                    <p className="text-sm font-medium text-gray-500">{item.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
