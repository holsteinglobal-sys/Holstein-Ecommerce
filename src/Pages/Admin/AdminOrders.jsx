import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, updateDoc, doc, orderBy, query, addDoc, getDoc, serverTimestamp, increment, collection as firestoreCollection} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FaClipboardList, FaClock, FaCheck, FaShippingFast, FaTimes, FaTicketAlt, FaSearch, FaEye } from 'react-icons/fa';
import { IoCloseSharp } from 'react-icons/io5';
import axios from 'axios';

const AdminOrders = ({ searchTerm = '' }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const q = query(collection(db, "orders"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
             const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
             data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
             setOrders(data);
        });
        return unsubscribe;
    }, []);

    // Filtering logic (Enhanced to handle both logistical and financial statuses)
    useEffect(() => {
        let filtered = orders;

        // Filter by section
        if (activeFilter === 'paid') {
            filtered = filtered.filter(order => order.paymentStatus === 'paid' && order.status !== 'delivered');
        } else if (activeFilter === 'delivered') {
            filtered = filtered.filter(order => order.status === 'delivered');
        } else if (activeFilter === 'pending') {
            filtered = filtered.filter(order => order.status === 'pending');
        } else if (activeFilter === 'refunded') {
            filtered = filtered.filter(order => order.status === 'refunded' || order.paymentStatus === 'refunded');
        } else if (activeFilter === 'shipped') {
            filtered = filtered.filter(order => order.status === 'shipped');
        } else if (activeFilter === 'cancelled') {
            filtered = filtered.filter(order => order.status === 'cancelled');
        }

        // Filter by search term (6-digit order ID)
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredOrders(filtered);
    }, [orders, activeFilter, searchTerm]);

    const updateStatus = async (orderId, oldStatus, newStatus) => {
        // Validation: Cannot cancel if shipped or delivered
        if (newStatus === 'cancelled' && (oldStatus === 'shipped' || oldStatus === 'delivered')) {
            toast.error("Cannot cancel an order that has already been shipped or delivered.");
            return;
        }

        // Validation: If cancelled, cannot move back to active states easily (optional safety)
        if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
            if (!window.confirm("This order was previously cancelled. Are you sure you want to reactivate it?")) return;
        }

        const confirmMessage = `Are you sure you want to change logistical status to ${newStatus}?`;
        if (!window.confirm(confirmMessage)) return;

        try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus });
            toast.success("Order logistical status updated");
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Failed to update status");
        }
    };

    const updatePaymentStatus = async (orderId, newStatus) => {
        const confirmMessage = `Are you sure you want to change payment status to ${newStatus}?`;
        if (!window.confirm(confirmMessage)) return;

        try {
            await updateDoc(doc(db, "orders", orderId), { paymentStatus: newStatus });
            toast.success("Payment status updated");
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, paymentStatus: newStatus }));
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast.error("Failed to update payment status");
        }
    };

    const handleCancelAndRefund = async (order) => {
        const walletRefundAmount = order.walletAmountUsed || 0;
        const gatewayRefundAmount = order.totalAmount || 0;

        let confirmMsg = `Are you sure you want to cancel this order?\n\nRefund Summary:\n`;
        if (walletRefundAmount > 0) confirmMsg += `- ₹${walletRefundAmount} will be returned to User Wallet\n`;
        if (gatewayRefundAmount > 0 && order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') {
            confirmMsg += `- ₹${gatewayRefundAmount} will be automatically refunded via Razorpay Source\n`;
        } else if (gatewayRefundAmount > 0) {
            confirmMsg += `- ₹${gatewayRefundAmount} (COD/Unpaid) - No electronic refund required.\n`;
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            let updateNote = "";

            // 1. Handle Wallet Refund (if any)
            if (walletRefundAmount > 0) {
                const userRef = doc(db, "users", order.userId);
                await updateDoc(userRef, {
                    walletBalance: increment(walletRefundAmount)
                });

                await addDoc(collection(db, "wallet_transactions"), {
                    userId: order.userId,
                    amount: walletRefundAmount,
                    type: "credit",
                    description: `Refund (Order Cancelled: ${order.id.slice(-6).toUpperCase()})`,
                    orderId: order.id,
                    date: serverTimestamp()
                });
                updateNote += `₹${walletRefundAmount} restored to wallet. `;
            }

            // 2. Handle Razorpay Source Refund (if any and if paid)
            if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid' && gatewayRefundAmount > 0) {
                try {
                    const response = await axios.post("http://localhost:5000/api/payments/refund", {
                        paymentId: order.paymentId,
                        amount: gatewayRefundAmount,
                        notes: { reason: `Order Cancelled by Admin: ${order.id}` }
                    });
                    if (response.status === 200) {
                        updateNote += `₹${gatewayRefundAmount} refunded to Razorpay source. `;
                    }
                } catch (err) {
                    console.error("Razorpay Source Refund Error:", err);
                    toast.error("Wallet restored, but Razorpay source refund failed. Please check backend logs.");
                    updateNote += `FAILED to refund ₹${gatewayRefundAmount} to source via Razorpay. `;
                }
            } else if (gatewayRefundAmount > 0) {
                 updateNote += `Cancelled without source refund (₹${gatewayRefundAmount}). `;
            }

            // 3. Final Order Update
            const finalRefundNote = `${updateNote} (Processed on ${new Date().toLocaleString()})`;
            await updateDoc(doc(db, "orders", order.id), {
                status: "cancelled",
                paymentStatus: (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') ? "refunded" : order.paymentStatus,
                refundNote: finalRefundNote,
                cancelledAt: serverTimestamp()
            });

            toast.success("Order cancelled and refund processed.");
            if (selectedOrder && selectedOrder.id === order.id) {
                setSelectedOrder(prev => ({ 
                    ...prev, 
                    status: "cancelled", 
                    paymentStatus: (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') ? "refunded" : prev.paymentStatus,
                    refundNote: finalRefundNote 
                }));
            }
        } catch (error) {
            console.error("Split Refund Error:", error);
            toast.error("Failed to process split refund.");
        }
    };

    const handleRefund = async (order) => {
        if (!order.paymentId) {
            toast.error("No payment ID found for this order.");
            return;
        }

        if (!window.confirm("Are you sure you want to process a refund for this order?")) return;

        try {
            const response = await axios.post("http://localhost:5000/api/payments/refund", {
                paymentId: order.paymentId,
                amount: order.totalAmount
            });

            if (response.status === 200) {
                await updateDoc(doc(db, "orders", order.id), { status: "refunded" });
                toast.success("Refund processed and order status updated.");
                setSelectedOrder(prev => ({ ...prev, status: "refunded" }));
            }
        } catch (error) {
            console.error("Refund Error:", error);
            toast.error(error.response?.data?.message || "Failed to process refund");
        }
    };

    // Calculate Active Metrics correctly (Strict: Only DELIVERED orders count for revenue/sales)
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    
    const totalRevenue = deliveredOrders.reduce((sum, o) => {
        const amt = Number(o.totalAmount) || 0;
        return sum + amt;
    }, 0);

    const totalSold = deliveredOrders.reduce((sum, o) => {
        const qty = o.products?.reduce((qSum, p) => qSum + (Number(p.qty) || 0), 0) || 0;
        return sum + qty;
    }, 0);

    const stats = [
        { label: 'Total', value: orders.length, icon: <FaClipboardList className="text-primary" />, color: 'bg-indigo-100 text-indigo-600 ' },
        { label: 'New Order', value: orders.filter(o => o.status === 'pending').length, icon: <FaClock className="text-warning" />, color: 'bg-yellow-100 text-yellow-600' },
        { label: 'Paid', value: orders.filter(o => o.paymentStatus === 'paid' && o.status !== 'delivered').length, icon: <FaCheck className="text-green-500" />, color: 'bg-green-100 text-green-600' },
        { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: <FaShippingFast className="text-emerald-500" />, color: 'bg-emerald-100 text-emerald-600' },
        { label: 'Products Sold', value: totalSold, icon: <FaTicketAlt className="text-white" />, color: 'bg-blue-500 text-white', isSpecial: true },
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <FaTicketAlt className="text-white" />, color: 'bg-emerald-500 text-white', isSpecial: true }
    ];

    const StatusDot = ({ type, pulse = false }) => (
        <div className="inline-grid *:[grid-area:1/1]">
            {pulse && <div className={`status ${type} animate-ping`}></div>}
            <div className={`status ${type}`}></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 m-3">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Orders Management</h2>
                <p className="text-gray-500 text-sm">Manage and track all customer orders</p>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, i) => {
                    const filterValue = stat.label === 'New Order' ? 'pending' : stat.label.toLowerCase();
                    const isActive = activeFilter === filterValue;
                    const isClickable = !stat.isSpecial && stat.label !== 'Total';

                    return (
                        <div
                            key={i}
                            onClick={isClickable ? () => setActiveFilter(filterValue) : () => setActiveFilter('all')}
                            className={`p-3 rounded-xl border flex flex-col items-start justify-center gap-1 shadow-sm transition-all hover:scale-105 cursor-pointer ${
                                stat.isSpecial ? stat.color :
                                isActive ? 'bg-secondary text-white ' :
                                'bg-white border-gray-100 hover:border-primary/50'
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${
                                stat.isSpecial ? 'bg-white/20' :
                                isActive ? 'bg-white/20' :
                                stat.color
                            }`}>
                                <span className="text-xl">{stat.icon}</span>
                            </div>
                            <span className={`text-2xl font-bold ${
                                stat.isSpecial ? 'text-white' :
                                isActive ? 'text-white' :
                                'text-gray-800'
                            }`}>{stat.value}</span>
                            <span className={`text-xs ${
                                stat.isSpecial ? 'text-white/80' :
                                isActive ? 'text-white/80' :
                                'text-gray-500'
                            }`}>{stat.label}</span>
                        </div>
                    );
                })}
            </div>



            {/* ORDERS LIST */}
            <div className="space-y-6">
                <p className="text-sm text-gray-500">Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> of {orders.length} orders</p>

                {filteredOrders.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="text-4xl mb-4">📦</div>
                        <p className="text-gray-500">No orders found matching your search.</p>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="card bg-base-100 w-full shadow-sm mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300">
                               <figure className="h-72 bg-gray-100 flex items-center justify-center relative">
                                    {order.products && order.products.length > 0 && order.products[0]?.image ? (
                                        <img src={order.products[0].image} alt="Order Cover" className="h-full max-w-full object-contain" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                                            <span>No Image</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                             order.status === 'delivered' ? 'bg-green-400/90 text-white' :
                                             order.status === 'pending' ? 'bg-yellow-400/90 text-black' :
                                             order.status === 'cancelled' ? 'bg-red-400/90 text-white' : 'bg-blue-400/90 text-white'
                                         }`}>
                                             {order.status === 'pending' ? 'New Order' : order.status}
                                         </span>
                                    </div>
                               </figure>

                               <div className="card-body">
                                    <h2 className="card-title text-lg">
                                        Order #{order.id.slice(-6).toUpperCase()}
                                        {order.products?.length > 1 && ` (${order.products.length} items)`}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'} •
                                        {order.products?.reduce((acc, p) => acc + p.qty, 0) || 0} items •
                                        ₹{order.totalAmount}
                                        {order.walletAmountUsed > 0 && ` (₹${order.walletAmountUsed} Wallet)`}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">{order.userName}</span> • {order.userPhone}
                                    </p>

                                    <div className="card-actions justify-center mt-4">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="btn btn-primary w-full"
                                        >
                                            <FaEye className="mr-2" /> View Details
                                        </button>
                                    </div>
                               </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
                                <p className="text-sm text-gray-500">
                                    Order ID #{selectedOrder.id.slice(-6).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-500 hover:text-black text-xl"
                            >
                               <IoCloseSharp className="text-3xl hover:text-primary hover:bg-blue-200" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Dual Status Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                                {/* Logistical Status */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Status (Logistics)</label>
                                    <select
                                        className={`select select-bordered select-sm w-full ${
                                            selectedOrder.status === 'delivered' ? 'select-success' :
                                            selectedOrder.status === 'cancelled' ? 'select-error' :
                                            'select-warning'
                                        }`}
                                        value={selectedOrder.status}
                                        onChange={(e) => updateStatus(selectedOrder.id, selectedOrder.status, e.target.value)}
                                    >
                                        <option value="pending">New Order</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Financial Status */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Status (Financial)</label>
                                    <select
                                        className={`select select-bordered select-sm w-full ${
                                            selectedOrder.paymentStatus === 'paid' ? 'select-success' :
                                            selectedOrder.paymentStatus === 'refunded' ? 'select-error' :
                                            selectedOrder.paymentStatus === 'failed' ? 'select-error' :
                                            'select-warning'
                                        }`}
                                        value={selectedOrder.paymentStatus || 'pending'}
                                        onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tracking Timeline */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-4">Order Tracking</h3>
                                <div className="space-y-4">
                                    {/* Order Placed */}
                                    <div className="flex items-center gap-3">
                                        <StatusDot type="status-success" />
                                        <span className="text-sm">Order Placed</span>
                                        <span className="text-xs text-gray-500 ml-auto">
                                            {selectedOrder.createdAt?.toDate
                                                ? selectedOrder.createdAt.toDate().toLocaleDateString()
                                                : "N/A"}
                                        </span>
                                    </div>

                                    {/* Pending / Processing */}
                                    {selectedOrder.status === "pending" && (
                                        <div className="flex items-center gap-3">
                                            <StatusDot type="status-warning" pulse />
                                            <span className="text-sm font-medium">Processing Order</span>
                                            <span className="text-xs text-gray-500 ml-auto">In Progress</span>
                                        </div>
                                    )}

                                    {/* Shipped */}
                                    {(selectedOrder.status === "shipped" ||
                                        selectedOrder.status === "delivered") && (
                                        <div className="flex items-center gap-3">
                                            <StatusDot type="status-info" />
                                            <span className="text-sm">Order Shipped</span>
                                            <span className="text-xs text-gray-500 ml-auto">Completed</span>
                                        </div>
                                    )}

                                    {/* Delivered */}
                                    {selectedOrder.status === "delivered" && (
                                        <div className="flex items-center gap-3">
                                            <StatusDot type="status-success" />
                                            <span className="text-sm font-medium">Delivered</span>
                                            <span className="text-xs text-gray-500 ml-auto">Completed</span>
                                        </div>
                                    )}

                                    {/* Cancelled */}
                                    {selectedOrder.status === "cancelled" && (
                                        <div className="flex items-center gap-3">
                                            <StatusDot type="status-error" />
                                            <span className="text-sm font-medium text-red-600">
                                                Order Cancelled
                                            </span>
                                            <span className="text-xs text-gray-500 ml-auto">Closed</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">Billing Address</h3>
                                <p className="text-sm text-gray-600">
                                    {selectedOrder.shippingAddress?.fullName}<br />
                                    {selectedOrder.shippingAddress?.address}<br />
                                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}<br />
                                    {selectedOrder.shippingAddress?.phone}
                                </p>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">Shipping Address</h3>
                                <p className="text-sm text-gray-600">
                                    {selectedOrder.shippingAddress?.fullName}<br />
                                    {selectedOrder.shippingAddress?.address}<br />
                                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}<br />
                                    {selectedOrder.shippingAddress?.phone}
                                </p>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">Payment Method</h3>
                                <p className="text-sm text-gray-600">
                                    {selectedOrder.paymentMethod || 'Cash on Delivery'}
                                </p>
                            </div>

                            {/* Products */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-4">Products</h3>
                                <div className="space-y-4">
                                    {selectedOrder.products?.map((product, idx) => (
                                        <div key={idx} className="flex gap-4 border rounded-xl p-3">
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-20 h-20 rounded-lg object-cover"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800">{product.title}</h4>
                                                <p className="text-sm text-gray-500">Qty: {product.qty}</p>
                                                <p className="text-sm font-bold text-primary">₹{product.price}</p>
                                            </div>
                                        </div>
                                    )) || <p className="text-gray-500 italic">No products data available</p>}
                                </div>
                            </div>

                            {/* Price Breakdown */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-4">Price Breakdown</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Subtotal ({selectedOrder.products?.reduce((acc, p) => acc + p.qty, 0) || 0} items)</span>
                                        <span>₹{selectedOrder.subtotal || selectedOrder.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping</span>
                                        <span>₹{selectedOrder.shippingCharge || 0}</span>
                                    </div>
                                    {selectedOrder.walletAmountUsed > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-bold">
                                            <span>Wallet Balance Used</span>
                                            <span>- ₹{selectedOrder.walletAmountUsed}</span>
                                        </div>
                                    )}
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Final Paid Amount</span>
                                        <span className="text-primary">₹{selectedOrder.totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Actions Section */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mt-6 space-y-4">
                                <h4 className="text-gray-800 font-bold uppercase text-xs tracking-widest">Administrative Actions</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Wallet Refund Button - Available for non-cancelled orders */}
                                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                                        <button 
                                            onClick={() => handleCancelAndRefund(selectedOrder)}
                                            className="btn btn-outline btn-error w-full text-xs font-bold"
                                        >
                                            Cancel & Process Split Refund
                                        </button>
                                    )}

                                    {/* Original Razorpay Refund logic - only for razorpay + paid */}
                                    {/* {selectedOrder.paymentMethod === 'razorpay' && 
                                     selectedOrder.paymentStatus === 'paid' && (
                                        <button 
                                            onClick={() => handleRefund(selectedOrder)}
                                            className="btn btn-error w-full text-white"
                                        >
                                            Razorpay Source Refund
                                        </button>
                                    )} */}
                                </div>

                                {selectedOrder.refundNote && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-sm italic">
                                        <strong>Refund Note:</strong> {selectedOrder.refundNote}
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-400 italic">
                                    * Wallet refund is instant. Razorpay source refund takes 5-7 days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;
