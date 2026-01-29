import React from 'react';

const BlogHero = () => {
  return (
    <div className='min-h-screen flex items-center px-6 md:px-12 relative overflow-hidden'>
    <section className="mb-55 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
      {/* Left Content */}
      <div className="md:w-1/2 space-y-6">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
          Our Blog & Insight
        </h1>

        <span className='text-lg text-gray-600 leading-relaxed max-w-lg'>
   Delivering
   <span className="text-rotate">
    <span>
      <span className="bg-teal-400 text-teal-800 px-2">Premium</span>
      <span className="bg-red-400 text-red-800 px-2">India Top</span>
      <span className="bg-blue-400 text-blue-800 px-2">India Best</span>
    </span>
  </span>Quality cattle feed solutions to keep your cattle healthy, productive, and thriving from pasture to barn.
  
</span>
        {/* <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
         Delivering Premium Quality cattle feed solutions to keep your cattle healthy, productive, and thriving from pasture to barn.
        </p> */}
      </div>

      {/* Right Side - Empty for your image */}
      <div className="md:w-1/2 flex justify-center mt-12 md:mt-0">
  <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
    
    {/* This is the background circle shape from your image */}
    <div className="absolute inset-0 bg-gray-50 rounded-full -z-10"></div>
    
    {/* Image Upload Element */}
    <img 
      src="/public/image/BlogImage.png" 
      alt="Blog Illustration" 
      className="w-full h-auto object-contain z-10"
    />
    
  </div>
</div>
    </section>
    </div>
  );
};

export default BlogHero;