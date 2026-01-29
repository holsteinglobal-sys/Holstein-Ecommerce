import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createRazorpayOrder, verifyPayment, refundPayment } from './razorpayController.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/payments/create-order', createRazorpayOrder);
app.post('/api/payments/verify', verifyPayment);
app.post('/api/payments/refund', refundPayment);
app.get('/', (req, res) => {
  res.send('Razorpay Payment Server is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
