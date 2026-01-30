import { useNavigate } from "react-router-dom";

const Card = ({ id, image, title, description,price,oldPrice,quantity }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="flex justify-center m-4">
      <div
        onClick={handleCardClick}
        className="card bg-base-100 w-64 shadow-sm mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 "
      >
        <figure className="h-72 bg-gray-100 flex items-center justify-center">
          <img
            src={image}
            alt={title}
            className="h-full max-w-full object-contain "
          />
        </figure>

        <div className="card-body mb-1">
          <h2 className="card-title">{title}</h2>
          <p className="text-sm text-gray-600 ">{description}</p>
         

             <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary ">
              ₹{price}
            </span>
            {oldPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{oldPrice}
              </span>
              
            )}
             {quantity && (
            <p className="text-sm font-medium text-gray-700">
              {quantity}
            </p>
          )}
          </div>

          {/* Button does NOT trigger navigation */}
          <div className="card-actions justify-center mt-3">
            <button
              className="btn btn-soft btn-primary px-6 border-primary  rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${id}`);
              }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
