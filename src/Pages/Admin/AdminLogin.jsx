import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdLogin, MdAdminPanelSettings } from 'react-icons/md';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, currentUser, userRole, logout } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in as admin
    useEffect(() => {
        if (currentUser && userRole === 'admin') {
            navigate('/hadmin/dashboard');
        }
    }, [currentUser, userRole, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userCredential = await login(email, password);
            const user = userCredential.user;

            // Fetch role directly to verify immediately
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists() && userDocSnapshot.data().role === 'admin') {
                toast.success('Admin login successful!');
                navigate('/hadmin/dashboard');
            } else {
                toast.error('Access Denied: You do not have admin privileges.');
                await logout(); // Kick them out if they are not admin
            }
        } catch (error) {
            console.error(error);
            const message = error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' 
                ? 'Invalid credentials. Please try again.' 
                : 'Login failed. Please check your connection.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">
                {/* Header/Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-xl shadow-blue-200 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <MdAdminPanelSettings className="text-white text-4xl" />
                    </div>
                    <img 
                        src="/Image/holstein-logo.png" 
                        alt="Holstein Global" 
                        className="h-16 mx-auto mb-4 object-contain"
                    />
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Console</h1>
                    <p className="text-gray-500 font-medium mt-2">Enter your credentials to manage Holstein</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 relative">
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block uppercase tracking-wider">
                                    Admin Email
                                </label>
                                <div className="relative">
                                    <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors text-xl" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                        placeholder="admin@holstein.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block uppercase tracking-wider">
                                    Security Password
                                </label>
                                <div className="relative">
                                    <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors text-xl" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end px-2">
                            <Link
                                to="/forgot-password" 
                                className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <MdLogin className="text-xl" />
                                    Access Dashboard
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Navigation */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-blue-600 font-bold transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
                    >
                        <span>&larr;</span>
                        Return to Storefront
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
