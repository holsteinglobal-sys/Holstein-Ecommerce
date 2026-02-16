import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaUser, FaTrash, FaEye, FaSearch, FaCircle } from 'react-icons/fa';
import { IoCloseSharp } from 'react-icons/io5';
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';

const AdminCarts = ({ searchTerm = '' }) => {
    const [carts, setCarts] = useState([]);
    const [filteredCarts, setFilteredCarts] = useState([]);
    const [selectedCart, setSelectedCart] = useState(null);
    const [userDetails, setUserDetails] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Using collectionGroup to listen to all 'items' subcollections inside 'carts'
        const unsubscribe = onSnapshot(collectionGroup(db, "items"), (snapshot) => {
            const itemsByUserId = {};
            
            snapshot.docs.forEach(snapshotDoc => {
                // Ensure we only get items from the 'carts' collection hierarchy
                if (snapshotDoc.ref.parent.parent?.path.startsWith('carts/')) {
                    const userId = snapshotDoc.ref.parent.parent.id;
                    if (!itemsByUserId[userId]) itemsByUserId[userId] = [];
                    itemsByUserId[userId].push({ ...snapshotDoc.data(), id: snapshotDoc.id });
                }
            });

            const cartsData = Object.keys(itemsByUserId).map(userId => ({
                userId,
                items: itemsByUserId[userId],
                totalItems: itemsByUserId[userId].reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
                totalValue: itemsByUserId[userId].reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0)
            }));

            // Sort by total value or any other metric if needed
            setCarts(cartsData.sort((a, b) => b.totalValue - a.totalValue));
            setLoading(false);
        }, (error) => {
            console.error("Error listening to carts:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Fetch user details for carts
    useEffect(() => {
        const fetchUserDetails = async () => {
            const userIds = carts.map(cart => cart.userId);
            if (userIds.length === 0) return;

            const usersQuery = query(collection(db, "users"), where("__name__", "in", userIds.slice(0, 10))); // Firestore 'in' limit
            const snapshot = await getDocs(usersQuery);
            const userMap = {};
            snapshot.docs.forEach(doc => {
                userMap[doc.id] = doc.data();
            });
            setUserDetails(userMap);
        };

        fetchUserDetails();
    }, [carts]);

    // Filtering logic
    useEffect(() => {
        let filtered = carts;

        // Filter by search term (user phone or name)
        if (searchTerm) {
            filtered = filtered.filter(cart => {
                const user = userDetails[cart.userId];
                return (user?.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                       (user?.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
            });
        }

        setFilteredCarts(filtered);
    }, [carts, userDetails, searchTerm]);

    const handleViewDetails = (cart) => {
        setSelectedCart(cart);
    };

    const clearCart = async (userId) => {
        if (!window.confirm('Are you sure you want to clear this cart?')) return;

        try {
            const itemsRef = collection(db, "carts", userId, "items");
            const snapshot = await getDocs(itemsRef);
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            toast.success("Cart cleared successfully");
        } catch (error) {
            console.error("Error clearing cart:", error);
            toast.error("Failed to clear cart");
        }
    };

    const removeItem = async (userId, itemId) => {
        try {
            const itemRef = doc(db, "carts", userId, "items", itemId);
            await deleteDoc(itemRef);
            toast.success("Item removed from cart");
        } catch (error) {
            console.error("Error removing item:", error);
            toast.error("Failed to remove item");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 m-3">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Carts Management</h2>
                <p className="text-gray-500 text-sm">Manage user shopping carts</p>
            </div>

            {/* CARTS GRID */}
            <div className="space-y-6">
                <p className="text-sm text-gray-500">Showing <span className="font-bold text-gray-900">{filteredCarts.length}</span> carts with items</p>

                {filteredCarts.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="text-4xl mb-4">🛒</div>
                        <p className="text-gray-500">No carts with items found matching your search.</p>
                     </div>
                ) : (

                    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-base-300">
  <table className="min-w-full text-sm">
    <thead className="bg-gray-50 border-b">
      <tr className="text-left text-gray-600 uppercase text-xs tracking-wider">
        <th className="px-6 py-4">User</th>
        <th className="px-6 py-4">Email</th>
        <th className="px-6 py-4">Phone</th>
        <th className="px-6 py-4 text-center">Items</th>
        <th className="px-6 py-4 text-right">Total Value</th>
        <th className="px-6 py-4 text-center">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y">
      {filteredCarts.map((cart) => {
        const user = userDetails[cart.userId];
        return (
          <tr
            key={cart.userId}
            className="hover:bg-gray-50 transition"
          >
            {/* User */}
            <td className="px-6 py-4 font-semibold text-gray-800">
              {user?.displayName || 'Unknown User'}
            </td>

            {/* Email */}
            <td className="px-6 py-4 text-gray-600">
              {user?.email || 'N/A'}
            </td>

            {/* Phone */}
            <td className="px-6 py-4 text-gray-600">
              {user?.phone || 'N/A'}
            </td>

            {/* Items */}
            <td className="px-6 py-4 text-center">
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold">
                {cart.totalItems}
              </span>
            </td>

            {/* Total */}
            <td className="px-6 py-4 text-right font-bold text-primary">
              ₹{cart.totalValue}
            </td>

            {/* Actions */}
            <td className="px-6 py-4">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleViewDetails(cart)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1"
                >
                  <FaEye /> View
                </button>

                <button
                  onClick={() => clearCart(cart.userId)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 flex items-center gap-1"
                >
                  <FaTrash /> Clear
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

                    // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    //     {filteredCarts.map((cart) => (
                    //         <CartCard
                    //             key={cart.userId}
                    //             cart={cart}
                    //             user={userDetails[cart.userId]}
                    //             onViewDetails={() => handleViewDetails(cart)}
                    //             onClearCart={() => clearCart(cart.userId)}
                    //         />
                    //     ))}
                    // </div>
                )}
            </div>

            {/* CART DETAILS MODAL */}
            {selectedCart && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FaShoppingCart className="text-primary text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {userDetails[selectedCart.userId]?.displayName || 'Unknown User'}'s Cart
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {selectedCart.totalItems} items • ₹{selectedCart.totalValue}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCart(null)}
                                className="text-gray-500 hover:text-black text-xl"
                            >
                               <IoCloseSharp className="text-3xl hover:text-primary hover:bg-blue-200" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* User Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-4">User Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Name:</span>
                                        <span className="text-sm font-medium">{userDetails[selectedCart.userId]?.displayName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Email:</span>
                                        <span className="text-sm font-medium">{userDetails[selectedCart.userId]?.email || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Phone:</span>
                                        <span className="text-sm font-medium">{userDetails[selectedCart.userId]?.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-4">Cart Items ({selectedCart.items.length})</h3>
                                {selectedCart.items.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                        <p className="text-gray-500">No items in cart.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedCart.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 border rounded-xl p-4">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-16 h-16 rounded-lg object-cover"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-800">{item.title}</h4>
                                                    <p className="text-sm text-gray-500">Qty: {item.qty}</p>
                                                    <p className="text-sm font-bold text-primary">₹{item.price}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(selectedCart.userId, item.id)}
                                                    className="btn btn-sm btn-error"
                                                >
                                                    <FaTrash className="mr-1" /> Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cart Summary */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-4">Cart Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Total Items:</span>
                                        <span className="font-medium">{selectedCart.totalItems}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Value:</span>
                                        <span className="font-bold text-primary">₹{selectedCart.totalValue}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const CartCard = ({ cart, user, onViewDetails, onClearCart }) => {
    return (
        <div className="card bg-base-100 w-full shadow-sm mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300">
            <figure className="h-48 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-full bg-green-200 flex items-center justify-center">
                    <FaShoppingCart className="text-green-600 text-3xl" />
                </div>
                <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {cart.totalItems} items
                    </span>
                </div>
            </figure>

            <div className="card-body">
                <h2 className="card-title text-lg">
                    {user?.displayName || 'Unknown User'}
                </h2>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-600">{user?.phone || 'No phone'}</p>

                <div className="flex items-center justify-between mt-2">
                    <div className="text-sm text-gray-600">
                        Total: <span className="font-bold text-primary">₹{cart.totalValue}</span>
                    </div>
                </div>

                <div className="card-actions justify-center mt-4 gap-2">
                    <button
                        onClick={onViewDetails}
                        className="btn btn-primary btn-sm"
                    >
                        <FaEye className="mr-1" /> View Cart
                    </button>
                    <button
                        onClick={onClearCart}
                        className="btn btn-error btn-sm"
                    >
                        <FaTrash className="mr-1" /> Clear Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminCarts;
