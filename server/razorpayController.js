import Razorpay from 'razorpay';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Initialize Firebase Admin
let isFirebaseInitialized = false;

try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || join(__dirname, 'serviceAccount.json');

  console.log(`[FIREBASE_INIT] Attempting to load credentials from: ${serviceAccountPath}`);

  if (!authFileExists(serviceAccountPath)) {
     throw new Error(`Service account file not found at ${serviceAccountPath}`);
  }

  const serviceAccount = JSON.parse(
    readFileSync(serviceAccountPath, 'utf8')
  );
  
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error("Invalid serviceAccount.json: Missing project_id, client_email, or private_key.");
  }

  console.log(`[FIREBASE_INIT] Service Account ID: ${serviceAccount.project_id}`);
  console.log(`[FIREBASE_INIT] Client Email: ${serviceAccount.client_email}`);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("[FIREBASE_INIT] Firebase Admin App initialized.");
  }
  
  isFirebaseInitialized = true;

  // Pre-flight check: Try to reach Firestore to ensure Auth is actually working
  // This catches the "16 UNAUTHENTICATED" error at startup
  const dbTest = admin.firestore();
  dbTest.listCollections()
    .then(() => console.log("[FIREBASE_CONNECTION_TEST] SUCCESS: Connected to Firestore."))
    .catch(err => {
        console.error("________________________________________________________________");
        console.error("[CRITICAL ERROR] FIREBASE CONNECTION FAILED");
        console.error("Error Code:", err.code);
        console.error("Message:", err.message);
        console.error("Resolution: Check if 'serviceAccount.json' is valid, not expired, and has 'Firebase Admin SDK Administrator Service Agent' roles.");
        console.error("________________________________________________________________");
    });

} catch (error) {
  console.error("________________________________________________________________");
  console.error("[FIREBASE_INIT] FATAL ERROR: Could not initialize Firebase Admin.");
  console.error(error.message);
  console.error("Resolution: Ensure 'serviceAccount.json' is present in the server directory and correct.");
  console.error("________________________________________________________________");
}

function authFileExists(path) {
    try {
        readFileSync(path);
        return true;
    } catch {
        return false;
    }
}

