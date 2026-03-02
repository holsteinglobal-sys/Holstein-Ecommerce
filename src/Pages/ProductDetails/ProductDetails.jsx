import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import ProductRating from "../../Component/ProcustRating.jsx";
import ImageGallery from "./ImageGallery";
import PriceSection from "./PriceSection";
import ProductAccordion from "./ProductAccordion";
import RelatedProducts from "./RelatedProducts";
import Testimonial from "../../Component/Testimonial";
import toast from "react-hot-toast";
import { FaStar, FaUserCircle } from "react-icons/fa";
import { getProductReviews } from "../../services/reviewService";
import ProductDetailsSkeleton from "../../Component/Skeletons/ProductDetailsSkeleton";

const ProductDetails = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0 });

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      try {
        let productData = null;

        // 1. Try to fetch by ID (for transition support)
        if (slug.length >= 20) { // Firestore IDs are usually 20 chars
          const docRef = doc(db, "products", slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            productData = { id: docSnap.id, ...docSnap.data() };
          }
        }

        // 2. If not found or not a valid ID format, fetch by slug field
        if (!productData) {
          const q = query(collection(db, "products"), where("slug", "==", slug), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const d = querySnapshot.docs[0];
            productData = { id: d.id, ...d.data() };
          }
        }
        
        if (productData) {
          setProduct(productData);
          
          // Fetch reviews
          const reviewsData = await getProductReviews(productData.id);
          setReviews(reviewsData);
          if (reviewsData.length > 0) {
            const avg = reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length;
            setReviewStats({ average: avg, total: reviewsData.length });
          }
          
          // Fetch related products from same category
          if (productData.category) {
            const q = query(
              collection(db, "products"), 
              where("category", "==", productData.category),
              where("isVisible", "==", true),
              limit(5)
            );
            const relatedSnap = await getDocs(q);
            const related = relatedSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.id !== productData.id)
              .slice(0, 4);
            setRelatedProducts(related);
          }
        } else {
          toast.error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndRelated();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return <Navigate to="/product" replace />;
  }

  const images = product.ProductDetails?.length
    ? product.ProductDetails
    : [product.image];

  return (
    <div className="container mx-auto px-4 pt-5 md:pt-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* LEFT */}
        <ImageGallery images={images} title={product.title} />

        {/* RIGHT */}
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">
            {product.title}
          </h1>

          <p className="mt-6 text-gray-500 text-lg leading-relaxed">
            {product.description}
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
      {relatedProducts.length > 0 && (
        <RelatedProducts products={relatedProducts} />
      )}

      {/* REVIEWS SECTION */}
      <div className="mt-12 md:mt-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Customer Reviews</h2>
            <div className="flex items-center gap-3">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar key={s} className={s <= Math.round(reviewStats.average) ? "fill-current" : "text-gray-200"} />
                ))}
              </div>
              <span className="text-gray-600 font-bold">{reviewStats.average.toFixed(1)} based on {reviewStats.total} reviews</span>
            </div>
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                    <FaUserCircle size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{review.userName}</h4>
                    <div className="flex text-yellow-400 text-xs">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar key={s} className={s <= review.rating ? "fill-current" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-gray-400">
                    {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
      
      {/* <Testimonial className="mt-20 w-full" /> */}
    </div>
  );
};

export default ProductDetails;
