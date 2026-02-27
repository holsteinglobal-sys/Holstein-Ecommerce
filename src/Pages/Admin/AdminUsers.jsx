import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FaUser, FaEye, FaSearch, FaCircle } from 'react-icons/fa';
import { IoCloseSharp } from 'react-icons/io5';
import {FaShoppingCart} from  "react-icons/fa";
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';

const AdminUsers = ({ searchTerm = '' }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
            const userData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setUsers(userData);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Filtering logic
    useEffect(() => {
        let filtered = users;

        // Filter by search term (phone or name)
        if (searchTerm) {
            filtered = filtered.filter(user =>
                (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm]);

    const getUserActivityStatus = (user) => {
        if (!user.lastActive) return 'Offline';
        
        try {
            const lastActive = user.lastActive.toDate?.() || new Date(user.lastActive);
            const diffInMinutes = (Date.now() - lastActive.getTime()) / (1000 * 60);
            
            if (diffInMinutes < 5) return 'Online';
            if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
            if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}h ago`;
            return 'Offline';
        } catch (e) {
            return 'Offline';
        }
    };

    const fetchUserOrders = async (userId) => {
        try {
            const q = query(collection(db, "orders"), where("userId", "==", userId));
            const snapshot = await getDocs(q);
            const orders = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setUserOrders(orders);
        } catch (error) {
            console.error("Error fetching user orders:", error);
            setUserOrders([]);
        }
    };

    const handleViewDetails = async (user) => {
        setSelectedUser(user);
        await fetchUserOrders(user.id);
    };

    if (loading) {
        return <TableSkeleton rows={8} columns={5} />;
    }

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 max-w-full overflow-hidden">
            <div className="px-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Users Management</h2>
                <p className="text-gray-500 text-xs md:text-sm">Manage registered users and their activities</p>
            </div>

            {/* USERS GRID */}
            <div className="space-y-4">
                <p className="text-xs md:text-sm text-gray-500 px-1">
                    Showing <span className="font-bold text-gray-900">{filteredUsers.length}</span> of {users.length} users
                </p>

                {filteredUsers.length === 0 ? (
                     <div className="text-center py-12 md:py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-gray-500 text-sm md:text-base">No users found matching your search.</p>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
                        {filteredUsers.map((user) => (
                            <UserCard
                                key={user.id}
                                user={user}
                                onViewDetails={() => handleViewDetails(user)}
                                activityStatus={getUserActivityStatus(user)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* USER DETAILS MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-4xl rounded-t-[2rem] sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fadeIn max-h-[95vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <FaUser className="text-primary text-xl" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-gray-800 truncate">{selectedUser.displayName || 'N/A'}</h2>
                                    <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                               <IoCloseSharp className="text-2xl text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
                            {/* User Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">User Information</h3>
                                    <div className="space-y-4">
                                        <InfoRow label="Name" value={selectedUser.displayName || 'N/A'} />
                                        <InfoRow label="Email" value={selectedUser.email} />
                                        <InfoRow label="Phone" value={selectedUser.phone || 'N/A'} />
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Role:</span>
                                            <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                                                selectedUser.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {selectedUser.role || 'user'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Status:</span>
                                            <span className={`font-bold flex items-center gap-2 ${
                                                getUserActivityStatus(selectedUser) === 'Online' ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                                <FaCircle className={`text-[8px] ${getUserActivityStatus(selectedUser) === 'Online' ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                                                {getUserActivityStatus(selectedUser)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 md:p-5 border border-gray-100">
                                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Account Statistics</h3>
                                    <div className="space-y-4">
                                        <InfoRow label="Total Orders" value={userOrders.length} />
                                        <InfoRow label="Total Spent" value={`₹${userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0).toLocaleString()}`} />
                                        <InfoRow label="Member Since" value={selectedUser.createdAt?.toDate ? selectedUser.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'} />
                                    </div>
                                </div>
                            </div>

                            {/* Order History */}
                            <div className="space-y-4 pb-4">
                                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Recent Orders</h3>
                                {userOrders.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-500 text-sm">
                                        No orders found for this user.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {userOrders.map((order) => (
                                            <div key={order.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                                                        {order.products[0]?.image ? (
                                                            <img src={order.products[0].image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                           <FaShoppingCart className="text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-800 text-sm truncate">#{order.id.slice(-6).toUpperCase()}</p>
                                                        <p className="text-[10px] text-gray-500">
                                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'} • ₹{order.totalAmount}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">{label}:</span>
        <span className="font-semibold text-gray-900 truncate ml-4">{value}</span>
    </div>
);

const UserCard = ({ user, onViewDetails, activityStatus }) => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        if (!user.id) return;
        const unsubscribe = onSnapshot(collection(db, "carts", user.id, "items"), (snap) => {
            setCartItems(snap.docs.map(d => d.data()));
        });
        return unsubscribe;
    }, [user.id]);

    return (
        <div 
            onClick={onViewDetails}
            className="group bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
            <div className="flex items-start gap-4">
                {/* Avatar / Icon */}
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <FaUser className="text-indigo-500 text-2xl group-hover:text-primary transition-colors" />
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-gray-900 truncate">
                            {user.displayName || 'Guest User'}
                        </h3>
                        {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded tracking-wider">
                                Staff
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1">{user.email}</p>
                    <p className="text-xs text-gray-400 font-medium">{user.phone || 'No phone provided'}</p>
                </div>

                {/* Status Dot */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1.5 ${
                        activityStatus === 'Online' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                    }`}>
                        <FaCircle className={`text-[6px] ${activityStatus === 'Online' ? 'text-green-500 animate-pulse' : 'text-gray-300'}`} />
                        {activityStatus}
                    </span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                    <FaShoppingCart className="text-primary/40 text-sm" />
                    <span>{cartItems.length} items in cart</span>
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View &rarr;
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;


