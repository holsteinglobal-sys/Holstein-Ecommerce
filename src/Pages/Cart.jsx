import { useState, useEffect } from "react";
import { useCart } from "./CartContext/CartContext.jsx";
import RelatedProducts from "./ProductDetails/RelatedProducts.jsx";
import { products } from "../Data/product.js";
import { MdDelete, MdAdd, MdLocationOn, MdCheck, MdClose, MdLocalShipping, MdCreditCard, MdArrowForward } from "react-icons/md";
import { FaPhoneAlt, FaShoppingCart, FaRupeeSign } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, onSnapshot, updateDoc, increment, runTransaction } from "firebase/firestore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MdAccountBalanceWallet, MdOutlineRemoveCircleOutline } from "react-icons/md";
import axios from "axios";
import { generateInvoice } from "../utils/invoiceGenerator";

const Cart = () => {

    

  const { cartItems, removeFromCart, updateQty, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for Checkout Overlay
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // STAGE: 1 = Address, 2 = Payment
  const [checkoutStep, setCheckoutStep] = useState(1);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '', street: '', city: '', state: '', pincode: '', phone: ''
  });

  // Shipping & Order State
  const [shippingCharge, setShippingCharge] = useState(0);
  const [isServiceable, setIsServiceable] = useState(false);
  const [checkingPin, setCheckingPin] = useState(false);
  const [paymentType, setPaymentType] = useState("cod");

  // Wallet State
  const [userWalletBalance, setUserWalletBalance] = useState(0);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);
  const [appliedWalletAmount, setAppliedWalletAmount] = useState(0);
  const [isUsingWallet, setIsUsingWallet] = useState(false);

  // --- 1. Fetch Addresses ---
  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, "users", currentUser.uid, "addresses");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Wallet Balance
    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribeWallet = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserWalletBalance(docSnap.data().walletBalance || 0);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeWallet();
    };
  }, [currentUser]);

  // --- 2. Calculate Totals ---
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  const totalBeforeWallet = subtotal + shippingCharge;
  const total = totalBeforeWallet - appliedWalletAmount;

  // --- 3. Handlers ---
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.street || !newAddress.pincode || newAddress.pincode.length < 6) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "users", currentUser.uid, "addresses"), newAddress);
      toast.success("Address added!");
      setIsAddingAddress(false);
      setNewAddress({ fullName: '', street: '', city: '', state: '', pincode: '', phone: '' });
      handleSelectAddress({ id: docRef.id, ...newAddress });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save address");
    }
  };

  const handleSelectAddress = async (addr) => {
    setSelectedAddressId(addr.id);
    await checkServiceability(addr.pincode);
  };

  const checkServiceability = async (pincode) => {
    if (!pincode) return;
    setCheckingPin(true);
    setShippingCharge(0);
    setIsServiceable(false);
    try {
      const q = query(
        collection(db, "shipping_rules"),
        where("pinCodes", "array-contains", pincode),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const rule = snapshot.docs[0].data();
        setShippingCharge(rule.shippingCharge);
        setIsServiceable(true);
        toast.success(`Serviceable! Shipping: ₹${rule.shippingCharge}`);
      } else {
        toast.error("Delivery not available to this PIN Code.");
        setIsServiceable(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error verifying pincode.");
    } finally {
      setCheckingPin(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!currentUser) return;
    if (!selectedAddressId || !isServiceable) {
      toast.error("Please select a valid delivery address.");
      return;
    }
    const addrObj = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addrObj) return;

    if (paymentType === "cod" || total <= 0) {
      // Robust COD Logic with Transactions
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const baseOrderData = {
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email,
          userEmail: currentUser.email,
          userPhone: addrObj.phone || userData.phone || "N/A",
          shippingAddress: addrObj,
          products: cartItems,
          subtotal: subtotal,
          shippingCharge: shippingCharge,
          walletAmountUsed: appliedWalletAmount,
          totalAmount: total,
          status: "pending",
          paymentStatus: total <= 0 ? "paid" : "pending",
          paymentMethod: total <= 0 ? "wallet" : "cod",
        };

        await runTransaction(db, async (transaction) => {
          // 1. If wallet is used, double check balance and deduct
          if (appliedWalletAmount > 0) {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error("User document not found");
            
            const currentBalance = Number(userSnap.data().walletBalance) || 0;
            if (currentBalance < appliedWalletAmount) {
              throw new Error(`Insufficient wallet balance for COD. Required: ${appliedWalletAmount}, Available: ${currentBalance}`);
            }

            transaction.update(userRef, {
              walletBalance: increment(-appliedWalletAmount)
            });

            // Record transaction
            const transRef = doc(collection(db, "wallet_transactions"));
            transaction.set(transRef, {
              userId: currentUser.uid,
              amount: appliedWalletAmount,
              type: "debit",
              description: `Order Payment (Method: COD)`,
              date: serverTimestamp(),
            });
          }

          // 2. Create Order
          const orderRef = doc(collection(db, "orders"));
          transaction.set(orderRef, {
            ...baseOrderData,
            createdAt: serverTimestamp()
          });
        });

        await clearCart();
        toast.success("Order Placed Successfully!");
        setAppliedWalletAmount(0);
        setIsCheckoutOpen(false);
        setCheckoutStep(1);
        navigate("/profile");
      } catch (error) {
        console.error("COD Order Error:", error);
        toast.error(error.message || "Failed to place order.");
      }
    } else {
      // Razorpay Logic (Secure Production Flow)
      try {
        // 1. Create secure order on backend with price verification
        const payload = {
          userId: currentUser.uid,
          items: cartItems.map(item => ({ id: item.id, qty: item.qty })),
          walletAmountUsed: appliedWalletAmount,
          shippingCharge: shippingCharge
        };
        console.log("Creating Razorpay Order with payload:", payload);

        const response = await axios.post("http://localhost:5000/api/payments/create-order", payload);

        const rzpOrder = response.data;

        const options = {
          key: "rzp_test_S9Fwb7DWGkJ80i", 
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "Holstein Nutrition",
          description: "Premium Cattle Feed",
          order_id: rzpOrder.id,
          handler: async (response) => {
            try {
              // 1. Prepare Order Data for Backend
              const userDoc = await getDoc(doc(db, "users", currentUser.uid));
              const userData = userDoc.exists() ? userDoc.data() : {};

              const baseOrderData = {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userEmail: currentUser.email,
                userPhone: addrObj.phone || userData.phone || "N/A",
                shippingAddress: addrObj,
                products: cartItems,
                subtotal: subtotal,
                shippingCharge: shippingCharge,
                walletAmountUsed: rzpOrder.verifiedWalletUsage,
                totalAmount: rzpOrder.verifiedTotal,
                paymentMethod: "razorpay",
              };

              // 2. Verify payment and create order on backend
              const verifyRes = await axios.post("http://localhost:5000/api/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: baseOrderData
              });

              if (verifyRes.status === 200) {
                const firestoreOrderId = verifyRes.data.orderId;
                
                // 3. Generate Invoice (using local data + backend ID)
                try {
                  generateInvoice({ id: firestoreOrderId, ...baseOrderData, totalAmount: rzpOrder.verifiedTotal });
                } catch (invErr) {
                  console.error("Invoice Generation Error:", invErr);
                  // Don't block the whole flow if invoice fails
                }

                // 4. Cleanup & Redirect
                await clearCart();
                toast.success("Payment Successful!");
                setAppliedWalletAmount(0);
                setIsCheckoutOpen(false);
                setCheckoutStep(1);
                navigate("/order-success", { state: { orderId: firestoreOrderId, total: rzpOrder.verifiedTotal } });
              }
            } catch (err) {
              console.error("Verification Catch Error:", err);
              toast.error(err.response?.data?.message || "Payment verification failed. Please contact support if amount was deducted.");
            }
          },
          prefill: {
            name: currentUser.displayName,
            email: currentUser.email,
            contact: addrObj.phone
          },
          theme: {
            color: "#3b82f6"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Razorpay Error:", error);
        // Show the SPECIFIC error from backend if available
        const errMsg = error.response?.data?.error || error.response?.data?.message || "Failed to initiate payment";
        toast.error(`Payment Failed: ${errMsg}`);
      }
    }
  };

  const handleApplyWallet = async () => {
    const amount = Number(walletAmountToUse);
    if (amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > userWalletBalance) {
      toast.error("Insufficient wallet balance");
      return;
    }
    if (amount > totalBeforeWallet) {
      toast.error("Amount exceeds total order value");
      return;
    }

    // Only update UI state, avoid early Firestore deduction to prevent price mismatch in Razorpay
    setAppliedWalletAmount(prev => prev + amount);
    setWalletAmountToUse(0);
    toast.success(`₹${amount} applied from wallet`);
  };

  const handleRemoveWallet = async () => {
    // Only reset UI state
    setAppliedWalletAmount(0);
    toast.success("Wallet balance removed");
  };

  // Restoration Logic removed as deduction is now delayed until payment confirmation


  // --- 4. Empty State ---
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 m-4 rounded-3xl animate-fadeIn">
         <div className="text-8xl mb-6 text-blue-200"><FaShoppingCart /></div>
         <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
         <p className="text-gray-500 mb-8 text-lg">Looks like you haven't added anything yet.</p>
         <button onClick={() => navigate('/product')} className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-1">
            Start Shopping
         </button>
      </div>
    );
  }

  // --- 5. Main Render ---
  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-7xl relative mt-25">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
            <div>
               <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
               <p className="text-gray-500 mt-1 font-medium">{cartItems.length} items in your bag</p>
            </div>
            <div className="text-right hidden md:block">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">₹{subtotal.toLocaleString()}</p>
            </div>
        </div>

        {/* --- UNIQUE CART UI (List of Cards) --- */}
     <div className="max-h-[70vh] overflow-y-auto scrollbar-hide pr-2">
  <div className="grid grid-cols-1 gap-6 mb-20">
    {cartItems.map((item) => (
      <div
        key={item.id}
        className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 flex flex-col md:flex-row items-center gap-6"
      >
        {/* Image */}
        <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-50 rounded-2xl overflow-hidden relative">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="badge badge-sm badge-ghost mb-2">
            {item.category}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {item.title}
          </h3>
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-bold text-blue-600">
              ₹{(item.price * item.qty).toLocaleString()}
            </p>
            {item.qty > 1 && (
              <p className="text-xs text-gray-400 font-medium">
                ₹{item.price.toLocaleString()} per {item.Quantity}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 bg-gray-50 p-2 rounded-2xl">
          <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl shadow-sm">
            <button
              onClick={() => updateQty(item.id, item.qty - 1)}
              disabled={item.qty <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 font-bold"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-gray-700">
              {item.qty}
            </span>
            <button
              onClick={() => updateQty(item.id, item.qty + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 font-bold"
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.id)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors"
          >
            <MdDelete size={20} />
          </button>
        </div>
      </div>
    ))}
  </div>
</div>


        {/* --- BOTTOM FLOATING BAR (Mobile/Desktop) --- */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-10">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                 <div className="md:hidden">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-xl font-bold text-gray-900">₹{subtotal.toLocaleString()}</p>
                 </div>
                 <div className="hidden md:block"></div> {/* Spacer */}
                 <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 disabled:opacity-50 hover:scale-105 transition-all shadow-xl"
                 >
                    Proceed to Checkout <MdArrowForward />
                 </button>
            </div>
        </div>

        {/* Related Products Section */}
        <div className="mb-24">
             <RelatedProducts products={products} />
        </div>


        {/* --- CHECKOUT OVERLAY (THE "APPEARING DIV") --- */}
        {isCheckoutOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div 
                    className="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up"
                    style={{ aspectRatio: '16/9' }} // Try to enforce landscape, but responsible CSS handles it too
                >
                    {/* Header */}
                    <div className="h-16 border-b flex items-center justify-between px-8 bg-gray-50">
                        <div className="flex items-center gap-2">
                             <div className="font-bold text-xl text-gray-800 tracking-tight">Checkout</div>
                        </div>
                        
                        {/* Stepper */}
                         <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 ${checkoutStep >= 1 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${checkoutStep >= 1 ? 'bg-blue-100' : 'bg-gray-200'}`}>1</div>
                                <span>Address</span>
                            </div>
                            <div className="w-8 h-[2px] bg-gray-200"></div>
                            <div className={`flex items-center gap-2 ${checkoutStep >= 2 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${checkoutStep >= 2 ? 'bg-blue-100' : 'bg-gray-200'}`}>2</div>
                                <span>Payment</span>
                            </div>
                         </div>

                        <button onClick={() => setIsCheckoutOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200">
                            <MdClose size={20} />
                        </button>
                    </div>

                    {/* Split Content */}
                    <div className="flex-1 flex overflow-hidden">
                        
                        {/* LEFT: Order Summary (40%) */}
                        <div className="w-[40%] bg-gray-50 border-r border-gray-100 p-8 overflow-y-auto hidden md:block custom-scrollbar">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FaShoppingCart className="text-gray-400"/> Order Summary
                            </h3>
                            <div className="space-y-4 mb-8">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <img src={item.image} alt="" className="w-16 h-16 object-cover rounded-xl bg-white border border-gray-100 p-1" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                                            <p className="text-gray-500 text-xs mt-1">Qty: {item.qty} × ₹{item.price}</p>
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm">₹{item.price * item.qty}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t border-gray-200 pt-6 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className={shippingCharge > 0 ? "text-gray-800" : "text-orange-500 font-medium"}>
                                        {shippingCharge > 0 ? `₹${shippingCharge}` : (isServiceable ? "Free" : "Calculating...")}
                                    </span>
                                </div>
                                {appliedWalletAmount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-medium">
                                        <span>Wallet Applied</span>
                                        <span>- ₹{appliedWalletAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-2xl font-bold text-gray-900 pt-4 border-t border-gray-200 mt-4">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Wizard Steps (60%) */}
                        <div className="flex-1 p-8 overflow-y-auto bg-white relative">
                            
                            {/* STEP 1: ADDRESS */}
                            {checkoutStep === 1 && (
                                <div className="animate-fade-in space-y-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <MdLocationOn className="text-blue-500" /> Confirm Delivery Address
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* New Address Card */}
                                        <button 
                                            onClick={() => { setIsAddingAddress(true); setNewAddress({ fullName: '', street: '', city: '', state: '', pincode: '', phone: '' }); }}
                                            className="flx flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-500 hover:text-blue-600 min-h-[140px]"
                                        >
                                            <MdAdd className="text-3xl mx-auto mb-2" />
                                            <span className="font-bold text-sm">Add New Address</span>
                                        </button>

                                        {/* Saved Addresses */}
                                          {savedAddresses.map(addr => (
                                            <div 
                                                key={addr.id} 
                                                onClick={() => handleSelectAddress(addr)}
                                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative text-left ${selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600 ring-offset-2' : 'border-gray-100 bg-gray-50 hover:border-blue-200'}`}
                                            >
                                                {selectedAddressId === addr.id && <div className="absolute top-4 right-4 text-blue-600"><MdCheck size={20} /></div>}
                                                <p className="font-bold text-gray-900">{addr.fullName}</p>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{addr.street}, {addr.city}</p>
                                                <p className="text-xs font-bold bg-gray-200 px-2 py-1 rounded-md inline-block mt-3">{addr.pincode}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Address Form Modal (Nested or Inline) */}
                                    {isAddingAddress && (
                                        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
                                            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md animate-scale-up">
                                                <h3 className="font-bold text-lg mb-4">New Address</h3>
                                                <form onSubmit={handleSaveAddress} className="space-y-3">
                                                    <input className="input-field" placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} required/>
                                                    <input className="input-field" placeholder="Phone" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input className="input-field" placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} required/>
                                                        <input className="input-field" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required/>
                                                    </div>
                                                    <textarea className="input-field" rows="2" placeholder="Address (Street, House No)" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} required></textarea>
                                                    <div className="flex gap-3 pt-2">
                                                        <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-100 font-bold">Cancel</button>
                                                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Save</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    {/* Footer Action */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-white border-t">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                 {selectedAddressId && !checkingPin && !isServiceable && <span className="text-red-500 text-sm font-bold">Pincode not serviceable</span>}
                                                 {checkingPin && <span className="text-blue-500 text-sm font-bold">Checking availability...</span>}
                                            </div>
                                            <button 
                                                disabled={!selectedAddressId || !isServiceable || checkingPin}
                                                onClick={() => setCheckoutStep(2)}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-blue-300 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                            >
                                                Proceed to Payment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: PAYMENT */}
                            {checkoutStep === 2 && (
                                <div className="animate-fade-in space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold flex items-center gap-2">
                                            <MdCreditCard className="text-green-500" /> Select Payment Method
                                        </h2>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Wallet Balance</p>
                                            <p className="text-sm font-bold text-gray-900">₹{(userWalletBalance - appliedWalletAmount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Wallet Integration Section */}
                                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <MdAccountBalanceWallet className="text-blue-500 text-xl" />
                                            <span className="font-bold text-gray-800">Use Wallet Balance</span>
                                        </div>
                                        
                                        {appliedWalletAmount > 0 ? (
                                            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-bold text-blue-700">Applied: ₹{appliedWalletAmount}</div>
                                                </div>
                                                <button 
                                                    onClick={handleRemoveWallet}
                                                    className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-bold"
                                                >
                                                    <MdOutlineRemoveCircleOutline /> Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input 
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    className="input-field flex-1"
                                                    value={walletAmountToUse || ''}
                                                    onChange={e => setWalletAmountToUse(e.target.value)}
                                                />
                                                <button 
                                                    onClick={handleApplyWallet}
                                                    className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-gray-400">Available: ₹{userWalletBalance - appliedWalletAmount}</p>
                                    </div>

                                    <div className="space-y-4">
                                        {[ 'upi', 'cod'].map(method => (
                                            <label key={method} className={`flex items-center gap-6 p-6 rounded-2xl border-2 cursor-pointer transition-all ${paymentType === method ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                                <input type="radio" name="payment" className="w-5 h-5 text-green-600" checked={paymentType === method} onChange={() => setPaymentType(method)} />
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-800 uppercase">{method.replace('cod', 'Cash on Delivery')}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {method === 'cod' ? 'Pay when you receive the order' : 'Secure online payment'}
                                                    </div>
                                                </div>
                                                {method === 'card' && <MdCreditCard className="text-2xl text-gray-400" />}
                                                {method === 'upi' && <FaRupeeSign className="text-2xl text-gray-400" />}
                                                {method === 'cod' && <MdLocalShipping className="text-2xl text-gray-400" />}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Footer Action */}
                                    <div className="relative bottom-0 left-0 right-0 p-8 bg-white border-t">
                                        <div className="flex justify-between items-center gap-4">
                                            <button onClick={() => setCheckoutStep(1)} className="text-gray-500 font-bold hover:text-black">Back</button>
                                            <button 
                                                onClick={handlePlaceOrder}
                                                className="flex-1 px-8 py-4 bg-green-600 text-white rounded-full font-bold text-lg shadow-xl hover:shadow-green-300 hover:scale-[1.02] transition-all"
                                            >
                                                Pay ₹{total.toLocaleString()} & Place Order
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* CSS for custom inputs if not present globally */}
        <style>{`
            .input-field {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #f3f4f6;
                border-radius: 12px;
                outline: none;
                transition: all 0.2s;
            }
            .input-field:focus {
                border-color: #3b82f6;
                background-color: #eff6ff;
            }
        `}</style>

    </div>
  );
};

export default Cart; 


