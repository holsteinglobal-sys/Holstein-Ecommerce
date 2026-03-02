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
import { addReview, checkUserReviewed } from "../../services/reviewService";
import { FaStar } from "react-icons/fa";
import TableSkeleton from '../../Component/Skeletons/TableSkeleton';

const OrderHistory = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedProducts, setReviewedProducts] = useState({}); // Keep track of reviewed products in this session
  const [loading, setLoading] = useState(true);


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
      setLoading(false);
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
          const response = await axios.post("/api/payments/refund", {
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

  const handleAddReview = (order) => {
    setReviewOrder(order);
    setShowReviewModal(true);
    setReviewRating(5);
    setReviewComment("");
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewOrder || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      const promises = reviewOrder.products.map(product => 
        addReview({
          productId: product.productId || product.id, // Support both formats
          productTitle: product.title,
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email.split('@')[0],
          rating: reviewRating,
          comment: reviewComment,
          orderId: reviewOrder.id,
        })
      );

      await Promise.all(promises);

      toast.success("Thank you for your review!");
      setShowReviewModal(false);
      
      // Mark as reviewed in this session
      setReviewedProducts(prev => {
        const next = { ...prev };
        next[reviewOrder.id] = true;
        return next;
      });

    } catch (error) {
      console.error("Review Error:", error);
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Stats Calculation
  const stats = [
      { label: 'Total', value: orders.length, icon: <FaClipboardList className="text-primary" />, color: 'bg-indigo-100 text-indigo-600 ' },
      { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: <FaClock className="text-warning" />, color: 'bg-yellow-100 text-yellow-600' },
      { label: 'Shipped', value: orders.filter(o => o.status === 'shipped').length, icon: <FaShippingFast className="text-blue"/>, color: 'bg-blue-100 text-blue-600' },
      { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon:  <FaCheck className="text-green-500" />, color: 'bg-green-100 text-green-600' },
      { label: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length, icon:  <FaTimes className="text-error" />, color: 'bg-red-100 text-red-600' },
    //   { label: 'Total Spent', value: `₹${orders.reduce((sum, o) => sum + o.totalAmount, 0)}`, icon:  <FaTicketAlt className="text-white" />, color: 'bg-emerald-500 text-white', isSpecial: true }
  ];

  const StatusDot = ({ type, pulse = false }) => (
  <div className="inline-grid *:[grid-area:1/1]">
    {pulse && <div className={`status ${type} animate-ping`}></div>}
    <div className={`status ${type}`}></div>
  </div>
);


  if (loading) {
    return <TableSkeleton rows={8} columns={5} />;
  }

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
                        className={`p-2 md:p-3 rounded-xl border flex flex-col items-start justify-center gap-1 shadow-sm transition-all hover:scale-105 cursor-pointer ${
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
                        <span className={`text-xl md:text-2xl font-bold ${
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
                <div className="flex flex-col gap-6">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                            {/* Top Section: Status and Rate */}
                            <div className="p-4 md:px-6 md:py-4 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                            order.paymentStatus === 'refunded' ? 'bg-orange-100 text-orange-700' :
                                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {order.paymentStatus || 'pending'}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-800">
                                            Order #{order.id.slice(-6).toUpperCase()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tight">Total Amount</p>
                                        <p className="text-xl font-black text-primary">₹{order.totalAmount}</p>
                                    </div>
                                    {order.status === 'delivered' && !reviewedProducts[order.id] && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAddReview(order); }}
                                            className="text-xs font-bold text-primary hover:text-primary-focus flex items-center gap-1 transition-colors"
                                        >
                                            <FaStar className="text-yellow-400" /> Rate & Review Product
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Lower Section: Product and Details Button */}
                            <div className="p-4 md:px-6 md:py-5 flex flex-col md:flex-row items-center gap-6">
                                <div className="flex-1 flex items-center gap-4 w-full">
                                    <div className="w-20 h-20 min-w-[80px] bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center p-2">
                                        {order.products && order.products.length > 0 && order.products[0]?.image ? (
                                            <img src={order.products[0].image} alt={order.products[0].title} className="max-h-full max-w-full object-contain" />
                                        ) : (
                                            <MdShoppingBag className="text-3xl text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">
                                            {order.products && order.products[0]?.title}
                                            {order.products && order.products.length > 1 && (
                                                <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    +{order.products.length - 1} more items
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {order.products && order.products[0]?.variant || 'Standard Variant'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-sm">
                                            <span className="font-semibold text-gray-700">₹{order.products && order.products[0]?.price}</span>
                                            <span className="text-gray-300">|</span>
                                            <span className="text-gray-500">Qty: {order.products && order.products[0]?.qty}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                                >
                                    Order Details
                                </button>
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
                            className="text-gray-500 hover:text-black p-2"
                        >
                           <IoCloseSharp className="text-2xl md:text-3xl" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                        {/* Dual Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                             <div className="flex flex-col gap-1">
                                <span className="text-[10px] md:text-xs text-gray-400 uppercase font-bold">Order Progress</span>
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
                                    selectedOrder.paymentStatus === 'refunded' ? 'bg-orange-100 text-orange-700' :
                                    selectedOrder.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {(selectedOrder.paymentStatus || 'pending').toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {selectedOrder.refundNote && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm italic">
                                <strong>Refund Audit Note:</strong> {selectedOrder.refundNote}
                            </div>
                        )}

                        {selectedOrder.adminNote && (
                            <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <MdShoppingBag size={40} />
                                </div>
                                <div className="relative z-10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                        <span className="font-black uppercase tracking-widest text-[10px]">Message from Admin</span>
                                    </div>
                                    <p className="font-medium leading-relaxed italic">"{selectedOrder.adminNote}"</p>
                                </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                            <Link
                                to="/product"
                                className="py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-center text-sm"
                            >
                                Reorder
                            </Link>
                            {(selectedOrder.status === 'pending' || selectedOrder.status === 'paid') && (
                                <button
                                    onClick={() => handleCancelOrder(selectedOrder)}
                                    className="py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm"
                                >
                                    Cancel Order
                                </button>
                            )}
                            <button
                                onClick={() => generateInvoice(selectedOrder)}
                                className="py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors text-sm"
                            >
                                Invoice
                            </button>
                        </div>

                        {selectedOrder.status === 'delivered' && !reviewedProducts[selectedOrder.id] && (
                            <button
                                onClick={() => handleAddReview(selectedOrder)}
                                className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                <FaStar /> Rate your experience with this order
                            </button>
                        )}

                    </div>
                </div>
            </div>
        )}

        {/* REVIEW MODAL */}
        {showReviewModal && (
            <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fadeIn">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaStar size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Rate Your Order</h2>
                        <p className="text-gray-500">Your feedback helps us and other customers!</p>
                    </div>

                    <form onSubmit={submitReview} className="space-y-6">
                        <div className="flex justify-center gap-2 py-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    className={`text-4xl transition-all ${
                                        star <= reviewRating ? "text-yellow-400 scale-110" : "text-gray-200"
                                    }`}
                                >
                                    <FaStar />
                                </button>
                            ))}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold text-gray-700">Tell us more</span>
                            </label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="textarea textarea-bordered h-32 rounded-xl focus:border-primary w-full outline-none resize-none"
                                placeholder="What did you like or dislike about the products?"
                                required
                            ></textarea>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                className="btn btn-outline flex-1 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingReview}
                                className={`btn btn-primary flex-1 rounded-xl ${isSubmittingReview ? 'loading' : ''}`}
                            >
                                {isSubmittingReview ? "Submitting..." : "Submit Review"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default OrderHistory;
