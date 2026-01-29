import React from "react";
import { useNavigate } from "react-router-dom";


const HomeImage = () => {

    const navigate = useNavigate();
  return (
        <section className="min-h-screen  flex items-center px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* LEFT CONTENT */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-4xl font-bold leading-tight text-gray-900">
          NUTRITION YOU CAN TRUST, <br />
            <span className="text-primary">GROWTH YOU CAN SEE!</span>
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

         <div className="flex gap-4 pt-4 mt-10">
      <button
        onClick={() => navigate("/product")}
        className="btn btn-primary btn-lg rounded-full"
      >
        Explore Products
      </button>

      <button
        onClick={() => navigate("/about")}
        className="btn btn-outline btn-lg rounded-full"
      >
        Learn More
      </button>
    </div>
        </div>

        {/* RIGHT SIDE – GREEN CIRCLE SLIDER */}
        <div className="relative flex justify-center items-center">

          <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px]  overflow-hidden flex items-center justify-center">

            {/* Product Images */}
            <img src="public/image/xtra-milk-8000.webp" className="hero-img hero-1" />
            <img src="public/image/xtra-milk-prime.webp" className="hero-img hero-2" />
            <img src="public/image/transition-wellness-pre-20.webp" className="hero-img hero-3" />
            <img src="public/image/transition-wellness-post-20.webp" className="hero-img hero-4" />
            <img src="public/image/xtra-milk.webp" className="hero-img hero-5" />

          </div>

          {/* Decorative dots */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-orange-400 rounded-full opacity-80"></div>
          <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-yellow-400 rounded-full opacity-80"></div>
        </div>
      </div>

      {/* Animation CSS */}
      <style>
{`
  .hero-img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
    opacity: 0;
    animation: heroFade 15s infinite;
    will-change: transform, opacity;
    pointer-events: none;
  }

  .hero-1 { animation-delay: 0s; }
  .hero-2 { animation-delay: 3s; }
  .hero-3 { animation-delay: 6s; }
  .hero-4 { animation-delay: 9s; }
  .hero-5 { animation-delay: 12s; }

  .from-right {
    --start-x: 50px;
    --end-x: -50px;
  }

  .from-left {
    --start-x: -50px;
    --end-x: 50px;
  }

  @keyframes heroFade {
    0% {
      opacity: 0;
      transform: translateX(var(--start-x)) scale(0.95);
    }
    10% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    30% {
      opacity: 1;
    }
    40% {
      opacity: 0;
      transform: translateX(var(--end-x)) scale(0.95);
    }
    100% {
      opacity: 0;
    }
  }
`}
</style>

    </section>
  );
};

export default HomeImage;
