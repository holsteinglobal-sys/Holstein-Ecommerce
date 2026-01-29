import React, { useState } from "react";
import { useCart } from "../CartContext/CartContext.jsx";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
// import { toast } from 'react-toastify';
// import Cart from "../Cart.jsx";
import toast from "react-hot-toast";


const PriceSection = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [pincode, setPincode] = useState('');
  const [checkStatus, setCheckStatus] = useState(null); // null, 'checking', 'available', 'unavailable'
  const [shippingMsg, setShippingMsg] = useState('');

  const {
    price,
    oldPrice,
    title,
    stock = "In Stock",
    delivery = "2-5 days",
    Quantity 
  } = product;

  const discount = oldPrice
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : null;

  const checkAvailability = async () => {
      if(!pincode || pincode.length < 6) {
          toast.error("Please enter a valid PIN code");
          return;
      }
      setCheckStatus('checking');
      try {
          // Check if pincode exists in any rule's array
          const q = query(
              collection(db, "shipping_rules"), 
              where("pinCodes", "array-contains", pincode),
              where("isActive", "==", true)
          );
          const querySnapshot = await getDocs(q);
          
          if(!querySnapshot.empty) {
              const rule = querySnapshot.docs[0].data();
              setCheckStatus('available');
              setShippingMsg(`Available! Shipping: ₹${rule.shippingCharge}`);
          } else {
              setCheckStatus('unavailable');
              setShippingMsg("Not available in this area.");
          }
      } catch (error) {
          console.error(error);
          setCheckStatus('unavailable');
          toast.error("Error checking availability");
      }
  };

  return (
    <div className="mt-4 p-6 rounded-2xl bg-base-200 flex flex-col justify-between">
      {/* TOP CONTENT */}
      <div className="space-y-5">
        {/* Price */}
        <div className="flex items-end gap-4">
          <span className="text-4xl font-bold text-black">₹{price}</span>

          {oldPrice && (
            <>
              <span className="text-lg line-through text-gray-400 mb-1">
                ₹{oldPrice}
              </span>
              <span className="text-sm font-semibold text-green-600">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        {/* Stock */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Availability:{" "}
            <span
              className={
                stock === "In Stock" ? "text-green-600" : "text-red-600"
              }
            >
              {stock}
            </span>
          </span>
          <span>Delivery: {delivery}</span>
        </div>

        {/* PIN Code Check */}
        <div className="p-4 rounded-xl  0">
             <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Check Delivery</label>
             <div className="flex gap-2 mt-2">
                 <input 
                    type="text" 
                    placeholder="Enter PIN Code" 
                    className="input  rounded-full bg-indigo-50 border-1
             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                     transition-all duration-200"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                 />
                 <button 
                    className={`btn rounded-full btn-info ${checkStatus === 'checking' ? 'loading' : ''}`}
                    onClick={checkAvailability}
                 >
                    Check
                 </button>
             </div>
             {checkStatus === 'available' && (
                 <p className="text-sm text-green-500 mt-2 font-medium skeleton skeleton-text">✓ {shippingMsg}</p>
             )}
             {checkStatus === 'unavailable' && (
                 <p className="text-sm text-red-500 mt-2 font-medium skeleton skeleton-text">✕ {shippingMsg}</p>
             )}
        </div>

        {/* Quick Info */}
        <div className="bg-base-100 rounded-xl p-4 border text-sm">
          <p className="font-semibold mb-3">Quick Info</p>

          <div className="grid grid-cols-2 gap-y-2 text-gray-600">
            <span className="font-medium">Net Weight:</span>
            <span>{ Quantity }</span>

            <span className="font-medium">Category:</span>
            <span>{product.category}</span>

            <span className="font-medium">Product:</span>
            <span>{title}</span>
          </div>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex gap-4 mt-6">
        <button
          className="btn rounded-full btn-primary flex-1"
          onClick={() => {
            addToCart(product);
              //  toast.success("Product added to cart");
             
          }}
        >
          Add to Cart
        </button>

        <button
          className="btn rounded-full btn-success flex-1"
          onClick={() => {
            addToCart(product);
            navigate("/cart");
          }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default PriceSection;
