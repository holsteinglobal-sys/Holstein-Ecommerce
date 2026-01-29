import Razorpay from 'razorpay';
import crypto from 'crypto';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccount.json', 'utf8')
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, walletAmountUsed, shippingCharge, userId } = req.body;

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
        return res.status(400).json({ message: `Product with ID ${item.id} not found in our database.` });
      }
      const productData = productDoc.data();
      calculatedSubtotal += (productData.price * item.qty);
    }

    // 2. Verify Wallet Balance
    let verifiedWalletUsage = 0;
    if (walletAmountUsed > 0 && userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userWalletBalance = userDoc.data().walletBalance || 0;
        verifiedWalletUsage = Math.min(walletAmountUsed, userWalletBalance, calculatedSubtotal);
      }
    }

    // 3. Calculate Final Total
    const totalAmount = calculatedSubtotal + (shippingCharge || 0) - verifiedWalletUsage;

    // Razorpay expects amount in paise
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      ...order,
      verifiedTotal: totalAmount,
      verifiedWalletUsage: verifiedWalletUsage
    });
  } catch (error) {
    console.error("RAZORPAY ERROR:", error);
    res.status(500).json({ 
      message: "Failed to create Razorpay order",
      error: error.message 
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
