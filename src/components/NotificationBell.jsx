import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";

function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [notificationsRes, countRes] = await Promise.all([
        notificationAPI.getNotifications(),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(notificationsRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Mark notification as seen
  const handleMarkAsSeen = async (notificationId) => {
    try {
      await notificationAPI.markAsSeen(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isSeen: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as seen:", err);
    }
  };

  // Mark all as seen
  const handleMarkAllAsSeen = async () => {
    try {
      await notificationAPI.markAllAsSeen();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isSeen: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as seen:", err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isSeen) {
      handleMarkAsSeen(notification._id);
    }
    if (notification.companyId) {
      navigate(`/companies/${notification.companyId}`);
      setShowDropdown(false);
    }
  };

  // Toggle dropdown and mark all as seen when opening
  const handleBellClick = () => {
    if (!showDropdown && unreadCount > 0) {
      handleMarkAllAsSeen();
    }
    setShowDropdown(!showDropdown);
  };

  // Delete a single notification
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering the notification click
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));
      // Update unread count if the deleted notification was unread
      const deletedNotif = notifications.find((n) => n._id === notificationId);
      if (deletedNotif && !deletedNotif.isSeen) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Clear all notifications
  const handleClearAll = async (e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to clear all notifications?")) {
      try {
        await notificationAPI.clearAllNotifications();
        setNotifications([]);
        setUnreadCount(0);
      } catch (err) {
        console.error("Error clearing notifications:", err);
      }
    }
  };

  // Don't show if user is not logged in
  if (!user) {
    return null;
  }

  const unreadNotifications = notifications.filter((n) => !n.isSeen);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
        title="Notifications"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-gray-300 hover:text-white underline flex items-center gap-1"
                  title="Clear all notifications"
                >
                  <FaTrash className="w-3 h-3" />
                  Clear all
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsSeen}
                  className="text-sm text-gray-300 hover:text-white underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    !notification.isSeen ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.isSeen ? "bg-blue-600" : "bg-transparent"
                      }`}
                    />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className="font-semibold text-gray-900 text-sm">
                        {notification.title}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNotification(notification._id, e)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete notification"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

