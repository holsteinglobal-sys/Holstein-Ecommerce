import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaWhatsapp,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp
} from "firebase/firestore";
import toast from "react-hot-toast";
import { FaXTwitter,FaYoutube } from "react-icons/fa6";

const Footer = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign up or log in first to redeem coupons!");
      navigate("/login");
      return;
    }

    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "coupons"), where("code", "==", couponCode.toUpperCase().trim()), where("isActive", "==", true));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Invalid or expired coupon code");
        setLoading(false);
        return;
      }

      const couponDoc = snapshot.docs[0];
      const couponData = couponDoc.data();

      if ((couponData.redemptionCount || 0) > 0) {
        toast.error("Coupon code already redeemed!");
        setLoading(false);
        return;
      }

      const redemptionQuery = query(
        collection(db, "redemptions"),
        where("userId", "==", currentUser.uid),
        where("couponCode", "==", couponData.code)
      );
      const redemptionSnapshot = await getDocs(redemptionQuery);

      if (!redemptionSnapshot.empty) {
        toast.error("You have already redeemed this coupon code!");
        setLoading(false);
        return;
      }

      const amountToCredit = couponData.value;
      const userRef = doc(db, "users", currentUser.uid);
      
      await updateDoc(userRef, {
        walletBalance: increment(amountToCredit)
      });

      await addDoc(collection(db, "wallet_transactions"), {
        userId: currentUser.uid,
        amount: amountToCredit,
        type: "credit",
        description: `Coupon Redeemed: ${couponCode.toUpperCase()}`,
        date: serverTimestamp()
      });

      await addDoc(collection(db, "redemptions"), {
        couponId: couponDoc.id,
        couponCode: couponData.code,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userEmail: currentUser.email,
        amount: amountToCredit,
        date: serverTimestamp()
      });

      await updateDoc(doc(db, "coupons", couponDoc.id), {
        redemptionCount: increment(1)
      });

      toast.success(`Success! ₹${amountToCredit} credited to your wallet.`);
      setCouponCode("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to redeem coupon.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className=" border-t relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand & Socials */}
          <div className="space-y-6">
            <Link to="/">
              <img
                src="/public/image/holstein-primary.png"
                alt="Holstein Logo"
                className="h-25 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-500 leading-relaxed text-sm max-w-xs mt-2">
              Empowering farmers with high-performance nutrition for a productive and sustainable dairy future.
            </p>
            <div className="flex gap-3">
              {[
                { icon: FaFacebookF, color: "hover:text-blue-600" },
                { icon: FaXTwitter, color: "hover:text-black" },
                { icon: FaInstagram, color: "hover:text-pink-600" },
                { icon: FaLinkedinIn, color: "hover:text-blue-700" },
                { icon: FaWhatsapp, color: "hover:text-green-600" },
                { icon: FaYoutube , color: "hover:text-red-600" }
              ].map((social, i) => (
                <span
                  key={i}
                  className={`w-10 h-10 rounded-lg  border border-gray-100 flex items-center justify-center text-gray-500 transition-all duration-300 cursor-pointer ${social.color} hover:bg-white hover:shadow-md hover:-translate-y-1`}
                >
                  <social.icon size={18} />
                </span>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-bold text-base mb-6 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm">
              {["Home", "Products", "Dealer & Distributor", "Career", "Contact Us"].map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase().replace(/ & /g, '').replace(/ /g, '')}`} className="hover:text-primary transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gray-900 font-bold text-base mb-6 uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm">
              {["FAQs", "Privacy Policy", "Terms of Service", "Refund Policy"].map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase().replace(/ /g, '-')}`} className="hover:text-primary transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Coupon */}
          <div className="space-y-8">
            <div>
              <h4 className="text-gray-900 font-bold text-base mb-6 uppercase tracking-wider">Contact</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li className="flex gap-3 items-center">
                  <FaEnvelope className="text-primary" />
                  <span className="text-gray-600 break-all">support@holsteinfeeds.com</span>
                </li>
                <li className="flex gap-3 items-center">
                  <FaPhoneAlt className="text-primary" />
                  <span className="text-gray-600">1800-296-5555</span>
                </li>
              </ul>
            </div>

            {/* Compact Coupon Box */}
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 group">
              <h5 className="text-gray-900 text-xs font-bold mb-3 flex items-center gap-2">
                <FaTicketAlt className="text-primary text-xl" /> Reddem Coupon
              </h5>
              <form onSubmit={handleRedeem} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Code"
                  className="flex bg-white border  px-1 border-gray-200 rounded-xl  py-2 text-xs focus:outline-none focus:border-primary transition-all text-gray-900"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {loading ? '...' : 'Apply'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-400">
          <p>© {new Date().getFullYear()} Holstein Nutrition. All rights reserved.</p>
          <div className="flex gap-8">
            <span>Punjab, India</span>
            <span className="text-primary/60 italic font-bold">Feeding the Future</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
