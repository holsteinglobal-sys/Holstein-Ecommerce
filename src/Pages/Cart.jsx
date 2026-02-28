import { useState, useEffect } from "react";
import { useCart } from "./CartContext/CartContext.jsx";
import RelatedProducts from "./ProductDetails/RelatedProducts.jsx";
import { getProducts } from "../services/adminService";
import { MdDelete, MdAdd, MdLocationOn, MdCheck, MdClose, MdLocalShipping, MdCreditCard, MdArrowForward,MdConfirmationNumber } from "react-icons/md";
import { FaPhoneAlt, FaShoppingCart, FaRupeeSign } from "react-icons/fa";
import ProductCardSkeleton from "../Component/Skeletons/ProductCardSkeleton";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, onSnapshot, updateDoc, increment, runTransaction } from "firebase/firestore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MdAccountBalanceWallet, MdOutlineRemoveCircleOutline } from "react-icons/md";
import axios from "axios";
import { generateInvoice } from "../utils/invoiceGenerator";
import PaymentStatusOverlay from "../Component/PaymentStatusOverlay.jsx";

const Cart = () => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const { cartItems, removeFromCart, updateQty, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State for Checkout Overlay
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // STAGE: 1 = Address, 2 = Payment
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

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
  
  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, value }
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Payment UI Status: null | 'verifying' | 'confirming' | 'generating' | 'success'
  const [paymentStatus, setPaymentStatus] = useState(null);

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

  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const data = await getProducts();
        const activeProducts = data.filter(p => p.isVisible !== false);
        setProducts(activeProducts);

        // --- Validate Cart against actual products ---
        if (cartItems.length > 0 && activeProducts.length > 0) {
            const staleItems = cartItems.filter(item => 
                !activeProducts.find(p => p.id === item.id)
            );

            if (staleItems.length > 0) {
                console.warn("Stale items detected in cart:", staleItems);
                toast.error(`${staleItems.length} item(s) in your cart are no longer available and will be removed.`);
                
                // Automaticaly remove stale items
                staleItems.forEach(item => {
                    removeFromCart(item.id);
                });
            }
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, [cartItems.length, products.length]); 

  // --- 1.1 Focused Checkout Logic ---
  useEffect(() => {
    if (isCheckoutOpen) {
      document.body.classList.add('checkout-active');
    } else {
      document.body.classList.remove('checkout-active');
    }
    return () => document.body.classList.remove('checkout-active');
  }, [isCheckoutOpen]);

  // --- 2. Calculate Totals (Sync with DB prices to avoid stale price issues) ---
  const subtotal = cartItems.reduce((sum, item) => {
    const liveProduct = products.find(p => p.id === item.id);
    const price = liveProduct ? Number(liveProduct.price) : Number(item.price);
    return sum + (price * Number(item.qty));
  }, 0);

  const totalBeforeWallet = subtotal + shippingCharge - (appliedCoupon?.value || 0);
  const total = Math.max(0, totalBeforeWallet - appliedWalletAmount);

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
        where("pinCodes", "array-contains", pincode)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const rule = snapshot.docs[0].data();
        if (rule.isActive) {
          setShippingCharge(rule.shippingCharge);
          setIsServiceable(true);
          toast.success(`Serviceable! Shipping: ₹${rule.shippingCharge}`);
        } else {
          setShippingCharge(0);
          setIsServiceable(false);
          toast.error("Delivery temporarily unavailable in this location");
        }
      } else {
        // Fallback for unknown PIN codes: Allow with ₹0 shipping
        setShippingCharge(0);
        setIsServiceable(true);
        toast.success("Standard Shipping applied (₹0)");
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

    if (paymentType === "cod") {
      const confirmCod = window.confirm("Are you sure you want to proceed with Cash on Delivery? Our delivery partner will collect the payment at your doorstep.");
      if (!confirmCod) return;
    }

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
          couponCode: appliedCoupon?.code || null,
          couponDiscount: appliedCoupon?.value || 0,
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

          // 3. Increment Coupon Redemption and Record it
          if (appliedCoupon) {
            const couponRef = doc(db, "coupons", appliedCoupon.id);
            transaction.update(couponRef, {
              redemptionCount: increment(1),
              isActive: false // One-time use? Let's assume one-time for now as per previous logic
            });

            const redempRef = doc(collection(db, "redemptions"));
            transaction.set(redempRef, {
              userName: baseOrderData.userName,
              userEmail: baseOrderData.userEmail,
              couponCode: appliedCoupon.code,
              amount: appliedCoupon.value,
              date: serverTimestamp()
            });
          }
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
        // 0. Final Cart Validation (Synchronous check against loaded products)
        const invalidItems = cartItems.filter(item => !products.some(p => p.id === item.id));
        if (invalidItems.length > 0) {
          toast.error(`${invalidItems.length} item(s) are no longer available. Cleaning your cart...`);
          invalidItems.forEach(item => removeFromCart(item.id));
          return;
        }

        // 1. Create secure order on backend with price verification
        const payload = {
          userId: currentUser.uid,
          items: cartItems.map(item => ({ 
            id: item.id, 
            qty: item.qty,
            price: Number(item.price) // Pass price as fallback for project mismatch
          })),
          walletAmountUsed: appliedWalletAmount,
          shippingCharge: shippingCharge,
          couponCode: appliedCoupon?.code || null
        };
        console.log("Creating Razorpay Order with payload:", payload);

        const response = await axios.post("/api/payments/create-order", payload);

        const rzpOrder = response.data;

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
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
                couponCode: appliedCoupon?.code || null,
                couponDiscount: appliedCoupon?.value || 0,
              };

              // 2. Verify payment and create order on backend
              const verifyRes = await axios.post("/api/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: baseOrderData
              });

              if (verifyRes.status === 200) {
                // Step 2: Confirming / Securing Order
                setPaymentStatus('confirming');
                
                // 3. Create Order in LOCAL Firestore (the correct project e6876)
                let firestoreOrderId = "";
                await runTransaction(db, async (transaction) => {
                  // A. Deduct Wallet if used
                  if (baseOrderData.walletAmountUsed > 0) {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnap = await transaction.get(userRef);
                    if (!userSnap.exists()) throw new Error("User not found");
                    
                    const currentBalance = Number(userSnap.data().walletBalance) || 0;
                    transaction.update(userRef, {
                      walletBalance: increment(-baseOrderData.walletAmountUsed)
                    });

                    // Record Transaction
                    const transRef = doc(collection(db, "wallet_transactions"));
                    transaction.set(transRef, {
                      userId: currentUser.uid,
                      amount: baseOrderData.walletAmountUsed,
                      type: "debit",
                      description: `Order Payment (RZP: ${response.razorpay_order_id})`,
                      orderId: response.razorpay_order_id,
                      date: serverTimestamp()
                    });
                  }

                  // B. Create Order Document
                  const orderRef = doc(collection(db, "orders"));
                  firestoreOrderId = orderRef.id;
                  transaction.set(orderRef, {
                    ...baseOrderData,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    paymentStatus: "paid",
                    status: "pending",
                    createdAt: serverTimestamp(),
                  });
                });

                // 4. Track Coupon Redemption
                if (appliedCoupon) {
                  try {
                    await updateDoc(doc(db, "coupons", appliedCoupon.id), {
                      redemptionCount: increment(1),
                      isActive: false
                    });
                    await addDoc(collection(db, "redemptions"), {
                      userName: baseOrderData.userName,
                      userEmail: baseOrderData.userEmail,
                      userId: currentUser.uid,
                      couponCode: appliedCoupon.code,
                      amount: appliedCoupon.value,
                      date: serverTimestamp()
                    });
                  } catch (e) {
                    console.error("Coupon Redemption tracking failed:", e);
                  }
                }

                // Step 3: Generating Invoice
                setPaymentStatus('generating');
                await new Promise(r => setTimeout(r, 1500)); // Artificial delay for premium feel

                // 5. Generate Invoice
                try {
                  const finalOrderForInvoice = { 
                    id: firestoreOrderId, 
                    ...baseOrderData, 
                    paymentStatus: "paid" 
                  };
                  generateInvoice(finalOrderForInvoice);
                } catch (invErr) {
                  console.error("Invoice Generation Error:", invErr);
                }

                // Step 4: Success state before redirect
                setPaymentStatus('success');
                await new Promise(r => setTimeout(r, 2000));

                // 4. Cleanup & Redirect
                await clearCart();
                toast.success("Payment Successful!");
                setAppliedWalletAmount(0);
                setIsCheckoutOpen(false);
                setCheckoutStep(1);
                setPaymentStatus(null);
                navigate("/order-success", { state: { orderId: firestoreOrderId, total: rzpOrder.verifiedTotal } });
              }
            } catch (err) {
              console.error("Verification Catch Error:", err);
              setPaymentStatus(null);
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
        console.error("Razorpay Error Details:", error.response?.data || error.message);
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

    // Set final amount (replaced, not cumulative to avoid UX bugs)
    setAppliedWalletAmount(amount);
    setWalletAmountToUse(0);
    toast.success(`₹${amount} applied from wallet`);
  };

  const handleRemoveWallet = async () => {
    // Only reset UI state
    setAppliedWalletAmount(0);
    toast.success("Wallet balance removed");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    setIsValidatingCoupon(true);
    try {
      const q = query(
        collection(db, "coupons"), 
        where("code", "==", couponCode.toUpperCase().trim()),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error("Invalid or expired coupon code");
      } else {
        const couponData = snapshot.docs[0].data();
        setAppliedCoupon({
          id: snapshot.docs[0].id,
          code: couponData.code,
          value: couponData.value
        });
        toast.success(`Coupon applied! ₹${couponData.value} off`);
        setCouponCode("");
      }
    } catch (error) {
      console.error("Coupon Error:", error);
      toast.error("Failed to apply coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success("Coupon removed");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-24">
      <div className="container mx-auto p-4 lg:p-8 max-w-7xl mt-4 md:mt-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Your Cart</h1>
            <p className="text-slate-500 mt-1 font-semibold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">{cartItems.length}</span>
              items ready for your herd
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end">
             <button 
                onClick={() => clearCart()}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest mb-2"
              >
                Clear All Items
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Cart Items (8 Cols) */}
          <div className="lg:col-span-8">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto hide-scrollbar pr-2">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden"
                >
                  {/* Background Accent */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Image */}
                  <div className="w-full sm:w-40 h-40 flex-shrink-0 bg-slate-50 rounded-2xl overflow-hidden relative group-hover:bg-indigo-50/50 transition-colors">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3">
                      <div className="badge badge-sm bg-white/80 backdrop-blur-md border-slate-100 text-slate-500 font-bold px-2 py-3 rounded-lg shadow-sm">
                        {item.category}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-2">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-1 truncate">
                      {item.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100/50">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-900 hover:bg-slate-900 hover:text-white disabled:opacity-20 transition-all font-bold text-base shadow-sm"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-slate-800 text-base">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-900 hover:bg-slate-900 hover:text-white transition-all font-bold text-base shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      <div className="hidden sm:block h-6 w-[1px] bg-slate-100 mx-1"></div>

                      <div className="flex flex-col">
                        <p className="text-xl font-bold text-indigo-600">
                          ₹{(item.price * item.qty).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                           ₹{item.price.toLocaleString()} / {item.Quantity || 'Unit'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center justify-center gap-3 sm:pl-6 sm:border-l border-slate-100">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 group/del"
                      title="Remove item"
                    >
                      <MdDelete size={22} className="group-hover/del:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Recommendations Sub-heading */}
            <div className="pt-8 pb-4">
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><MdAdd size={18} /></div>
                 Recommended for You
               </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {productsLoading ? (
                  [1,2].map(i => <ProductCardSkeleton key={i} />)
               ) : (
                  products.slice(0, 4).map(product => (
                    <div key={product.id} className="p-3 rounded-2xl border border-slate-100 flex gap-4 hover:shadow-md transition-all group">
                       <div className="w-14 h-14 bg-slate-50 rounded-xl p-2 flex-shrink-0">
                          <img src={product.image} className="w-full h-full  object-contain mix-blend-multiply group-hover:rotate-6 transition-transform" />
                       </div>
                       <div className="min-w-0">
                          <p className="font-bold text-slate-800  text-sm truncate">{product.title}</p>
                          <p className="text-indigo-600 font-bold text-sm mt-0.5">₹{Number(product.price).toLocaleString()}</p>
                       </div>
                       <button 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="ml-auto w-8 h-8 rounded-lg bg-slate-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                       >
                          <MdAdd size={16} />
                       </button>
                    </div>
                  ))
               )}
            </div>
          </div>

          {/* RIGHT: Order Summary Sticky (4 Cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                {/* Visual Polish */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-6 relative z-10">Order Summary</h3>
                
                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                    <span className="uppercase tracking-widest">Subtotal</span>
                    <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                    <span className="uppercase tracking-widest">Taxes</span>
                    <span className="text-slate-900">₹0</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">Estimated Total</span>
                      <span className="text-2xl font-bold text-indigo-600 tracking-tight">₹{subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                   <button 
                     onClick={() => setIsCheckoutOpen(true)}
                     className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 group"
                   >
                     Checkout Now
                     <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
                   </button>
                   
                   <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                     <MdCheck className="text-green-500 text-xs" />
                     Safe & Secure Checkout
                   </p>
                </div>
            </div>

            {/* Support Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-5 group hover:bg-indigo-50/20 transition-colors">
               <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                  <FaPhoneAlt size={14} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Need Help?</p>
                  <p className="text-sm font-bold text-slate-800">+91 9728211026</p>
               </div>
            </div>
          </div>

        </div>

        {/* --- MOBILE FLOATING BAR (Refined) --- */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 p-3 bg-slate-900/90 backdrop-blur-xl rounded-2xl z-50 flex justify-between items-center shadow-2xl animate-slide-up border border-white/10">
            <div className="pl-3">
               <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Estimated Total</p>
               <p className="text-xl font-bold text-white">₹{total.toLocaleString()}</p>
            </div>
            <button 
               onClick={() => setIsCheckoutOpen(true)}
               className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 active:scale-95 transition-all shadow-lg"
            >
               Checkout
            </button>
        </div>


        {/* --- CHECKOUT OVERLAY (Redesigned) --- */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 md:p-6 animate-fade-in">
            <div 
              className="bg-white w-full max-w-7xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up border border-slate-200"
            >
              {/* Header */}
              <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 md:px-10 bg-white flex-shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="font-bold text-lg md:text-xl text-slate-900">Secure Checkout</h2>
                  {/* <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100"> */}
                    {/* <MdCheck size={14} className="animate-pulse" /> */}
                    {/* <span className="text-[10px] font-bold uppercase tracking-widest">SSL Encrypted</span> */}
                  {/* </div> */}
                </div>
                
                {/* Stepper */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all ${checkoutStep === 1 ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200 shadow-sm' : 'text-slate-300'}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${checkoutStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                    <span className="text-xs font-bold uppercase tracking-widest">Shipping</span>
                  </div>
                  <div className="w-8 h-[2px] bg-slate-100"></div>
                  <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all ${checkoutStep === 2 ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-sm' : 'text-slate-300'}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${checkoutStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                    <span className="text-xs font-bold uppercase tracking-widest">Payment</span>
                  </div>
                </div>

                <button onClick={() => setIsCheckoutOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-200 transition-colors">
                  <MdClose size={20} />
                </button>
              </div>

              {/* Split Content */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* LEFT: Order Summary (Sticky on desktop) */}
                <div className={`fixed inset-0 md:relative md:flex w-full md:w-[32%] bg-slate-50/80 border-r border-slate-100 p-6 md:p-8 overflow-y-auto z-[70] md:z-0 transition-all duration-300 ${showMobileSummary ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                  <div className="md:hidden absolute top-4 right-4">
                    <button onClick={() => setShowMobileSummary(false)} className="p-2 bg-white rounded-xl shadow-lg text-slate-500"><MdClose size={20} /></button>
                  </div>
                  <div className="w-full">
                    <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><FaShoppingCart size={14}/></div> 
                      Summary
                    </h3>
                    <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 hide-scrollbar">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex gap-3 group bg-white p-2 rounded-xl shadow-sm border border-slate-100/50">
                          <div className="w-12 h-12 flex-shrink-0 bg-white rounded-lg border border-slate-100 p-1 overflow-hidden group-hover:shadow-md transition-all">
                            <img src={item.image} alt="" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{item.title}</h4>
                            <div className="flex justify-between items-end mt-0.5">
                              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{item.qty} × ₹{item.price.toLocaleString()}</p>
                              <p className="font-bold text-indigo-600 text-xs">₹{(item.price * item.qty).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-4 pt-8 border-t border-slate-200">
                      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                        <span>Items Total</span>
                        <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                        <span>Shipping Fee</span>
                        <span className={shippingCharge > 0 ? "text-slate-900" : "text-emerald-500"}>
                          {shippingCharge > 0 ? `₹${shippingCharge}` : (isServiceable ? "FREE" : "CALCULATING...")}
                        </span>
                      </div>
                      {appliedWalletAmount > 0 && (
                        <div className="flex justify-between items-center text-sm font-black text-white bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-100">
                          <span className="flex items-center gap-2"><MdAccountBalanceWallet /> Wallet Credit</span>
                          <span>- ₹{appliedWalletAmount.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="pt-6 mt-6 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-slate-900">Payable Amount</span>
                          <span className="text-xl font-bold text-slate-900 tracking-tight">₹{total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Wizard Steps */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white custom-scrollbar-checkout">
                  
                  {/* STEP 1: ADDRESS */}
                  {checkoutStep === 1 && (
                    <div className="animate-fade-in flex flex-col h-full">
                      <div className="flex-1 space-y-8">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm"><MdLocationOn size={20} /></div>
                            Delivery Destination
                          </h2>
                          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3 ml-14 opacity-70">Where should we ship your order?</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* New Address Card */}
                          <div 
                            onClick={() => { setIsAddingAddress(true); setNewAddress({ fullName: '', street: '', city: '', state: '', pincode: '', phone: '' }); }}
                            className="group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer text-slate-300 hover:text-indigo-500 min-h-[160px]"
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white group-hover:shadow-lg flex items-center justify-center mb-3 transition-all">
                              <MdAdd className="text-2xl" />
                            </div>
                            <span className="font-bold text-[10px] uppercase tracking-[0.25em]">Add New Address</span>
                          </div>

                          {/* Saved Addresses */}
                          {savedAddresses.map(addr => (
                            <div 
                              key={addr.id} 
                              onClick={() => handleSelectAddress(addr)}
                              className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between min-h-[160px] ${selectedAddressId === addr.id ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-slate-100'}`}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <p className={`font-bold text-base tracking-tight uppercase ${selectedAddressId === addr.id ? 'text-white' : 'text-slate-800'}`}>{addr.fullName}</p>
                                  {selectedAddressId === addr.id && <div className="w-6 h-6 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg"><MdCheck size={14} /></div>}
                                </div>
                                <p className={`text-xs font-semibold leading-relaxed ${selectedAddressId === addr.id ? 'text-indigo-50/80' : 'text-slate-400'}`}>{addr.street}, {addr.city}</p>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-bold tracking-[0.2em] uppercase ${selectedAddressId === addr.id ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>{addr.pincode}</span>
                                <FaPhoneAlt size={10} className={selectedAddressId === addr.id ? 'text-white/40' : 'text-slate-200'} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="mt-12 pt-8 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                          <div className="flex-1">
                            {selectedAddressId && !checkingPin && !isServiceable && (
                              <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-red-100 flex items-center gap-2 animate-pulse">
                                <MdClose className="text-base" />
                                <span>No service in this area</span>
                              </div>
                            )}
                            {checkingPin && (
                              <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-3">
                                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Calculating logistics...</span>
                              </div>
                            )}
                          </div>
                          <button 
                            disabled={!selectedAddressId || !isServiceable || checkingPin}
                            onClick={() => setCheckoutStep(2)}
                            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-indigo-100 hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                          >
                            Continue to Payment
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PAYMENT */}
                  {checkoutStep === 2 && (
                    <div className="animate-fade-in flex flex-col h-full space-y-10">
                      <div className="flex-1 space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                          <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm"><MdCreditCard size={20} /></div>
                              Billing Method
                            </h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3 ml-14 opacity-70">How would you like to pay?</p>
                          </div>
                          <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Secure Balance</p>
                            <p className="text-lg font-bold text-indigo-600">₹{(userWalletBalance - appliedWalletAmount).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Payment Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[ 'upi', 'cod'].map(method => (
                            <div 
                              key={method} 
                              onClick={() => setPaymentType(method)}
                              className={`group relative flex flex-col gap-6 p-6 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${paymentType === method ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md'}`}
                            >
                               {/* Background Glow */}
                              {paymentType === method && <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>}
                              
                              <div className="flex items-center justify-between relative z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${paymentType === method ? 'bg-white text-emerald-600 scale-110' : 'bg-white text-slate-300 shadow-sm'}`}>
                                  {method === 'upi' && <FaRupeeSign className="text-xl" />}
                                  {method === 'cod' && <MdLocalShipping className="text-xl" />}
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentType === method ? 'border-emerald-400 bg-emerald-700' : 'border-slate-200 bg-white'}`}>
                                  {paymentType === method && <MdCheck className="text-white text-[10px]" />}
                                </div>
                              </div>

                              <div className="relative z-10 pt-2">
                                <div className={`font-bold uppercase tracking-[0.25em] text-[10px] mb-1 ${paymentType === method ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {method === 'cod' ? 'Cash Protocol' : 'Digital Gateway'}
                                </div>
                                <div className={`text-lg font-bold tracking-tight ${paymentType === method ? 'text-white' : 'text-slate-800'}`}>
                                  {method === 'cod' ? 'Pay on Delivery' : 'Online Payment'}
                                </div>
                                <p className={`text-[10px] mt-1 font-semibold ${paymentType === method ? 'text-emerald-50/70' : 'text-slate-400'}`}>
                                  {method === 'cod' ? 'Collect at doorstep' : 'UPI, Cards, & More'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Wallet Section (Integrated) */}
                        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-white/5 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                           <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                              <div className="flex-1 text-center md:text-left">
                                 <h4 className="text-white font-bold text-lg mb-1 flex items-center justify-center md:justify-start gap-3">
                                   <MdAccountBalanceWallet className="text-indigo-400" />
                                   Redeem Rewards
                                 </h4>
                                 <p className="text-slate-400 text-[10px] font-semibold max-w-sm">Apply your available wallet balance to this order for instant discounts.</p>
                              </div>

                              <div className="w-full md:w-auto flex-shrink-0">
                                {appliedWalletAmount > 0 ? (
                                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-2 pl-4 rounded-xl border border-white/10">
                                    <div className="flex-1">
                                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Active Credit</p>
                                      <p className="text-lg font-bold text-white">₹{appliedWalletAmount.toLocaleString()}</p>
                                    </div>
                                    <button 
                                      onClick={handleRemoveWallet}
                                      className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-50 hover:text-white rounded-lg transition-all"
                                    >
                                      <MdClose size={18} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <input 
                                      type="number"
                                      placeholder="Amount..."
                                      className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 w-28 outline-none focus:border-indigo-500 transition-all text-sm font-bold placeholder:text-slate-600"
                                      value={walletAmountToUse || ''}
                                      onChange={e => setWalletAmountToUse(e.target.value)}
                                    />
                                    <button 
                                      onClick={handleApplyWallet}
                                      className="px-6 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-lg shadow-indigo-900/50 transition-all"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Footer Action */}
                      <div className="pt-8 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                          <button onClick={() => setCheckoutStep(1)} className="px-6 py-3 rounded-xl text-slate-700 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 transition-all border rounded-full">Go Back</button>
                          <button 
                            onClick={handlePlaceOrder}
                            className="w-full sm:w-auto px-10 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-[0.25em] text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all hover:bg-slate-900 group"
                          >
                            Complete Order • ₹{total.toLocaleString()}
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

        {/* --- ADD ADDRESS MODAL (Consistent Design) --- */}
        {isAddingAddress && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-up border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                   <div>
                      <h3 className="font-bold text-xl text-slate-900">Shipment Details</h3>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Personal & Delivery Info</p>
                   </div>
                   <button onClick={() => setIsAddingAddress(false)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-all"><MdClose size={20} /></button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Full Name</p>
                     <input className="checkout-input-v2" placeholder="John Doe" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} required/>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Contact Number</p>
                     <input className="checkout-input-v2" placeholder="+91 00000 00000" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} required/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">PIN Code</p>
                       <input className="checkout-input-v2" placeholder="123456" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} required/>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">City / Area</p>
                       <input className="checkout-input-v2" placeholder="Sirsa" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required/>
                    </div>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Street Address</p>
                     <textarea className="checkout-input-v2 resize-none" rows="2" placeholder="H.No, Street, Landmark..." value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} required></textarea>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 py-3 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">Cancel</button>
                    <button type="submit" className="flex-2 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-900 shadow-lg shadow-indigo-100 transition-all">Save Destination</button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* --- CUSTOM CSS FOR OVERHAUL --- */}
        <style>{`
            .checkout-input-v2 {
                width: 100%;
                padding: 12px 18px;
                border: 2px solid #f1f5f9;
                background-color: #f8fafc;
                border-radius: 1rem;
                outline: none;
                transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                font-size: 0.875rem;
                font-weight: 600;
                color: #0f172a;
            }
            .checkout-input-v2:focus {
                border-color: #6366f1;
                background-color: #fff;
                box-shadow: 0 10px 25px -10px rgba(99, 102, 241, 0.2);
            }
            .checkout-input-v2::placeholder { color: #cbd5e1; }
            
            .custom-scrollbar-checkout::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar-checkout::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar-checkout::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
            
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes scale-up { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            
            .animate-fade-in { animation: fade-in 0.4s ease-out; }
            .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
            .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.15); }
            
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* Payment Status Overlay */}
        <PaymentStatusOverlay status={paymentStatus} />

      </div>
    </div>
  );
};

export default Cart; 


