import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

// Collection Reference
const reviewsRef = collection(db, 'reviews');

/**
 * Review Document Schema:
 * {
 *   productId: string,
 *   userId: string,
 *   userName: string,
 *   rating: number (1-5),
 *   comment: string,
 *   orderId: string,
 *   createdAt: timestamp,
 *   status: 'pending' | 'approved' | 'rejected' (default 'approved' for now)
 * }
 */

export const addReview = async (reviewData) => {
  return await addDoc(reviewsRef, {
    ...reviewData,
    status: 'approved', // Auto-approve for now
    createdAt: serverTimestamp()
  });
};

export const getProductReviews = async (productId) => {
  // Simplify query to avoid requiring complex composite indexes
  const q = query(
    reviewsRef,
    where('productId', '==', productId),
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Sort in JS instead of Firestore to avoid index requirement
  return reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getUserReviews = async (userId) => {
  const q = query(
    reviewsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getLatestReviews = async (count = 6) => {
  // Fetch approved reviews, sort and limit in JS
  const q = query(
    reviewsRef,
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return reviews
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, count);
};

export const getTopRatedReviews = async (minRating = 4) => {
  // Fetch approved reviews, filter and sort in JS
  const q = query(
    reviewsRef,
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  return reviews
    .filter(r => r.rating >= minRating)
    .sort((a, b) => {
        // Sort by rating primarily, then by date
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
};

export const checkUserReviewed = async (userId, productId) => {
  const q = query(
    reviewsRef,
    where('userId', '==', userId),
    where('productId', '==', productId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
