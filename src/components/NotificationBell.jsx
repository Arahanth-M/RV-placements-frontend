import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaTrash, FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../utils/api";
import { BASE_URL } from "../utils/constants";
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
  const fetchNotifications = async (silent = false) => {
    if (!user) return;
    if (user?.betaAccess === false) return;

    try {
      if (!silent) {
        setLoading(true);
      }
      const [notificationsRes, countRes] = await Promise.all([
        notificationAPI.getNotifications(),
        notificationAPI.getUnreadCount(),
      ]);
      const listPayload = notificationsRes.data;
      const list = Array.isArray(listPayload)
        ? listPayload
        : listPayload?.notifications ?? [];
      setNotifications(list);
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Manual refresh handler
  const handleRefresh = async (e) => {
    e.stopPropagation();
    await fetchNotifications(false);
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const pollIntervalMs = 60000; // Poll every 60 seconds (was 3s)
    let intervalId = null;

    const runFetch = (silent = true) => {
      fetchNotifications(silent);
    };

    runFetch(false); // Initial fetch with loading state

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(() => runFetch(true), pollIntervalMs);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Only poll when tab is visible; stop when user switches tab or minimizes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runFetch(true);
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (user?.betaAccess === false) return;

    const streamUrl = `${BASE_URL}/api/notifications/stream`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "NEW_NOTIFICATION" && data.notification) {
          setNotifications((prev) => [data.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("SSE notification parse error:", err);
      }
    };

    return () => {
      eventSource.close();
    };
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
        className="relative p-2.5 rounded-full border border-theme bg-theme-card text-theme-secondary hover:text-theme-primary hover:bg-theme-card-hover transition-colors focus:outline-none"
        title="Notifications"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-theme-app">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-theme-card backdrop-blur-md rounded-xl shadow-2xl border border-theme z-50 max-h-[32rem] overflow-hidden flex flex-col transition-all duration-200 ease-out transform origin-top-right">
          <div className="bg-theme-card border-b border-theme px-4 py-3 flex justify-between items-center bg-opacity-50">
            <h3 className="font-bold text-lg text-theme-accent">Notifications</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="text-sm text-theme-secondary hover:text-theme-primary transition-all duration-300 hover:rotate-180 p-1 rounded-full hover:bg-theme-card-hover"
                title="Refresh notifications"
              >
                <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-theme-secondary hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
                  title="Clear all notifications"
                >
                  <FaTrash className="w-3 h-3" />
                  Clear all
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsSeen}
                  className="text-xs text-theme-accent hover:text-theme-accent-hover font-medium underline-offset-2 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center text-theme-muted">
                <FaSync className="w-8 h-8 animate-spin mb-2 opacity-20" />
                <p className="text-sm font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-theme-muted">
                <FaBell className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y divide-theme">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-4 hover:bg-theme-card-hover transition-colors cursor-pointer group ${
                      !notification.isSeen ? "bg-theme-accent bg-opacity-[0.03] border-l-2 border-theme-accent" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 transition-all duration-300 ${
                          !notification.isSeen ? "bg-theme-accent scale-110 shadow-[0_0_8px_rgba(50,205,50,0.5)]" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`font-semibold text-sm leading-tight transition-colors ${
                            !notification.isSeen ? "text-theme-primary" : "text-theme-secondary"
                          }`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => handleDeleteNotification(notification._id, e)}
                            className="flex-shrink-0 text-theme-muted hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                            title="Delete notification"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-theme-secondary text-sm mt-1 leading-relaxed">
                          {notification.message ||
                            notification.body ||
                            (notification.payload?.companyName
                              ? `${notification.payload.companyName} is now available`
                              : "")}
                        </p>
                        <p className="text-[10px] text-theme-muted mt-2 font-medium uppercase tracking-wider">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  );
}

export default NotificationBell;

