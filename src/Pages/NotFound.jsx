import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdHome, MdShoppingBag, MdArrowBack } from 'react-icons/md';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {/* 404 Visual */}
                <div className="relative">
                    <h1 className="text-[12rem] font-black text-gray-100 select-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                            <span className="text-6xl">🔍</span>
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-gray-900">Page Not Found</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Oops! The page you're looking for doesn't exist or has been moved. 
                        Let's get you back on track.
                    </p>
                </div>

                {/* Navigation Options */}
                <div className="grid grid-cols-1 gap-4 pt-6">
                    <Link 
                        to="/" 
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95"
                    >
                        <MdHome className="text-xl" />
                        Back to Home
                    </Link>

                    <div className="grid grid-cols-2 gap-4">
                        <Link 
                            to="/product" 
                            className="flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-gray-100 px-4 py-4 rounded-2xl font-bold hover:border-blue-100 hover:bg-blue-50 transition-all active:scale-95"
                        >
                            <MdShoppingBag className="text-xl text-blue-500" />
                            Products
                        </Link>
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-gray-100 px-4 py-4 rounded-2xl font-bold hover:border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                        >
                            <MdArrowBack className="text-xl text-gray-400" />
                            Go Back
                        </button>
                    </div>
                </div>

                {/* Branding or Footer Note */}
                <p className="pt-8 text-sm text-gray-400 font-medium">
                    Holstein  &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};

export default NotFound;
