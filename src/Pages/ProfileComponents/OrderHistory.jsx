import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { MdSearch, MdShoppingBag } from "react-icons/md";
import { FaClipboardList ,FaClock,FaCheck,FaShippingFast,FaTimes,FaTicketAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { IoCloseSharp } from "react-icons/io5";
import { doc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { generateInvoice } from "../../utils/invoiceGenerator";
import { Link } from "react-router-dom";
import axios from "axios";

const OrderHistory = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');


  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      orderData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(orderData);
    });

    return unsubscribe;
  }, [currentUser]);

  // Filtering logic
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.status === activeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.products.some(product =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredOrders(filtered);
  }, [orders, activeFilter, searchTerm]);

  const handleCancelOrder = async (order) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      let updateNote = "";

      // 1. Handle Razorpay Source Refund (if paid online)
      if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') {
        try {
          const response = await axios.post("http://localhost:5000/api/payments/refund", {
            paymentId: order.paymentId,
            amount: order.totalAmount, // Full refund
            notes: { reason: `Order Cancelled by Customer: ${order.id}` }
          });
          
          if (response.status === 200) {
            updateNote = "Online payment refund initiated. ";
          }
        } catch (err) {
          console.error("Online Refund Error:", err);
          toast.error("Failed to initiate online refund. Please contact support.");
          // We continue with status update so at least the order shows as cancelled
        }
      }

      // 2. Restore wallet amount if used
      if (order.walletAmountUsed > 0) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
            walletBalance: increment(order.walletAmountUsed)
        });

        await addDoc(collection(db, "wallet_transactions"), {
            userId: currentUser.uid,
            amount: order.walletAmountUsed,
            type: "credit",
            description: `Refund (Cancelled Order: ${order.id.slice(-6).toUpperCase()})`,
            date: serverTimestamp()
        });
        updateNote += "Wallet balance restored.";
      }

      // 3. Final Order Status Update
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: "cancelled",
        paymentStatus: (order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid') ? "refunded" : order.paymentStatus,
        refundNote: updateNote || "Order cancelled by customer.",
        cancelledAt: serverTimestamp()
      });

      toast.success(updateNote || "Order cancelled successfully.");
    } catch (error) {
      console.error("Cancel Error:", error);
      toast.error("Failed to cancel order.");
    }
  };

  // Stats Calculation
  const stats = [
      { label: 'Total', value: orders.length, icon: <FaClipboardList className="text-primary" />, color: 'bg-indigo-100 text-indigo-600 ' },
      { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: <FaClock className="text-warning" />, color: 'bg-yellow-100 text-yellow-600' },
      { label: 'Shipped', value: orders.filter(o => o.status === 'shipped').length, icon: <FaShippingFast className="text-blue"/>, color: 'bg-blue-100 text-blue-600' },
      { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon:  <FaCheck className="text-green-500" />, color: 'bg-green-100 text-green-600' },
      { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, icon:  <FaTimes className="text-error" />, color: 'bg-red-100 text-red-600' },
      { label: 'Total Spent', value: `₹${orders.reduce((sum, o) => sum + o.totalAmount, 0)}`, icon:  <FaTicketAlt className="text-white" />, color: 'bg-emerald-500 text-white', isSpecial: true }
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
            <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
            <p className="text-gray-500 text-sm">Track your Orders requests and payments</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => {
                const filterValue = stat.label.toLowerCase();
                const isActive = activeFilter === filterValue;
                const isClickable = !stat.isSpecial && stat.label !== 'Total';

                return (
                    <div
                        key={i}
                        onClick={isClickable ? () => setActiveFilter(filterValue) : () => setActiveFilter('all')}
                        className={`p-3 rounded-xl border flex flex-col  items-start justify-center gap-1 shadow-sm transition-all hover:scale-105 cursor-pointer ${
                            stat.isSpecial ? stat.color :
                            isActive ? 'bg-primary text-white border-primary' :
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

        {/* SEARCH BAR */}
        <div className="relative">
            <input
                type="text"
                placeholder="Search by order ID or product name..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400" />
        </div>

        {/* BOOKINGS LIST */}
        <div className="space-y-6">
            <p className="text-sm text-gray-500">Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> of {orders.length} bookings</p>
            
            {filteredOrders.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="text-4xl mb-4">🎫</div>
                    <p className="text-gray-500">No bookings found matching your search.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {filteredOrders.map((order) => (
                        <div key={order.id} className="card bg-base-100 w-full shadow-sm mx-auto overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300" >
                           <figure className="h-72 bg-gray-100 flex items-center justify-center relative">
                                {order.products && order.products.length > 0 && order.products[0]?.image && (
                                    <img src={order.products[0].image} alt="Order Cover" className="h-full max-w-full object-contain" />
                                )}
                                <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                         order.status === 'delivered' ? 'bg-green-400/90 text-white' :
                                         order.status === 'pending' ? 'bg-yellow-400/90 text-black' :
                                         order.status === 'cancelled' ? 'bg-red-400/90 text-white' : 'bg-blue-400/90 text-white'
                                     }`}>
                                         {order.status}
                                     </span>
                                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                         order.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' :
                                         order.paymentStatus === 'refunded' ? 'bg-orange-500 text-white' :
                                         'bg-gray-400 text-white'
                                     }`}>
                                         {order.paymentStatus || 'pending'}
                                     </span>
                                </div>
                           </figure>

                           <div className="card-body ">
                                <h2 className="card-title text-lg">
                                    Order #{order.id.slice(-6).toUpperCase()}
                                    {order.products && order.products.length > 1 && ` (${order.products.length} items)`}
                                   
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'} •
                                    {order.products ? order.products.reduce((acc, p) => acc + p.qty, 0) : 0} items •
                                    ₹{order.totalAmount}
                                </p>

                                <div className="card-actions justify-center mt-4">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="btn btn-primary w-full"
                                    >
                                        View Details
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

                        {/* Dual Status */}
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                             <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-400 uppercase font-bold">Order Progress</span>
                                <span className={`px-4 py-1 rounded-full text-xs font-bold w-fit ${
                                    selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                    selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {selectedOrder.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-400 uppercase font-bold">Payment Status</span>
                                <span className={`px-4 py-1 rounded-full text-xs font-bold w-fit ${
                                    selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                    selectedOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    selectedOrder.paymentStatus === 'refunded' ? 'bg-orange-100 text-orange-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {(selectedOrder.paymentStatus || 'pending').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {selectedOrder.refundNote && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-sm italic">
                                <strong>Refund Note:</strong> {selectedOrder.refundNote}
                            </div>
                        )}

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
                                {selectedOrder.products && selectedOrder.products.map((product, idx) => (
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
                                ))}
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-800 mb-4">Price Breakdown</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal ({selectedOrder.products ? selectedOrder.products.reduce((acc, p) => acc + (p.qty || 0), 0) : 0} items)</span>
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

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Link
                                to="/product"
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-center"
                            >
                                Reorder
                            </Link>
                            {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                                <button
                                    onClick={() => handleCancelOrder(selectedOrder)}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                                >
                                    Cancel Order
                                </button>
                            )}
                            <button
                                onClick={() => generateInvoice(selectedOrder)}
                                className="flex-1 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                            >
                                Download Invoice
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default OrderHistory;
