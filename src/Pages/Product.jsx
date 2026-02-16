import React, { useState, useEffect } from "react";
import Card from "../Component/Card.jsx";
import ProductImage from "../Component/ProductImage.jsx";
import { getProducts, getCategories } from "../services/adminService";
import { MdKeyboardArrowDown, MdHourglassEmpty } from "react-icons/md";
import ProductCardSkeleton from "../Component/Skeletons/ProductCardSkeleton.jsx";

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [subFilter, setSubFilter] = useState("All");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(productsData.filter(p => p.isVisible !== false));
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading products or categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = ["All", ...categories.map(c => c.name)];
  const currentCategory = categories.find(c => c.name === filter);
  const currentSubcategories = currentCategory?.subcategories || [];

  const filteredProducts = products.filter(product => {
    const matchesCategory = filter === "All" || product.category === filter;
    const matchesSubcategory = subFilter === "All" || product.subcategory === subFilter;
    return matchesCategory && matchesSubcategory;
  });

  const handleCategoryChange = (cat) => {
    setFilter(cat);
    setSubFilter("All"); // Reset subfilter when main category changes
  };


  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-100 min-h-screen">
      <ProductImage />

      <main className="max-w-7xl mx-auto px-8 py-25">
        {/* CATEGORY NAV */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 mb-12 border-b border-indigo-100">
          <div className="flex flex-wrap gap-3">
            {mainCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`btn btn-sm md:btn-md rounded-full capitalize px-6 transition-all duration-300
                  ${
                    filter === cat
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                      : "bg-white/70 hover:bg-white text-gray-600 border-gray-200 backdrop-blur-sm"
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SUBCATEGORY DROPDOWN */}
          {filter !== "All" && currentSubcategories.length > 0 && (
            <div className="relative group w-full md:w-auto">
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 block md:absolute md:-top-6 md:left-2">
                Subcategory
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value)}
                  className="select outline-none select-bordered select-sm md:select-md w-full md:w-64 rounded-xl bg-white/100 border-indigo-200 focus:border-primary text-gray-700 font-medium"
                >
                  <option value="All">All {filter}</option>
                  {currentSubcategories.map((sub, i) => (
                    <option key={i} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* PRODUCT GRID */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-5">
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
                // description={item.description}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/50 backdrop-blur-md rounded-3xl border border-dashed border-indigo-200 animate-fadeIn">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdHourglassEmpty size={40} />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Coming Soon!</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We're currently preparing our finest <strong>{subFilter !== "All" ? subFilter : filter}</strong> products. Check back shortly!
            </p>
            <button 
              onClick={() => handleCategoryChange("All")}
              className="mt-8 text-primary font-bold hover:underline underline-offset-4"
            >
              Browse all available products
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;
