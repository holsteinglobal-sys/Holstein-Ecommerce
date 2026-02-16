import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdEmail, MdArrowBack, MdMarkEmailRead } from 'react-icons/md';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await resetPassword(email);
            setIsSubmitted(true);
            toast.success('Password reset link sent to your email!');
        } catch (error) {
            console.error(error);
            const message = error.code === 'auth/user-not-found' 
                ? 'No account found with this email address.' 
                : 'Failed to send reset link. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 px-4 py-12">
            <div className="w-full max-w-lg bg-white/90 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-white">
                
                {/* Back to Login Arrow */}
                <Link 
                    to="/login" 
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 group"
                >
                    <MdArrowBack className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Back to Login</span>
                </Link>

                {!isSubmitted ? (
                    <div className="animate-fade-in">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <MdEmail size={32} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
                            <p className="mt-3 text-gray-500">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative group">
                                <label className="text-xs font-bold text-gray-700 ml-1 mb-2 block uppercase tracking-widest">
                                    Registered Email
                                </label>
                                <div className="relative">
                                    <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors text-xl" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="yourname@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 outline-none transition-all font-medium text-gray-900"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl text-lg font-bold text-white bg-indigo-700 hover:bg-indigo-800 shadow-lg hover:shadow-indigo-200 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60 transform active:scale-[0.98]"
                            >
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center py-6 animate-zoom-in">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MdMarkEmailRead size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Check Your Inbox</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            We've sent a password reset link to <br />
                            <span className="font-bold text-gray-900">{email}</span>. <br />
                            Please check your email and follow the instructions to reset your password.
                        </p>
                        <Link 
                            to="/login"
                            className="inline-block px-8 py-3 bg-indigo-700 text-white font-bold rounded-2xl hover:bg-indigo-800 transition-all shadow-md"
                        >
                            Back to Login
                        </Link>
                        <button 
                            onClick={() => setIsSubmitted(false)}
                            className="block w-full mt-6 text-sm font-semibold text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                            Didn't receive the email? Try again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
