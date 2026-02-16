import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const HomeImage = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // You can easily update these image paths below
  const slides = [
    {
      url: "/public/image/Higher Milk Yield.png",
      title: "NUTRITION YOU CAN TRUST,",
      subtitle: "GROWTH YOU CAN SEE!",
      description: "Delivering Premium Quality cattle feed solutions to keep your cattle healthy, productive, and thriving.",
    },
    {
      url: "/public/image/xtra milk 8000.webp",
      title: "PREMIUM CATTLE FEED,",
      subtitle: "EXPERT SOLUTIONS",
      description: "Scientifically formulated nutrition for maximum yield and livestock wellness.",
    },
    {
      url: "/public/image/ULTIMATE.webp",
      title: "MAXIMIZE PRODUCTIVITY,",
      subtitle: "SUPERIOR RESULTS",
      description: "Empowering farmers with the best nutritional technology for their livestock.",
    },
    {
      url: "/public/image/post-20.webp",
      title: "QUALITY YOU CAN FEEL,",
      subtitle: "TRUSTED NUTRITION",
      description: "Sustainable and high-performance feed solutions for modern dairy farming.",
    },
  ];

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.8 },
        scale: { duration: 1.1, ease: "easeOut" },
      },
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.1 },
      },
    }),
  };

  return (
    <section className="relative w-full overflow-hidden ">
      {/* Ghost Image to maintain aspect ratio and container height without cropping */}
      <img 
        src={slides[0].url} 
        alt="layout-placeholder" 
        className="w-full h-auto invisible select-none pointer-events-none"
      />

      {/* Background Slider */}
      <div className="absolute inset-0 ring-1 ring-white/5">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 h-full w-full"
          >
            {/* Background Image with Overlay */}
            <div className="relative h-full w-full">
              <img
                src={slides[currentIndex].url}
                alt={slides[currentIndex].title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0  to-transparent"></div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Layer */}
      {/* <div className="relative z-10 flex h-full items-center px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-3xl space-y-6"
          > */}
            {/* <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white uppercase tracking-tight">
              {slides[currentIndex].title} <br />
              <span className="text-primary">{slides[currentIndex].subtitle}</span>
            </h1> */}

            {/* <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-2xl font-medium">
              {slides[currentIndex].description}
            </p>

            <div className="flex flex-wrap gap-4 pt-6"> */}
              {/* <button
                onClick={() => navigate("/product")}
                className="group relative overflow-hidden bg-primary text-white px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/30"
              >
                <span className="relative z-10">Explore Products</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0"></div>
              </button> */}

              {/* <button
                onClick={() => navigate("/about")}
                className="px-8 py-4 rounded-full text-lg font-bold border-2 border-white/50 text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/10 active:scale-95"
              >
                Learn More
              </button> */}
            {/* </div>
          </motion.div>
        </div>
      </div> */}

      {/* Navigation Controls */}
      {/* <div className="absolute bottom-12 left-6 md:left-12 lg:left-24 z-20 flex items-center gap-8"> */}
        {/* Pagination Dots */}
        {/* <div className="flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={`h-2 transition-all duration-300 rounded-full ${
                index === currentIndex ? "w-12 bg-primary" : "w-3 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrow Buttons */}
        {/* <div className="flex gap-2">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full border border-white/30 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white active:scale-90"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full border border-white/30 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white active:scale-90"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div> */} 

      {/* Slide number indicator */}
      {/* <div className="absolute top-1/2 right-12 -translate-y-1/2 z-20 hidden lg:block">
        <div className="flex flex-col items-center gap-4">
           <span className="text-white/40 text-sm font-bold rotate-90 mb-4">DISCOVER</span>
           <div className="w-px h-24 bg-gradient-to-b from-white/0 via-white/40 to-white/0"></div>
           <span className="text-primary text-2xl font-black">0{currentIndex + 1}</span>
           <span className="text-white/20 text-lg font-bold">0{slides.length}</span>
        </div>
      </div> */}
    </section>
  );
};

export default HomeImage;
