import HomeImage from "./HomeImage.jsx";
import Heading from "../Component/Heading.jsx";
import Card from "../Component/Card.jsx";
import Heading2 from "../Component/Heading2.jsx";
import Testimonial from "../Component/Testimonial.jsx";
import Timeline from "../Component/Timeline.jsx";
import { getProducts } from "../services/adminService.js";
import { getLatestReviews, getTopRatedReviews } from "../services/reviewService.js";
import { useState, useEffect } from "react";
import { MdHourglassEmpty, MdFormatQuote, MdStars,MdShoppingCart } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import ProductCardSkeleton from "../Component/Skeletons/ProductCardSkeleton.jsx";





const Home = () => {
 
    const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [latestReviews, setLatestReviews] = useState([]);
    const [topRatedReviews, setTopRatedReviews] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, reviewsData, topReviewsData] = await Promise.all([
          getProducts(),
          getLatestReviews(3), // Show top 3 latest
          getTopRatedReviews(4) // Get all 4+ star reviews
        ]);
        setProducts(productsData.filter(p => p.isVisible !== false));
        setLatestReviews(reviewsData);
        setTopRatedReviews(topReviewsData);
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
  }, []);
   const filteredProducts = products.filter(product => {
    const matchesCategory = filter === "All" || product.category === filter;
   
    return matchesCategory ;
  });
   
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
      {/* <Navbar /> */}
      <HomeImage/>

            
 {/* {filteredProducts.length > 0 ? (
          <div className="">
            {filteredProducts.map((item) => (
              <Card
                key={item.id}
                id={item.id}
                image={item.image}
                title={item.title}
                longDescription={item.longDescription}
                price={item.price}
                oldPrice={item.oldPrice}
                quantity={item.Quantity}
                category={item.category}
                subcategory={item.subcategory}
                slug={item.slug}
              />
            ))}
          </div>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}
            */}



           <div className="my-10 mx-auto max-w-7xl px-2">
      {/* Heading */}
      <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center  gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-black tracking-widest uppercase">
              <MdShoppingCart /> Catalog 2025
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
              Our <span className="text-primary italic">Premium</span> Products
            </h2>
            <p className="text-gray-400 font-medium max-w-2xl mx-auto">
              Explore our range of scientifically formulated feeds designed for maximum health and productivity.
            </p>
          </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-10">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-10">
            {filteredProducts.map((item) => (
              <Card
                key={item.id}
                id={item.id}
                image={item.image}
                title={item.title}
                longDescription={item.longDescription}
                price={item.price}
                oldPrice={item.oldPrice}
                quantity={item.Quantity}
                category={item.category}
                subcategory={item.subcategory}
                slug={item.slug}
                description={item.description}
              />
            ))}
          </div>
        ) : (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-gray-500">
            <MdHourglassEmpty size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-lg">No products found</p>
          </div>
        )}
    </div>

       
          
        


    {/* CUSTOMER REVIEWS SECTION */}
    {/* {latestReviews.length > 0 && (
      <div className="py-20 bg-white/30 backdrop-blur-sm mt-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">What Our Customers Say</h2>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestReviews.map((review) => (
              <div key={review.id} className="relative bg-white p-8 rounded-[2rem] shadow-xl shadow-indigo-500/5 border border-indigo-50 group hover:-translate-y-2 transition-all duration-300">
                <MdFormatQuote className="absolute top-6 right-8 text-6xl text-indigo-100" />
                
                <div className="relative">
                  <div className="flex text-yellow-400 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar key={s} className={s <= review.rating ? "fill-current" : "text-gray-200"} size={16} />
                    ))}
                  </div>
                  
                  <p className="text-gray-600 leading-relaxed italic mb-8 min-h-[5rem]">
                    "{review.comment}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{review.userName}</h4>
                      <p className="text-primary text-xs font-semibold">{review.productTitle || 'Verified Customer'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )} */}

    <Timeline/>
      {/* <Heading2 /> */}
      {/* <Testimonial /> */}

      {/* WALL OF LOVE - 4+ RATING REVIEWS */}
      {topRatedReviews.length > 0 && (
        <div className="py-24   ">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                <MdStars /> Wall of Love
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Our Happy Family</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">See why thousands of farmers trust Holstein Global for their livestock needs.</p>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
              {topRatedReviews.map((review) => (
                <div key={review.id} className="break-inside-avoid bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                  <div className="flex text-yellow-400 mb-4 scale-90 origin-left">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FaStar key={s} className={s <= review.rating ? "fill-current" : "text-gray-200"} size={16} />
                    ))}
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-6 font-medium">
                    "{review.comment}"
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center font-bold">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{review.userName}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{review.productTitle || 'Verified Buyer'}</p>
                        </div>
                     </div>
                     <MdFormatQuote className="text-3xl text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
