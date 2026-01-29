import React from 'react'
import { Routes,Route, useLocation } from 'react-router-dom'
import Navbar from './Component/Navbar.jsx'
import Footer from './Component/Footer.jsx'
import Home from './Pages/Home.jsx'
import About from './Pages/About.jsx'
import "react-toastify/dist/ReactToastify.css";
import Heading from './Component/Heading.jsx'
import Card from './Component/Card.jsx'
import Heading2 from './Component/Heading2.jsx'
import Testimonial from './Component/Testimonial.jsx'
import Services from './Pages/Services.jsx'
import ProductDetails from './Pages/ProductDetails/ProductDetails.jsx'
import { products } from "./Data/product.js";
import DealerDistributorPg from './Pages/DealerDistributorPg.jsx'
import Login from './Pages/Login.jsx';
import Signup from './Pages/Signup.jsx';
import Profile from './Pages/Profile.jsx';
import Cart from './Pages/Cart.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastContainer } from 'react-toastify';
import ScrollToTop from './Component/ScrollToTop.jsx';
import Product from './Pages/Product.jsx';
import { CartProvider } from './Pages/CartContext/CartContext.jsx';
import { Toaster } from "react-hot-toast";
import Career from './Pages/Career/Career.jsx'
import Blog from './Pages/Blog/BlogPage.jsx'
import AdminLogin from './Pages/Admin/AdminLogin.jsx';
import AdminDashboard from './Pages/Admin/AdminDashboard.jsx';
import Contact from './Pages/ContactUs/Contact.jsx';
import SocialMedia from "./Component/SocialMedia.jsx";
import OrderSuccess from './Pages/OrderSuccess.jsx';

const App = () => {

  const location = useLocation();

  const hideLayoutRoutes = [
    "/profile",
    "/admin/dashboard",
    "/admin/login",
  ];

  const shouldHideLayout = hideLayoutRoutes.includes(location.pathname);


  return (
    <AuthProvider>
    <CartProvider>
      <div >
          <ScrollToTop />
         {!shouldHideLayout && <Navbar />}


         <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/dealerdistributor' element={<DealerDistributorPg/>} />
          <Route path='/career' element={<Career/>} />
          <Route path='/product' element={<Product/>} />
          <Route path='/blog' element={<Blog/>} />
          <Route path='/contact' element={<Contact/>} />
          <Route
            path="/product/:id"
            element={<ProductDetails products={products} />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
       <Route path="/cart" element={<Cart />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/order-success" element={<OrderSuccess />} />

        </Routes>

          <SocialMedia/>
         {!shouldHideLayout && <SocialMedia />}
          {!shouldHideLayout && <Footer />}
        {/* <ToastContainer /> */}
         <Toaster position="top-center" reverseOrder={false} />

      </div>
    </CartProvider>
    </AuthProvider>
  )
}

export default App
