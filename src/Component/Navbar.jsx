import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileAvtar from "./ProfileAvtar.jsx";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { FaPhoneAlt } from "react-icons/fa";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Product", path: "/product" },
    { name: "Blog", path: "/blog" },
    { name: "Contact Us", path: "/contact" },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
      scrolled 
        ? "bg-white/80 backdrop-blur-lg shadow-lg py-3" 
        : "bg-transparent py-5"
    }`}>
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex items-center justify-between relative">
        
        {/* LEFT: LOGO */}
        <Link to="/" className="relative z-10 flex items-center group">
          <img
            src="/public/image/holstein-logo.png"
            alt="Holstein Logo"
            className="h-12 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* CENTER: DESKTOP MENU */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center">
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
                  <span className={`absolute -bottom-2 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full active-link-indicator`}></span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT: USER SECTION */}
        <div className="hidden lg:flex items-center gap-6 relative z-10">
          {currentUser ? (
            <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
              <span className="text-sm font-bold text-gray-700">
                Hi, <span className="text-primary">{currentUser.displayName?.split(' ')[0]}</span>
              </span>
              <ProfileAvtar />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-bold text-gray-700 hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden relative z-50 p-2 text-gray-700 hover:text-primary transition-colors"
        >
          {open ? <HiX size={32} /> : <HiMenuAlt3 size={32} />}
        </button>

        {/* MOBILE OVERLAY MENU */}
        <div className={`fixed inset-0 bg-white z-40 transition-transform duration-500 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}>
          <div className="flex flex-col h-full pt-32 px-10">
            <ul className="space-y-8 mb-12">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path} 
                    onClick={() => setOpen(false)}
                    className="text-4xl font-extrabold text-gray-900 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="pt-12 border-t border-gray-100 flex flex-col gap-6">
              {currentUser ? (
                <div className="flex items-center gap-4">
                  <ProfileAvtar />
                  <span className="text-xl font-bold text-gray-900">Account Settings</span>
                </div>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={() => setOpen(false)}
                    className="text-2xl font-bold text-gray-900"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    onClick={() => setOpen(false)}
                    className="bg-primary text-white text-center py-4 rounded-2xl text-xl font-bold"
                  >
                    Get Started
                  </Link>
                </>
              )}
              <a href="tel:+9118002965555" className="text-primary font-black text-xl mt-4 inline-flex items-center gap-2">
                <FaPhoneAlt className="" />  1800-296-5555
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .active-link-indicator {
          width: 0;
        }
        .active .active-link-indicator {
          width: 100%;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
