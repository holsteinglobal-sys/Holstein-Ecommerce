const { db } = require('./src/lib/firebase');
const { collection, addDoc, getDocs, deleteDoc, doc } = require('firebase/firestore');
const { products } = require('./src/Data/product');

async function migrateProducts() {
  console.log('Starting migration...');
  const productsRef = collection(db, 'products');

  // Optional: Clear existing products first (use with caution)
  // const snapshot = await getDocs(productsRef);
  // for (const docSnap of snapshot.docs) {
  //   await deleteDoc(doc(db, 'products', docSnap.id));
  // }

  for (const product of products) {
    try {
      const { id, ...productData } = product; // Remove original ID, let Firestore generate one
      await addDoc(productsRef, {
        ...productData,
        isVisible: true, // Default to visible
        createdAt: new Date().toISOString()
      });
      console.log(`Migrated: ${product.title}`);
    } catch (error) {
      console.error(`Failed to migrate ${product.title}:`, error);
    }
  }
  console.log('Migration finished.');
}

migrateProducts();
