const admin = require('./server/node_modules/firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(
    fs.readFileSync('./server/serviceAccount.json', 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Updated products with new prices from src/Data/product.js
const products = [
  { id: "calfstarter", price: 1355, title: "Calf Starter" },
  { id: "calf-growth-booster", price: 1756, title: "Calf Growth Booster" },
  { id: "heiferprimecare", price: 1653, title: "Heifer Prime Care" },
  { id: "ultimatedrycare", price: 1554, title: "Ultimate Dry Care" },
  { id: "transitionwellnesspre-20", price: 2188, title: "Transition Wellness (Pre-20)" },
  { id: "transitionwellnesspost-20", price: 2152, title: "Transition Wellness (Post-20)" },
  { id: "xtramilk", price: 1395, title: "Xtra Milk" },
  { id: "xtramilk8000", price: 1595, title: "Xtra Milk 8000" },
  { id: "xtramilkprime", price: 1895, title: "Xtra Milk Prime" },
  { id: "xtramilkbuff", price: 1695, title: "Xtra Milk Buff" }
];

async function syncPrices() {
    console.log("Syncing updated prices to Firestore...");
    const batch = db.batch();
    
    for (const p of products) {
        const ref = db.collection('products').doc(p.id);
        batch.set(ref, {
            price: p.price,
            title: p.title,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    
    await batch.commit();
    console.log("Price synchronization completed successfully!");
    process.exit(0);
}

syncPrices().catch(console.error);
