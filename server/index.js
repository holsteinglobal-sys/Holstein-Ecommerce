import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRazorpayOrder, verifyPayment, refundPayment } from './razorpayController.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/payments/create-order', createRazorpayOrder);
app.post('/api/payments/verify', verifyPayment);
app.post('/api/payments/refund', refundPayment);

// Debug Route for Production Environment
app.get('/api/debug-env', (req, res) => {
  try {
    const debugInfo = {
      __dirname,
      processCwd: process.cwd(),
      distPath,
      distExists: fs.existsSync(distPath),
      distContents: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [],
      env: process.env.NODE_ENV,
      port: PORT
    };
    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve Static Files from the React app dist folder
console.log(`Serving static files from: ${distPath}`);

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Catch-all route for SPA
app.get('*', (req, res) => {
  // Check if the request looks like a file request (has an extension)
  // If it does and we are here, the file was not found by express.static
  if (req.path.includes('.')) {
    console.log(`Asset not found: ${req.path}`);
    return res.status(404).send('Not Found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
