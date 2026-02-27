import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  MdDashboard,
  MdPerson,
  MdLocationOn,
  MdAccountBalanceWallet,
  MdLogout,
  MdMenu,
  MdClose,
  MdShoppingBag 
} from "react-icons/md";

import { useNavigate,Link } from "react-router-dom";
import ProfileInfo from "./ProfileComponents/ProfileInfo.jsx";
import AddressBook from "./ProfileComponents/AddressBook.jsx";
import OrderHistory from "./ProfileComponents/OrderHistory.jsx";
import Wallet from "./ProfileComponents/Wallet.jsx";
import toast from "react-hot-toast";
import { FaHome, FaSignOutAlt } from "react-icons/fa";




const Profile = ({ initialTab = 'profile' }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
      try {
          await logout();
          navigate('/login');
          toast.success("Logged out successfully");
      } catch (error) {
          console.error(error);
      }
  };

  const menuItems = [
  {
    id: "orders",
    label: "My Orders",
    icon: MdShoppingBag,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    hoverBg: "hover:bg-blue-50",
  },
  {
    id: "wallet",
    label: "My Wallet",
    icon: MdAccountBalanceWallet,
    color: "text-green-600",
    bgColor: "bg-green-100",
    hoverBg: "hover:bg-green-50",
  },
  {
    id: "profile",
    label: "My Profile",
    icon: MdPerson,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    hoverBg: "hover:bg-purple-50",
  },
  {
    id: "address",
    label: "Address Book",
    icon: MdLocationOn,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    hoverBg: "hover:bg-orange-50",
  },
];
  const renderContent = () => {
      switch(activeTab) {
          case 'profile': return <ProfileInfo />;
          case 'address': return <AddressBook />;
          case 'orders': return <OrderHistory />;
          case 'wallet': return <Wallet />;
          default: return <ProfileInfo />;
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
        {/* MOBILE SIDEBAR TOGGLE */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-emerald-600 transition-all active:scale-95"
        >
          {isSidebarOpen ? <MdClose /> : <MdMenu />}
        </button>

        {/* SIDEBAR */}
        <aside className={`
          w-70 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 transition-transform duration-300 lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}>
            {/* Logo Area */}
            <div className="h-23 flex items-center px-6 border-b border-gray-100">
                {/* <span className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-warning text-2xl">🎫</span> Book Now
                </span> */}

                 <Link to="/" className="flex items-center">
          <img
            src="/Image/holstein-logo.png"
            alt="Holstein Logo"
            className="h-25 w-auto object-contain mt-2"
          />
        </Link>
            </div>

            {/* User Profile Snippet */}
           <div className="p-6 flex items-center gap-4 border-b border-gray-100">
  {/* Avatar */}
  <div className="relative">
    <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold shadow">
      {currentUser.displayName
        ? currentUser.displayName.charAt(0).toUpperCase()
        : "U"}
    </div>
  </div>

  {/* User Info */}
  <div className="flex-1 min-w-0">
    <h3 className="text-sm font-semibold text-gray-900 truncate">
      {currentUser.displayName || "User"}
    </h3>
    <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      User
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
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
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
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <FaHome className="text-primary" />
                </div>

                    <span className="font-medium">Back to Home</span>
                </button>
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
        <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto w-full pt-28 lg:pt-8">
             {renderContent()}
        </main>
    </div>
  );
};

export default Profile;
