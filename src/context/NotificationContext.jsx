import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 50);

      // Check for new notifications
      const previousCount = notifications.length;
      const newNotifications = notificationData.filter(n =>
        !notifications.some(existing => existing.id === n.id)
      );

      // Show toast for new unread notifications
      newNotifications.forEach(notification => {
        if (!notification.read) {
          showNotificationToast(notification);
        }
      });

      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    });

    return unsubscribe;
  }, [currentUser, notifications]);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification =>
        updateDoc(doc(db, "notifications", notification.id), { read: true })
      );
      await Promise.all(promises);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const showNotificationToast = (notification) => {
    toast(notification.message, {
      icon: '🔔',
      duration: 5000,
    });
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    showNotificationToast
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
