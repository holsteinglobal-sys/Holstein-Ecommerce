import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { currentUser, userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="h-10 w-48 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-32 bg-gray-200 animate-pulse rounded-2xl"></div>
                        <div className="h-32 bg-gray-200 animate-pulse rounded-2xl"></div>
                        <div className="h-32 bg-gray-200 animate-pulse rounded-2xl"></div>
                    </div>
                    <div className="h-96 bg-gray-200 animate-pulse rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (!currentUser || userRole !== 'admin') {
        // Redirect to admin login if not authorized, saving the attempted location
        return <Navigate to="/hadmin/login" state={{ from: location }} replace />;
    }

    return children;
};

export default AdminRoute;
