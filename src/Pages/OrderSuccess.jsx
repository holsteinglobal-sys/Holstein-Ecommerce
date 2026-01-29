import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaShoppingBag, FaArrowRight } from 'react-icons/fa';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId, total } = location.state || {};

    if (!orderId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-gray-800">Oops! No order found.</h1>
                    <p className="text-gray-600">It seems you reached this page by mistake.</p>
                    <Link to="/" className="btn btn-primary">Go back Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 lg:p-8">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Success Header */}
                <div className="bg-success p-8 text-center text-white">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 animate-bounce">
                        <FaCheckCircle className="text-5xl" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
                    <p className="opacity-90">Thank you for your purchase. Your order has been successfully placed.</p>
                </div>

                {/* Order Details */}
                <div className="p-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <div className="text-center md:text-left">
                            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">Order ID</p>
                            <p className="text-xl font-bold text-gray-800">#{orderId.slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Paid Amount</p>
                            <p className="text-xl font-bold text-gray-800 text-primary">₹{total}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                             What's Next?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border border-gray-100 rounded-xl hover:border-primary/30 transition-colors">
                                <p className="font-bold text-gray-800 mb-1 italic">Confirmation Email</p>
                                <p className="text-sm text-gray-500">We've sent a detailed receipt to your registered email address.</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-xl hover:border-primary/30 transition-colors">
                                <p className="font-bold text-gray-800 mb-1 italic">Shipping Update</p>
                                <p className="text-sm text-gray-500">You'll receive another update once your items are dispatched.</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link 
                            to="/profile" 
                            className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                        >
                            <FaShoppingBag /> Track your Order
                        </Link>
                        <Link 
                            to="/" 
                            className="flex-1 btn btn-outline btn-primary flex items-center justify-center gap-2"
                        >
                            Continue Shopping <FaArrowRight />
                        </Link>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="bg-gray-50 p-6 text-center border-t">
                    <p className="text-gray-500 text-sm">
                        Experience a problem? <Link to="/contact" className="text-primary font-bold hover:underline">Contact Support</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
