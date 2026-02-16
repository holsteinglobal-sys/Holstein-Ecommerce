import React from 'react';
import { motion } from 'framer-motion';

const AboutHero = () => {
  return (
    <section className="relative w-full overflow-hidden shadow-inner">
      {/* Background Image - Sized naturally to avoid cropping */}
      <div className="relative w-full">
        <img
          src="/public/image/About.png" 
          alt="About Us"
          className="w-full h-auto block"
        />
        <div className="absolute inset-0 "></div>
      </div>

      {/* <div className="absolute inset-0 z-10 flex items-center justify-center px-6 md:px-12 text-center pointer-events-none">
        <div className="pointer-events-auto max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          <span className="inline-block px-4 py-1.5 mb-2 text-sm font-bold tracking-[0.3em] text-primary uppercase bg-primary/10 backdrop-blur-md border border-primary/20 rounded-full">
            Our Story
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-extrabold text-white leading-tight">
            Nurturing Healthy Livestock, <br />
            <span className="text-primary italic font-medium">Empowering Farmers.</span>
          </h1>
          <p className="text-base md:text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-3xl mx-auto hidden sm:block">
            At Holstein, we are dedicated to transforming the cattle feed industry through scientific precision and unwavering commitment to quality.
          </p>
        </motion.div>
      </div>
    </div> */}
    </section>
  );
};

export default AboutHero;
