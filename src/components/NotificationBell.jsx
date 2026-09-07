import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { tenantPath } from "../constants/tenant.js";
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
    let eventSource = null;
    let reconnectTimer = null;
    let disposed = false;
    let retryMs = 3000;

    const connect = () => {
      if (disposed) return;
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onopen = () => {
        retryMs = 3000;
      };

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

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (disposed) return;
        reconnectTimer = setTimeout(() => {
          retryMs = Math.min(retryMs * 2, 60_000);
          connect();
        }, retryMs);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
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
      navigate(tenantPath(`/companies/${notification.companyId}`));
      setShowDropdown(false);
      return;
    }
    const eventId = notification.payload?.eventId;
    if (notification.type === "EVENT_CREATED" || eventId) {
      navigate(tenantPath("/events"));
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

  // Don't show if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative inline-flex box-border h-10 w-10 min-h-10 max-h-10 shrink-0 items-center justify-center rounded-xl border border-theme bg-theme-card text-theme-primary transition-colors hover:bg-theme-hero focus:outline-none"
        title="Notifications"
      >
        <FaBell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-theme-app">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="fixed left-3 right-3 top-[4.25rem] z-50 max-h-[min(62vh,26rem)] overflow-hidden rounded-xl border border-theme bg-theme-card shadow-2xl backdrop-blur-md transition-all duration-200 ease-out sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 sm:max-h-[32rem] sm:origin-top-right flex flex-col">
          <div className="bg-theme-card border-b border-theme px-3 py-2.5 sm:px-4 sm:py-3 flex justify-between items-start sm:items-center gap-2 bg-opacity-50">
            <h3 className="font-bold text-base sm:text-lg text-theme-accent">Notifications</h3>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={handleRefresh}
                className="text-sm text-theme-secondary hover:text-theme-primary transition-all duration-300 hover:rotate-180 p-1 rounded-full hover:bg-theme-card-hover"
                title="Refresh notifications"
              >
                <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsSeen}
                  className="text-[11px] sm:text-xs text-theme-accent hover:text-theme-accent-hover font-medium underline-offset-2 hover:underline"
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
                {notifications.map((notification) => {
                  const isCompanyApproved = notification.type === "COMPANY_APPROVED";
                  const isCompanyUpdated = notification.type === "COMPANY_UPDATED";
                  const companyNameOnly = (() => {
                    const raw = notification.payload?.companyName;
                    if (typeof raw === "string" && raw.trim()) return raw.trim();
                    const t = String(notification.title || "").trim();
                    return t.replace(/\s+(approved|updated)\s*$/i, "").trim() || t;
                  })();
                  return (
                  <div
                    key={notification._id}
                    className={`px-3 sm:px-4 py-3.5 sm:py-4 hover:bg-theme-card-hover transition-colors cursor-pointer group ${
                      !notification.isSeen ? "bg-theme-hero/35 border-l-2 border-theme-accent" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 transition-all duration-300 ${
                          !notification.isSeen ? "bg-theme-accent" : "bg-transparent"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          {isCompanyApproved || isCompanyUpdated ? (
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-[15px] sm:text-base font-bold leading-snug tracking-tight ${
                                  !notification.isSeen
                                    ? "text-theme-primary"
                                    : "text-theme-secondary"
                                }`}
                              >
                                {companyNameOnly}
                              </p>
                              <p
                                className={`mt-1.5 text-[13px] sm:text-sm leading-relaxed ${
                                  !notification.isSeen
                                    ? "text-theme-secondary"
                                    : "text-theme-muted"
                                }`}
                              >
                                {isCompanyUpdated
                                  ? notification.message ||
                                    notification.body ||
                                    "New updates were added — tap to open the company page."
                                  : "It is approved. A new company has been added — please check it out."}
                              </p>
                            </div>
                          ) : (
                            <p
                              className={`font-semibold text-[13px] sm:text-sm leading-tight transition-colors ${
                                !notification.isSeen ? "text-theme-primary" : "text-theme-secondary"
                              }`}
                            >
                              {notification.title}
                            </p>
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(notification._id, e)}
                            className="flex-shrink-0 text-theme-muted hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                            title="Delete notification"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </div>
                        {!isCompanyApproved && !isCompanyUpdated && (
                          <>
                            <p className="text-theme-secondary text-[13px] sm:text-sm mt-1 leading-relaxed">
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
                          </>
                        )}
                        {(isCompanyApproved || isCompanyUpdated) && (
                          <p className="text-[10px] text-theme-muted mt-2 font-medium uppercase tracking-wider">
                            {new Date(notification.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  );
}

export default NotificationBell;

