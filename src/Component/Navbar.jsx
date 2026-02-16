import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../Pages/CartContext/CartContext";
import ProfileAvtar from "./ProfileAvtar.jsx";
import { 
  HiHome, 
  HiInformationCircle, 
  HiViewGrid, 
  HiUserCircle, 
  HiShoppingCart,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlineViewGrid,
  HiOutlineUserCircle,
  HiOutlineShoppingCart,
  HiArrowLeft
} from "react-icons/hi";
import { FaPhoneAlt, FaShoppingCart, FaUserCircle } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, logout } = useAuth();
  const { cartItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const cartCount = cartItems.reduce((total, item) => total + (item.qty || 0), 0);
  // console.log(cartCount);
  

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to logout");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/", icon: HiOutlineHome, activeIcon: HiHome },
    { name: "About Us", path: "/about", icon: HiOutlineInformationCircle, activeIcon: HiInformationCircle },
    { name: "Product", path: "/product", icon: HiOutlineViewGrid, activeIcon: HiViewGrid },
    { name: "Blog", path: "/blog" },
    { name: "Contact Us", path: "/contact" },
  ];

  const dockItems = [
    { name: "Home", path: "/", icon: HiOutlineHome, activeIcon: HiHome },
    { name: "About", path: "/about", icon: HiOutlineInformationCircle, activeIcon: HiInformationCircle },
    { name: "Products", path: "/product", icon: HiOutlineViewGrid, activeIcon: HiViewGrid, center: true },
    { name: "Profile", path: currentUser ? "/profile" : "/login", icon: HiOutlineUserCircle, activeIcon: HiUserCircle },
    { name: "Cart", path: "/cart", icon: HiOutlineShoppingCart, activeIcon: HiShoppingCart },
  ];

  return (
    <>
      <nav className={`sticky top-0 left-0 w-full z-[100] transition-all duration-500 ${
        scrolled 
          ? "bg-white/80 backdrop-blur-lg shadow-lg py-2 md:py-3" 
          : "bg-white py-3 md:py-5"
      }`}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between relative h-full">
          
          {/* LOGO - TOP-LEFT ON MOBILE, LEFT ON DESKTOP */}
          <div className="flex items-center z-10 gap-2">
            {location.pathname === '/cart' && (
              <button 
                onClick={() => navigate(-1)} 
                className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-primary transition-colors flex items-center justify-center"
                aria-label="Back"
              >
                <HiArrowLeft size={24} />
              </button>
            )}
            <Link to="/" className="flex items-center group">
              <img
                src="/public/image/holstein-primary.png"
                alt="Holstein Logo"
                className="h-12 md:h-16 lg:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>

          {/* CENTER: DESKTOP MENU - HIDDEN ON MOBILE */}
          <div className="hidden lg:flex items-center">
            <ul className="flex gap-8 items-center">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    className={({ isActive }) =>
                      `text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:text-primary relative group ${
                        isActive ? "text-primary" : "text-gray-600"
                      }`
                    }
                  >
                    {link.name}
                    <span className={`absolute -bottom-2 left-0 h-0.5 bg-primary transition-all duration-300 ${location.pathname === link.path ? "w-full" : "w-0 group-hover:w-full"}`}></span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: ICONS (DESKTOP & MOBILE TOP BAR) */}
          <div className="flex items-center gap-3 md:gap-4 lg:gap-6 z-10">
            {/* Cart Icon - Desktop only */}
            <Link to="/cart" className="hidden lg:flex p-2 text-gray-700 hover:text-primary transition-colors relative items-center justify-center">
              <FaShoppingCart size={22} className="text-black"/>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Logout/Login - Mobile only */}
            {currentUser ? (
              <button 
                onClick={handleLogout}
                className="lg:hidden p-2 text-red-600 hover:text-red-700 transition-colors flex items-center justify-center"
                aria-label="Logout"
              >
                <MdLogout size={24} />
              </button>
            ) : (
              <Link
                to="/login"
                className="lg:hidden p-2 text-gray-700 hover:text-primary transition-colors"
                aria-label="Login"
              >
                <FaUserCircle size={24} />
              </Link>
            )}

            {/* User Section - Desktop only */}
            <div className="hidden lg:flex items-center">
              {currentUser ? (
                <div className="flex items-center gap-2 md:gap-4 lg:pl-6 lg:border-l lg:border-gray-200">
                  <span className="text-xs md:text-sm font-bold text-gray-700 hidden sm:inline-block">
                    Hi, <span className="text-primary">{currentUser.displayName?.split(' ')[0]}</span>
                  </span>
                  <ProfileAvtar />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="inline-block text-sm font-bold text-gray-700 hover:text-primary transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* STABLE BOTTOM NAVIGATION BAR - MOBILE/TABLET ONLY */}
      {location.pathname !== '/cart' && (
        <div className="lg:hidden fixed bottom-0 left-0 w-full z-[100] bg-white border-t border-gray-100 shadow-[0_-15px_30px_-5px_rgba(0,0,0,0.05)] pb-safe">
          <div className="flex items-center justify-around h-16 relative">
            {dockItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = isActive ? item.activeIcon : item.icon;
              
              if (item.center) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative -top-5 flex flex-col items-center group"
                  >
                    {/* Integrated background for the center button */}
                    <div className="absolute -top-1 w-20 h-20 bg-white rounded-full border-t border-white -z-10  transition-transform duration-300 group-active:scale-95"></div>
                    
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform group-active:scale-90 ${
                      isActive ? "bg-primary text-white" : "bg-white text-gray-700"
                    }`}>
                      <Icon size={32} />
                    </div>
                    <span className={`text-[10px] font-bold mt-1 transition-colors ${
                      isActive ? "text-primary" : "text-gray-500"
                    }`}>
                      {item.name}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center w-1/5 h-full transition-all active:bg-gray-50 group relative"
                >
                  <div className={`transition-all duration-300 transform group-active:scale-90 mb-0.5 ${
                    isActive ? "text-primary scale-110" : "text-gray-400"
                  }`}>
                    <Icon size={24} />
                  </div>
                  {item.name === "Cart" && cartCount > 0 && (
                    <span className="absolute top-2 right-4 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                      {cartCount}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold transition-colors ${
                    isActive ? "text-primary" : "text-gray-500"
                  }`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 bg-primary rounded-full mt-0.5 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
