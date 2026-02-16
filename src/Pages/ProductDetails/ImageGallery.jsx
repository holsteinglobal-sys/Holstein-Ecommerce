import { useState, useEffect, useRef } from "react";
import { MdZoomIn, MdClose } from "react-icons/md";

const ImageGallery = ({ images, title }) => {
  const [activeImage, setActiveImage] = useState(images[0]);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const containerRef = useRef(null);

  // Check if current screen is desktop (>= 768px for hover zoom)
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;

  // Reset active image whenever `images` prop changes
  useEffect(() => {
    setActiveImage(images[0]);
  }, [images]);

  const handleMouseMove = (e) => {
    if (!containerRef.current || !isDesktop) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="flex flex-col gap-4 ">
      {/* Main Image Container */}
      <div 
        ref={containerRef}
        className="relative group  rounded-2xl p-4 md:p-8 flex justify-center items-center border border-gray-100 overflow-hidden cursor-zoom-in h-[300px] md:h-[500px]"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => isDesktop && setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onClick={() => setShowLightbox(true)}
      >
        {/* Instruction overlay for desktop hover only */}
        {isDesktop && (
            <div className="absolute top-4 right-4 z-10  backdrop-blur-sm p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <MdZoomIn className="text-xl text-gray-600" />
            </div>
        )}

        <img
          src={activeImage}
          alt={title}
          style={{
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            transform: (isZoomed && isDesktop) ? "scale(2.2)" : "scale(1)",
          }}
          className={`max-h-full max-w-full object-contain ${isDesktop ? 'transition-transform duration-300 ease-out' : ''} pointer-events-none`}
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4  pb-2 scrollbar-hide ">
        {images.map((img, index) => (
          <button
            key={index}
            onClick={() => setActiveImage(img)}
            className={`w-16 h-16 min-w-[64px] rounded-xl bg-white flex items-center justify-center border
               transition-all duration-300 overflow-hidden
              ${activeImage === img ? "border-primary scale-105 shadow-md" : "border-gray-100 hover:border-gray-200"}`}
          >
            <img src={img} alt={`${title} thumb ${index}`} className="h-full w-full object-contain p-1" />
          </button>
        ))}
      </div>

      {/* Lightbox for Mobile/Tablet or detailed view */}
      {showLightbox && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setShowLightbox(false)}
        >
            <button 
                className="absolute top-6 right-6 text-white text-4xl hover:scale-110 transition-transform z-[110]"
                onClick={() => setShowLightbox(false)}
            >
                <MdClose />
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img 
                    src={activeImage} 
                    alt={title} 
                    className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
                />
                
                {/* Simplified guidance for mobile lightbox */}
                <p className="absolute bottom-10 text-white/60 text-sm font-medium">
                    Tap anywhere to close
                </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
