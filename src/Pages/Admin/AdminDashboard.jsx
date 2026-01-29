import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MdShoppingBag,
  MdPerson,
  MdLocationOn,
  MdDashboard,
  MdArticle,
  MdLogout,
  MdConfirmationNumber,
} from 'react-icons/md';
import { useNavigate, Link } from 'react-router-dom';
import AdminProducts from './AdminProducts';
import AdminBlogs from './AdminBlogs';
import AdminUsers from './AdminUsers';
import AdminCarts from './AdminCarts';
import AdminOrders from './AdminOrders';
import AdminShipping from './AdminShipping';
import AdminCoupons from './AdminCoupons';
import toast from 'react-hot-toast';
import { FaHome, FaSignOutAlt, FaSearch } from 'react-icons/fa';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  if (!currentUser || currentUser.email !== 'admin@gmail.com') {
    navigate('/admin/login');
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const menuItems = [
    {
      id: "orders",
      label: "Orders",
      icon: MdShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      hoverBg: "hover:bg-blue-50",
    },
    {
      id: "users",
      label: "Users",
      icon: MdPerson,
      color: "text-green-600",
      bgColor: "bg-green-100",
      hoverBg: "hover:bg-green-50",
    },
    {
      id: "carts",
      label: "Carts",
      icon: MdShoppingBag,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      hoverBg: "hover:bg-orange-50",
    },
    {
      id: "shipping",
      label: "Shipping Rules",
      icon: MdLocationOn,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      hoverBg: "hover:bg-purple-50",
    },
    {
      id: "products",
      label: "Products Management",
      icon: MdDashboard,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      hoverBg: "hover:bg-indigo-50",
    },
    {
      id: "blogs",
      label: "Blogs Management",
      icon: MdArticle,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      hoverBg: "hover:bg-pink-50",
    },
    {
      id: "coupons",
      label: "Coupon Management",
      icon: MdConfirmationNumber,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      hoverBg: "hover:bg-amber-50",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'orders': return <AdminOrders searchTerm={globalSearchTerm} />;
      case 'users': return <AdminUsers searchTerm={globalSearchTerm} />;
      case 'carts': return <AdminCarts searchTerm={globalSearchTerm} />;
      case 'shipping': return <AdminShipping />;
      case 'products': return <AdminProducts />;
      case 'blogs': return <AdminBlogs />;
      case 'coupons': return <AdminCoupons />;
      default: return <AdminOrders searchTerm={globalSearchTerm} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-70 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        {/* Logo Area */}
        <div className="h-23 flex items-center px-6 border-b border-gray-100">
         
            <img
              src="/public/image/holstein-logo.png"
              alt="Holstein Logo"
              className="h-25 w-auto object-contain mt-2"
            />
         
        </div>

        {/* Admin Profile Snippet */}
        <div className="p-6 flex items-center gap-4 border-b border-gray-100">
          {/* Avatar */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold shadow">
              A
            </div>
          </div>

          {/* Admin Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              Admin
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
              Administrator
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-2 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-md"
                    : `${item.hoverBg} text-gray-700`
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? "bg-white/20" : item.bgColor
                  }`}
                >
                  <item.icon
                    className={`text-lg ${
                      isActive ? "text-white" : item.color
                    }`}
                  />
                </div>

                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {/* <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <FaHome className="text-primary" />
            </div>

            <span className="font-medium">Back to Home</span>
          </button> */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <FaSignOutAlt className="text-red-600 dark:text-red-400" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* GLOBAL SEARCH BAR */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search orders by ID or users by phone/name..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Search across orders and users instantly</p>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
