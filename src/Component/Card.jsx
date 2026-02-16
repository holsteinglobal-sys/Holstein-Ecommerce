import { useNavigate } from "react-router-dom";
import { MdArrowForward, MdOutlineLocalOffer } from "react-icons/md";

const Card = ({ id, image, title, longDescription, price, oldPrice, quantity, category, subcategory, slug , description}) => {
  const navigate = useNavigate();
  console.log("its a Price" ,price)
  console.log("its a Title" ,title)
   console.log("its a oldPrice" ,oldPrice)
    console.log("its a quantity" ,quantity)
     console.log("its a category" ,category)
     console.log("its a subcatagry" , subcategory)
  
  const handleCardClick = () => {
    navigate(`/product/${slug || id}`);
  };

  const discount = oldPrice && oldPrice > price 
    ? Math.round(((oldPrice - price) / oldPrice) * 100) 
    : 0;
  return (
    <div className="group relative w-full h-full">
      <div
        onClick={handleCardClick}
        className="relative flex flex-col w-full h-full bg-white rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 group-hover:-translate-y-1.5 cursor-pointer"
      >
        {/* Discount Badge */}
        {/* {discount > 0 && (
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-500/30">
            <MdOutlineLocalOffer className="text-[10px] md:text-xs" />
            {discount}% OFF
          </div>
        )} */}

        {/* Image Container */}
        <div className="relative h-40 sm:h-52 md:h-64 lg:h-72 w-full bg-gray-100 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          {/* Subtle Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <img
            src={image}
            alt={title}
            className="h-full w-full object-contain transform group-hover:scale-105 transition-transform duration-700 ease-out z-10"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/150?text=No+Image";
            }}
          />
           {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-500/30">
            <MdOutlineLocalOffer className="text-[10px] md:text-xs" />
            {discount}% OFF
          </div>
        )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col bg-white">
          <div className="flex-1">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors mb-1 md:mb-2">
              {title}
            </h2>
            
            {subcategory && (
              <span className="inline-block px-1.5 py-0.5 mb-2 bg-indigo-50 text-indigo-500 text-[8px] md:text-[10px] font-bold rounded-lg uppercase tracking-wider">
                {subcategory}
              </span>
            )}
            
            {/* Description hidden on mobile to keep balance, shown on md+ */}
            <p className="hidden md:block text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
              {/* {description} */}
            </p>
          </div>

          <div className="mt-auto space-y-3 md:space-y-4">
            {/* Price section */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5 md:gap-2">
                  <span className="text-base sm:text-lg md:text-xl font-black text-gray-900">
                    ₹{price.toLocaleString()}
                  </span>
                  {oldPrice && (
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 line-through decoration-red-400/50">
                      ₹{oldPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {quantity && (
                  <span className="text-[9px] md:text-[10px] text-gray-400 font-medium">
                     {quantity}
                  </span>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              className="w-full py-2 md:py-3 px-4 md:px-6 bg-gray-900 group-hover:bg-primary text-white rounded-xl md:rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-gray-900/5 group-hover:shadow-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${slug || id}`);
              }}
            >
              <span className="hidden sm:inline font-bold">Details</span>
              <span className="sm:hidden">View</span>
              <MdArrowForward className="text-base md:text-lg group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
