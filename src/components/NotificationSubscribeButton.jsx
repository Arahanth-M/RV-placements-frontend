import React, { useEffect, useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { notificationAPI } from "../utils/api";
import { useAuth } from "../utils/AuthContext";

const CHIP_BASE =
  "inline-flex box-border h-11 min-h-11 max-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold leading-none transition-colors disabled:opacity-60";

const MENU_ITEM =
  "flex w-full items-center gap-3 border-b border-theme px-4 py-3.5 text-left text-base font-semibold transition-colors disabled:opacity-60";

/**
 * Opt-in for email updates. In-app bell notifications go to everyone regardless.
 * @param {{ variant?: "chip" | "menu" }} props
 */
function NotificationSubscribeButton({ variant = "chip" }) {
  const { user, isAdmin } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || isAdmin) {
      setSubscribed(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    notificationAPI
      .getSubscriptionStatus()
      .then((res) => {
        if (!cancelled) setSubscribed(res.data?.subscribed === true);
      })
      .catch(() => {
        if (!cancelled) setSubscribed(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  if (!user || isAdmin) return null;

  const handleToggle = async () => {
    if (submitting || loading) return;
    setSubmitting(true);
    try {
      if (subscribed) {
        await notificationAPI.unsubscribe();
        setSubscribed(false);
      } else {
        await notificationAPI.subscribe();
        setSubscribed(true);
      }
    } catch (err) {
      console.error("Failed to update email subscription:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const label = submitting
    ? "…"
    : subscribed
      ? "Email updates on"
      : "Subscribe to email updates";

  if (variant === "menu") {
    return (
      <button
        type="button"
        data-tour="header-notification-subscribe"
        onClick={handleToggle}
        disabled={loading || submitting}
        aria-pressed={subscribed}
        className={`${MENU_ITEM} ${
          subscribed
            ? "bg-theme-accent/10 text-theme-accent"
            : "text-theme-primary hover:bg-theme-hero"
        }`}
      >
        <FaEnvelope className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="flex-1">{label}</span>
        <span className="text-xs font-medium text-theme-muted">
          {subscribed ? "On" : "Off"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-tour="header-notification-subscribe"
      onClick={handleToggle}
      disabled={loading || submitting}
      aria-pressed={subscribed}
      title={
        subscribed
          ? "Unsubscribe from email updates (in-app notifications continue)"
          : "Subscribe to receive email updates about companies"
      }
      aria-label={
        subscribed
          ? "Unsubscribe from email updates"
          : "Subscribe to email updates"
      }
      className={`${CHIP_BASE} ${
        subscribed
          ? "border-theme-accent bg-theme-accent text-white"
          : "border-theme bg-theme-card text-theme-primary hover:bg-theme-hero"
      }`}
    >
      <span>{subscribed ? "Subscribed" : "Subscribe"}</span>
    </button>
  );
}

export default NotificationSubscribeButton;
