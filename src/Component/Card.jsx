import { useNavigate } from "react-router-dom";

const Card = ({ id, image, title, description }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="flex justify-center m-4">
      <div
        onClick={handleCardClick}
        className="card bg-base-100 w-64 shadow-sm mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
      >
        <figure className="h-72 bg-gray-100 flex items-center justify-center">
          <img
            src={image}
            alt={title}
            className="h-full max-w-full object-contain"
          />
        </figure>

        <div className="card-body">
          <h2 className="card-title">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>

          {/* Button does NOT trigger navigation */}
          <div className="card-actions justify-center mt-4">
            <button
              className="btn btn-primary  rounded-full"
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
