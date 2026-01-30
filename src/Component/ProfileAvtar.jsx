import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaShoppingCart } from "react-icons/fa";
import { RiDashboardFill } from "react-icons/ri";
import { FaPowerOff } from "react-icons/fa6";

const ProfileAvtar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const firstLetter = currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="relative">
      {/* Avatar Circle */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="btn btn-circle btn-primary text-white font-bold text-lg flex items-center justify-center"
      >
        {firstLetter}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-base-100 shadow-lg rounded-lg border z-50">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-12 flex items-center justify-center text-white font-bold">
                  <span className="text-xl">{firstLetter}</span>
                </div>
              </div>
              <div>
                <p className="font-semibold">{currentUser?.displayName || 'User'}</p>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  navigate('/profile');
                  setDropdownOpen(false);
                }}
                className="btn btn-wide btn-outline w-full flex items-center gap-2"
              >
               <RiDashboardFill className='text-xl' />
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate('/cart');
                  setDropdownOpen(false);
                }}
                className="btn btn-wide btn-outline w-full"
              >
<FaShoppingCart className='text-xl'/>
                Cart
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-soft btn-secondary w-full"
              >
                <FaPowerOff className='text-xl' />
                Logout
              </button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAvtar;