const db = admin.firestore();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, walletAmountUsed, shippingCharge, userId } = req.body;

    if (!isFirebaseInitialized) {
        console.error("[CREATE_ORDER] BLOCKED: Backend Server is not authenticating with Firebase.");
        return res.status(503).json({ 
            message: "Payment Service Unavailable: Server Authentication Failed.",
            error: "Backend failed to connect into database." 
        });
    }

    console.log("[CREATE_ORDER] Request received:", { 
      itemsCount: items?.length, 
      walletAmountUsed, 
      shippingCharge, 
      userId 
    });

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid items format. 'items' must be an array." });
    }

    if (items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    // 1. Verify Prices and Calculate Subtotal Server-side
    let calculatedSubtotal = 0;
    for (const item of items) {
      if (!item.id || !item.qty) {
        return res.status(400).json({ message: "Each item must have an 'id' and 'qty'." });
      }
      const productDoc = await db.collection('products').doc(item.id).get();
      if (!productDoc.exists) {
        console.warn(`[CREATE_ORDER] Product not found: ${item.id}`);
        return res.status(400).json({ message: `Product with ID ${item.id} not found in our database.` });
      }
      const productData = productDoc.data();
      const price = Number(productData.price);
      
      if (isNaN(price)) {
          console.error(`[CREATE_ORDER] Invalid price for product ${item.id}: ${productData.price}`);
          return res.status(500).json({ message: `Server Error: Invalid price data for product ${productData.title || item.id}` });
      }

      calculatedSubtotal += (price * Number(item.qty));
    }

    console.log(`[CREATE_ORDER] Calculated Subtotal: ₹${calculatedSubtotal}`);

    // 2. Verify Wallet Balance
    let verifiedWalletUsage = 0;
    if (walletAmountUsed > 0 && userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userWalletBalance = Number(userDoc.data().walletBalance) || 0;
        verifiedWalletUsage = Math.min(Number(walletAmountUsed), userWalletBalance, calculatedSubtotal);
        console.log(`[CREATE_ORDER] Wallet Verified: Request ${walletAmountUsed} | Available ${userWalletBalance} | Cap ${calculatedSubtotal} => Used ${verifiedWalletUsage}`);
      }
    }

    // 3. Calculate Final Total
    // Ensure all components are numbers
    const validShipping = Number(shippingCharge) || 0;
    const totalAmount = calculatedSubtotal + validShipping - verifiedWalletUsage;

    if (isNaN(totalAmount) || totalAmount < 0) {
        console.error(`[CREATE_ORDER] Invalid Total Calculation: ${calculatedSubtotal} + ${validShipping} - ${verifiedWalletUsage} = ${totalAmount}`);
        return res.status(400).json({ message: "Error calculating order total." });
    }

    // Razorpay expects amount in paise. Min amount is 100 paise (₹1)
    const amountInPaise = Math.round(totalAmount * 100);
    
    if (amountInPaise < 100 && amountInPaise > 0) {
         return res.status(400).json({ message: "Order amount must be at least ₹1." });
    }

    // If total is 0 (fully paid by wallet), handle purely as a wallet order (should be handled by frontend COD flow logic basically, or we create a dummy RZP order? No, RZP won't accept 0)
    // Actually, if amount is 0, frontend should have probably used the "Place Order" (COD/Wallet) flow, but let's handle it.
    if (amountInPaise === 0) {
         // If amount is 0, we can't create a Razorpay order. 
         // Strategy: Return a special flag telling frontend to bypass Razorpay and call the 'verify' endpoint (or place-order) directly.
         // But for now, let's assume strict separation. If we strictly need RZP, amount must be > 0.
         // Ideally frontend logic prevents this.
         console.warn("[CREATE_ORDER] Total amount is 0. Razorpay order cannot be created.");
         return res.status(400).json({ message: "Payable amount is 0. Please use Wallet/COD checkout method." });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("[CREATE_ORDER] Creating Razorpay Order with options:", options);

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      ...order,
      verifiedTotal: totalAmount,
      verifiedWalletUsage: verifiedWalletUsage
    });
  } catch (error) {
    console.error("RAZORPAY CREATE ORDER ERROR:", error);
    res.status(500).json({ 
      message: "Failed to create Razorpay order",
      error: error.message || "Unknown error" 
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log(`[VERIFY] Signature valid for order ${razorpay_order_id}. Processing database updates...`);
      
      let firestoreOrderId = null;
      if (orderData) {
        // Use a Firestore transaction for atomic updates
        await db.runTransaction(async (t) => {
          const userId = orderData.userId;
          const walletAmountUsed = Number(orderData.walletAmountUsed) || 0;

          // 1. Double check and deduct wallet balance if used
          if (walletAmountUsed > 0 && userId) {
            const userRef = db.collection('users').doc(userId);
            const userDoc = await t.get(userRef);
            
            if (!userDoc.exists) throw new Error("User not found during transaction");
            
            const currentBalance = Number(userDoc.data().walletBalance) || 0;
            if (currentBalance < walletAmountUsed) {
              throw new Error(`Insufficient wallet balance: Required ${walletAmountUsed}, Found ${currentBalance}`);
            }

            console.log(`[WALLET] Deducting ₹${walletAmountUsed} from user ${userId}. Current: ₹${currentBalance}`);
            t.update(userRef, {
              walletBalance: admin.firestore.FieldValue.increment(-walletAmountUsed)
            });

            // 2. Record wallet transaction
            const transRef = db.collection('wallet_transactions').doc();
            t.set(transRef, {
              userId: userId,
              amount: walletAmountUsed,
              type: "debit",
              description: `Order Payment (Verified: ${razorpay_order_id})`,
              orderId: razorpay_order_id,
              date: admin.firestore.FieldValue.serverTimestamp()
            });
          }

          // 3. Create Order
          const orderRef = db.collection('orders').doc();
          firestoreOrderId = orderRef.id;
          
          t.set(orderRef, {
            ...orderData,
            walletAmountUsed: walletAmountUsed, // Store as verified number
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            paymentStatus: "paid",
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          console.log(`[ORDER] Created order ${firestoreOrderId} with status paid.`);
        });
      }

      return res.status(200).json({ 
        message: "Payment verified successfully", 
        orderId: firestoreOrderId 
      });
    } else {
      console.warn(`[VERIFY] Signature mismatch for order ${razorpay_order_id}`);
      return res.status(400).json({ message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, notes } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    // Amount is optional. If not provided, Razorpay will refund the full amount.
    const refundOptions = {
      payment_id: paymentId,
      notes: notes || { reason: "Admin initiated refund" },
    };

    if (amount) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    res.status(200).json({ message: "Refund processed successfully", refund });
  } catch (error) {
    console.error("Refund Error:", error);
    res.status(500).json({ 
      message: "Failed to process refund", 
      error: error.description || error.message 
    });
  }
};
