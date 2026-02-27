import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; 

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  // Sync cart with Firestore
  useEffect(() => {
    if (!currentUser) {
      setCartItems([]);
      return;
    }

    const cartRef = collection(db, "carts", currentUser.uid, "items");
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCartItems(items); // Note: id string vs number might be an issue if product.id is number elsewhere
    });

    return unsubscribe;
  }, [currentUser]);

  const addToCart = async (product) => {
    if (!currentUser) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return false;
    }

    if (userRole === 'admin') {
      toast.error("Admins cannot add items to cart.");
      return false;
    }

    try {
      // Ensure ID is string for Firestore doc key
      const productId = String(product.id);
      const itemRef = doc(db, "carts", currentUser.uid, "items", productId);
      const itemSnap = await getDoc(itemRef);

      if (itemSnap.exists()) {
        await updateDoc(itemRef, {
          qty: itemSnap.data().qty + 1
        });
      } else {
        await setDoc(itemRef, {
          ...product,
          qty: 1
        });
      }
      toast.success("Added to cart");
      return true;
      
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
      return false;
    }
  };

  const removeFromCart = async (id) => {
    if (!currentUser) return;
    try {
      const itemRef = doc(db, "carts", currentUser.uid, "items", String(id));
      await deleteDoc(itemRef);
      toast.success("Removed from cart");
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const updateQty = async (id, qty) => {
    if (!currentUser) return;
    try {
      const newQty = Math.max(1, qty);
      const itemRef = doc(db, "carts", currentUser.uid, "items", String(id));
      await updateDoc(itemRef, { qty: newQty });
    } catch (error) {
       console.error("Error updating quantity:", error);
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;
    try {
      const cartRef = collection(db, "carts", currentUser.uid, "items");
      const snapshot = await getDoc(doc(db, "carts", currentUser.uid)); // Check parent doc? No.
      // Need to fetch all docs in subcollection to delete them
      // We already have cartItems from state!
      const deletePromises = cartItems.map(item => 
        deleteDoc(doc(db, "carts", currentUser.uid, "items", String(item.id)))
      );
      await Promise.all(deletePromises);
      toast.success("Cart cleared");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
