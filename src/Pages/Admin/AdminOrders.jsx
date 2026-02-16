import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, updateDoc, doc, orderBy, query, addDoc, getDoc, serverTimestamp, increment, collection as firestoreCollection} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { FaClipboardList, FaClock, FaCheck, FaShippingFast, FaTimes, FaTicketAlt, FaSearch, FaEye,FaPhoneAlt, FaCalendarAlt, FaShoppingCart } from 'react-icons/fa';
import { IoCloseSharp } from 'react-icons/io5';
import { MdPerson, MdAttachMoney } from 'react-icons/md';
import axios from 'axios';
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';




const AdminOrders = ({ searchTerm = '' }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "orders"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
             const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
             data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
             setOrders(data);
             setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Filtering logic (Enhanced to handle both logistical and financial statuses)
    useEffect(() => {
        let filtered = orders;

        // Filter by section
        if (activeFilter === 'paid') {
            filtered = filtered.filter(order => order.paymentStatus === 'paid' && order.status !== 'delivered' && order.status !== 'cancelled');
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
                    const response = await axios.post("/api/payments/refund", {
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
            const response = await axios.post("/api/payments/refund", {
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
        { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: <FaShippingFast className="text-emerald-500" />, color: 'bg-emerald-100 text-emerald-600' },
        { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, icon: <FaTimes className="text-error" />, color: 'bg-red-100 text-red-600' },
        { label: 'Products Sold', value: totalSold, icon: <FaTicketAlt className="text-white" />, color: 'bg-blue-500 text-white', isSpecial: true },
        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <FaTicketAlt className="text-white" />, color: 'bg-emerald-500 text-white', isSpecial: true }
    ];

    const StatusDot = ({ type, pulse = false }) => (
        <div className="inline-grid *:[grid-area:1/1]">
            {pulse && <div className={`status ${type} animate-ping`}></div>}
            <div className={`status ${type}`}></div>
        </div>
    );

    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // Handle Sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Apply sorting to filtered orders
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (!sortConfig.key) return 0;
        
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested fields or special logic
        if (sortConfig.key === 'createdAt') {
            aValue = a.createdAt?.seconds || 0;
            bValue = b.createdAt?.seconds || 0;
        }
        if (sortConfig.key === 'totalAmount') {
            aValue = Number(a.totalAmount) || 0;
            bValue = Number(b.totalAmount) || 0;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) {
        return <TableSkeleton rows={8} columns={5} />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Orders Management</h2>
                    <p className="text-slate-500 text-sm">Review and manage your store's orders</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Results:</span>
                    <span className="text-sm font-black text-indigo-600">{filteredOrders.length}</span>
                </div>
            </div>

            {/* QUICK FILTERS */}
            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'all', label: 'All Orders', icon: FaClipboardList },
                    { id: 'pending', label: 'New', icon: FaClock },
                    { id: 'shipped', label: 'Shipped', icon: FaShippingFast },
                    { id: 'delivered', label: 'Delivered', icon: FaCheck },
                    { id: 'cancelled', label: 'Cancelled', icon: FaTimes },
                    { id: 'paid', label: 'Paid', icon: FaTicketAlt },
                ].map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            activeFilter === filter.id 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                        }`}
                    >
                        <filter.icon size={14} />
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* ORDERS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th onClick={() => handleSort('id')} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600">
                                Order Details {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('userName')} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600">
                                Customer {sortConfig.key === 'userName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Products</th>
                            <th onClick={() => handleSort('createdAt')} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600">
                                Date {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('totalAmount')} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 text-right">
                                Amount {sortConfig.key === 'totalAmount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-800">#{order.id.slice(-6).toUpperCase()}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px]">{order.id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                            {order.userName?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{order.userName}</span>
                                            <span className="text-[11px] font-medium text-slate-400">{order.userPhone}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center -space-x-2">
                                        {order.products?.slice(0, 3).map((p, i) => (
                                            <div key={i} className="w-8 h-8 rounded-lg border-2 border-white bg-slate-50 overflow-hidden" title={p.title}>
                                                <img src={p.image} alt="" className="w-full h-full object-contain" />
                                            </div>
                                        ))}
                                        {order.products?.length > 3 && (
                                            <div className="w-8 h-8 rounded-lg border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                                                +{order.products.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-600">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-black text-indigo-600">₹{Number(order.totalAmount).toLocaleString()}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                                            order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {order.paymentStatus || 'pending'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                        order.status === 'delivered' ? 'bg-emerald-500 text-white' :
                                        order.status === 'pending' ? 'bg-amber-400 text-slate-900' :
                                        order.status === 'cancelled' ? 'bg-red-500 text-white' : 
                                        'bg-blue-500 text-white'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full bg-white opacity-80 ${order.status === 'pending' ? 'animate-pulse' : ''}`}></div>
                                        {order.status === 'pending' ? 'New Order' : order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="View Details"
                                    >
                                        <FaEye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedOrders.length === 0 && (
                     <div className="text-center py-20 bg-white">
                        <div className="text-5xl mb-4 grayscale opacity-20">📦</div>
                        <p className="text-slate-400 font-bold italic tracking-wide">No orders found matching your search</p>
                     </div>
                )}
            </div>

            {/* MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Details</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Reference ID: <span className="text-indigo-600">#{selectedOrder.id.slice(-6).toUpperCase()}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm shadow-slate-200"
                            >
                               <IoCloseSharp size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto hide-scrollbar">
                            {/* Actions & Status */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Modify Logistics</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                                        value={selectedOrder.status}
                                        onChange={(e) => updateStatus(selectedOrder.id, selectedOrder.status, e.target.value)}
                                    >
                                        <option value="pending">New Order</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Payment Confirmation</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Customer Info */}
                                <div className="space-y-4">
                                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MdPerson size={16} className="text-indigo-500" /> Customer Details
                                     </h3>
                                     <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                                         <p className="text-[13px] font-medium text-slate-600 leading-relaxed shadow-sm bg-white p-3 rounded-xl">
                                             <span className="font-black text-slate-900 block mb-1">{selectedOrder.shippingAddress?.fullName}</span>
                                             {selectedOrder.shippingAddress?.address}<br />
                                             {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}
                                         </p>
                                         <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-white p-3 rounded-xl shadow-sm">
                                             <FaPhoneAlt size={14} /> {selectedOrder.userPhone || selectedOrder.shippingAddress?.phone}
                                         </div>
                                     </div>
                                </div>

                                {/* Order Summary */}
                                <div className="space-y-4">
                                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MdAttachMoney size={16} className="text-indigo-500" /> Transaction Summary
                                     </h3>
                                     <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-xl shadow-slate-200">
                                         <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                                             <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Payment via</span>
                                             <span className="font-black italic">{selectedOrder.paymentMethod || 'COD'}</span>
                                         </div>
                                         <div className="space-y-2">
                                             <div className="flex justify-between text-slate-300 text-xs font-bold">
                                                 <span>Subtotal</span>
                                                 <span>₹{(selectedOrder.subtotal || selectedOrder.totalAmount).toLocaleString()}</span>
                                             </div>
                                             {selectedOrder.walletAmountUsed > 0 && (
                                                <div className="flex justify-between text-emerald-400 text-xs font-bold">
                                                    <span>Wallet Applied</span>
                                                    <span>-₹{selectedOrder.walletAmountUsed.toLocaleString()}</span>
                                                </div>
                                             )}
                                             <div className="flex justify-between text-xl font-black pt-2 border-t border-white/10">
                                                 <span className="text-slate-400 text-xs uppercase self-center">Grand Total</span>
                                                 <span className="text-emerald-400 tracking-tighter">₹{Number(selectedOrder.totalAmount).toLocaleString()}</span>
                                             </div>
                                         </div>
                                     </div>
                                </div>
                            </div>

                            {/* Products List */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Inventory Dispatched</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedOrder.products?.map((product, idx) => (
                                        <div key={idx} className="flex gap-4 bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all group">
                                            <div className="w-20 h-20 bg-slate-50 rounded-xl p-2 flex-shrink-0">
                                                <img src={product.image} alt="" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <h4 className="font-bold text-slate-800 text-sm truncate">{product.title}</h4>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold">Qty: {product.qty}</span>
                                                    <span className="text-sm font-black text-slate-900">₹{Number(product.price).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Admin messaging & Critical Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                                {/* Messaging Section */}
                                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <h4 className="text-slate-900 font-bold text-sm tracking-tight">Message to Customer</h4>
                                    </div>
                                    <textarea
                                        value={selectedOrder.adminNote || ""}
                                        onChange={(e) => setSelectedOrder({...selectedOrder, adminNote: e.target.value})}
                                        placeholder="Send a message regarding product updates, shipping delays, or thank you notes..."
                                        className="flex-1 min-h-[100px] w-full bg-white border border-indigo-100 rounded-2xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
                                    ></textarea>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await updateDoc(doc(db, "orders", selectedOrder.id), { adminNote: selectedOrder.adminNote });
                                                toast.success("Message updated for user");
                                            } catch (error) {
                                                toast.error("Failed to send message");
                                            }
                                        }}
                                        className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                                    >
                                        Update Message
                                    </button>
                                </div>

                                {/* Critical Actions Section */}
                                <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100/50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <h4 className="text-slate-900 font-bold text-sm tracking-tight">Administrative Status & Actions</h4>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4">
                                        {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                                            <button 
                                                onClick={() => handleCancelAndRefund(selectedOrder)}
                                                className="w-full px-6 py-4 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                                            >
                                                Void Order & Refund
                                            </button>
                                        )}
                                    </div>

                                    {selectedOrder.refundNote && (
                                        <div className="mt-4 p-4 bg-white border border-red-100 rounded-xl text-red-600 text-[11px] font-medium italic leading-relaxed">
                                            <span className="font-black uppercase tracking-widest block mb-1 not-italic opacity-70">Audit Trail:</span>
                                            {selectedOrder.refundNote}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
