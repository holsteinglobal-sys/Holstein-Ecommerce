import React from 'react';

const AboutHero = () => {
  return (
    <section className="min-h-screen flex items-center px-6 md:px-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96  rounded-full blur-3xl -mr-48 -mt-24 anime-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72  rounded-full blur-3xl -ml-36 -mb-24 anime-pulse-slow"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* <span className="inline-block px-4 py-1.5 mb-2 text-sm font-bold tracking-[0.3em] text-primary uppercase bg-primary/10 rounded-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            About Holstein
          </span> */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Nurturing Healthy Livestock, <br />
            <span className="text-primary italic font-medium">Empowering Farmers.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            At Holstein, we are dedicated to transforming the cattle feed industry through scientific precision and unwavering commitment to quality.
          </p>
        </div>
      </div>
      
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <div className="w-1 h-12 rounded-full bg-gradient-to-b from-primary to-transparent"></div>
      </div>
    </section>
  );
};

export default AboutHero;
