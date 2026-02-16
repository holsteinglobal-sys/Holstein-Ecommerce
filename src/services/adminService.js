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
  orderBy
} from 'firebase/firestore';

// Slug Generator Utility
export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
};

// Products CRUD operations
export const getProducts = async () => {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data(),
    isVisible: doc.data().isVisible !== false // Default to true if not set
  }));
};

export const addProduct = async (product) => {
  const productsRef = collection(db, 'products');
  return await addDoc(productsRef, product);
};

export const updateProduct = async (id, product) => {
  const productRef = doc(db, 'products', id);
  return await updateDoc(productRef, product);
};

export const deleteProduct = async (id) => {
  const productRef = doc(db, 'products', id);
  return await deleteDoc(productRef);
};

export const toggleProductVisibility = async (id, currentVisibility) => {
  const productRef = doc(db, 'products', id);
  return await updateDoc(productRef, { isVisible: !currentVisibility });
};

// Blogs CRUD operations
export const getBlogs = async () => {
  const blogsRef = collection(db, 'blogs');
  const snapshot = await getDocs(blogsRef);
  const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort client-side to avoid index requirement
  return blogs.sort((a, b) => (new Date(b.date) - new Date(a.date)));
};

export const addBlog = async (blog) => {
  const blogsRef = collection(db, 'blogs');
  return await addDoc(blogsRef, blog);
};

export const updateBlog = async (id, blog) => {
  const blogRef = doc(db, 'blogs', id);
  return await updateDoc(blogRef, blog);
};

export const deleteBlog = async (id) => {
  const blogRef = doc(db, 'blogs', id);
  return await deleteDoc(blogRef);
};
// Category Management
export const getCategories = async () => {
  const categoriesRef = collection(db, 'categories');
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveCategory = async (id, categoryData) => {
  if (id) {
    const categoryRef = doc(db, 'categories', id);
    return await updateDoc(categoryRef, categoryData);
  } else {
    const categoriesRef = collection(db, 'categories');
    return await addDoc(categoriesRef, categoryData);
  }
};

export const deleteCategory = async (id) => {
  const categoryRef = doc(db, 'categories', id);
  return await deleteDoc(categoryRef);
};

// Review Management
export const getAllReviews = async () => {
  const reviewsRef = collection(db, 'reviews');
  const snapshot = await getDocs(reviewsRef);
  const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort client-side to avoid index requirement
  return reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const updateReviewStatus = async (reviewId, status) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  return await updateDoc(reviewRef, { status });
};

export const updateReviewData = async (reviewId, reviewData) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  return await updateDoc(reviewRef, reviewData);
};

export const deleteReview = async (reviewId) => {
  const reviewRef = doc(db, 'reviews', reviewId);
  return await deleteDoc(reviewRef);
};
