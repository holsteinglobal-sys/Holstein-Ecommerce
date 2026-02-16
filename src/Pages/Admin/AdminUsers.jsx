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
        // Simple logic: if user has recent login (within 24 hours), consider active
        // In a real app, you'd track last login time
        const lastLogin = user.lastLogin?.toDate?.() || new Date(Date.now() - 24 * 60 * 60 * 1000);
        const hoursSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60);
        return hoursSinceLogin < 24 ? 'Active' : 'Offline';
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
        <div className="space-y-8 animate-in fade-in duration-500 m-3">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Users Management</h2>
                <p className="text-gray-500 text-sm">Manage registered users and their activities</p>
            </div>



            {/* USERS GRID */}
            <div className="space-y-6">
                <p className="text-sm text-gray-500">Showing <span className="font-bold text-gray-900">{filteredUsers.length}</span> of {users.length} users</p>

                {filteredUsers.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-gray-500">No users found matching your search.</p>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FaUser className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{selectedUser.displayName || 'N/A'}</h2>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-500 hover:text-black text-xl"
                            >
                               <IoCloseSharp className="text-3xl hover:text-primary hover:bg-blue-200" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* User Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-800 mb-4">User Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Name:</span>
                                            <span className="text-sm font-medium">{selectedUser.displayName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Email:</span>
                                            <span className="text-sm font-medium">{selectedUser.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Phone:</span>
                                            <span className="text-sm font-medium">{selectedUser.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Role:</span>
                                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                                                selectedUser.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {selectedUser.role || 'user'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            <span className={`text-sm font-medium flex items-center gap-2 ${
                                                getUserActivityStatus(selectedUser) === 'Active' ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                                <FaCircle className={`text-xs ${getUserActivityStatus(selectedUser) === 'Active' ? 'text-green-500' : 'text-gray-400'}`} />
                                                {getUserActivityStatus(selectedUser)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-800 mb-4">Account Statistics</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Total Orders:</span>
                                            <span className="text-sm font-medium">{userOrders.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Total Spent:</span>
                                            <span className="text-sm font-medium">₹{userOrders.reduce((sum, order) => sum + order.totalAmount, 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Member Since:</span>
                                            <span className="text-sm font-medium">
                                                {selectedUser.createdAt?.toDate ? selectedUser.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order History */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-4">Order History ({userOrders.length} orders)</h3>
                                {userOrders.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <p className="text-gray-500">No orders found for this user.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {userOrders.map((order) => (
                                            <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                                                <div className="flex items-center gap-4">
                                                    {order.products[0]?.image && (
                                                        <img src={order.products[0].image} alt="Order" className="w-12 h-12 rounded-lg object-cover" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-800">Order #{order.id.slice(-6).toUpperCase()}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'} •
                                                            {order.products.length} items • ₹{order.totalAmount}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
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
        <div className="card bg-base-100 w-full shadow-sm mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300">
            <figure className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <FaUser className="text-primary text-3xl" />
                </div>
                <div className="absolute top-4 right-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        activityStatus === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                        <FaCircle className={`text-xs ${activityStatus === 'Active' ? 'text-green-500' : 'text-gray-400'}`} />
                        {activityStatus}
                    </span>
                </div>
            </figure>

            <div className="card-body">
                <h2 className="card-title text-lg">
                    {user.displayName || 'N/A'}
                    {user.role === 'admin' && (
                        <span className="badge badge-primary badge-sm">Admin</span>
                    )}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-600">{user.phone || 'No phone'}</p>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaShoppingCart className="text-primary" />
                        <span>{cartItems.length} items in cart</span>
                    </div>
                </div>

                <div className="card-actions justify-center mt-4">
                    <button
                        onClick={onViewDetails}
                        className="btn btn-primary w-full"
                    >
                        <FaEye className="mr-2" /> View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
