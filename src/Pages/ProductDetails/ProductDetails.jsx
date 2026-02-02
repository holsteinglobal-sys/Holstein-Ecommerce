import { useParams } from "react-router-dom";
import { products } from "../../Data/product";
import ProductRating from "../../Component/ProcustRating.jsx";
import ImageGallery from "./ImageGallery";
import PriceSection from "./PriceSection";
import ProductAccordion from "./ProductAccordion";
import RelatedProducts from "./RelatedProducts";
import Testimonial from "../../Component/Testimonial";



const ProductDetails = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return <div className="text-center mt-32">Product not found</div>;
  }

  const images = product.ProductDetails?.length
    ? product.ProductDetails
    : [product.image];

  return (
    <div className="container mx-auto px-4 pt-32 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* LEFT */}
        <ImageGallery images={images} title={product.title} />

        {/* RIGHT */}
        <div>
          <h1 className="text-3xl font-bold">{product.title}</h1>

          <p className="mt-4 text-gray-600 leading-relaxed">
            {product.longDescription}
          </p>

          <PriceSection
            price={product.price}
            oldPrice={product.oldPrice}
            title={product.title}
            product={product}
          />

         
        </div>
      </div>

      {/* ACCORDION FULL WIDTH */}
      <ProductAccordion longDescription={product.longDescription} />

      {/* RELATED PRODUCTS */}
      <RelatedProducts products={products.slice(0, 20)} />
      <Testimonial
      className="mt-20 w-23"
      />
      {/* <ProductRating/> */}
    </div>
  );
};

export default ProductDetails;
