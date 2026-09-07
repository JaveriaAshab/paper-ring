import { useEffect, useState, useMemo } from "react";
import { Bell, CheckCheck, MessageCircle, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React from "react";

import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import Toast from "../components/Toast.jsx";

const icons = {
  friend_added: UserPlus,
  paper_ring: Bell,
  message: MessageCircle
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
    } catch (err) {
      setToast(err.response?.data?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const updateUnreadCount = (items) => {
    const unreadCount = items.filter((item) => !item.readAt).length;

    window.dispatchEvent(
      new CustomEvent("notifications-updated", {
        detail: { unreadCount }
      })
    );
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) => {
        const updated = current.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString()
        }));

        updateUnreadCount(updated);

        return updated;
      });
    } catch {
      setToast("Could not mark notifications as read.");
    }
  };

  const threadedNotifications = useMemo(() => {
    const threads = [];

    notifications.forEach((notification) => {
      // Non-message notifications always stay as individual cards.
      if (notification.type !== "message") {
        threads.push({
          id: notification._id,
          type: notification.type,
          items: [notification]
        });

        return;
      }

      const actorId = String(notification.actor?._id || "");

      /*
        Only group MESSAGE notifications that are part of the
        same unread batch.
  
        Once a notification has been read, it starts/ends a batch.
        Therefore:
  
          unread A
          unread A
          unread A
  
        becomes one thread.
  
        But:
  
          read A
          read A
          unread A
          unread A
  
        becomes two separate threads.
      */

      const lastThread = threads[threads.length - 1];

      const canJoinLastThread =
        lastThread &&
        lastThread.type === "message" &&
        lastThread.actorId === actorId &&
        !lastThread.items[lastThread.items.length - 1].readAt &&
        !notification.readAt;

      if (canJoinLastThread) {
        lastThread.items.push(notification);
      } else {
        threads.push({
          id: `message-${notification._id}`,
          type: "message",
          actorId,
          items: [notification]
        });
      }
    });

    return threads;
  }, [notifications]);

  const openNotification = async (thread) => {
    const unreadItems = thread.items.filter(
      (item) => !item.readAt
    );

    /*
      Only mark notifications as read when this particular
      thread actually contains unread notifications.
    */
    if (unreadItems.length) {
      try {
        await Promise.all(
          unreadItems.map((item) =>
            api.patch(`/notifications/${item._id}/read`)
          )
        );
      } catch {
        // Keep the UI responsive even if marking as read fails.
      }
    }

    /*
      Update only the notifications belonging to THIS thread.
  
      Previously-read notifications remain untouched.
      This is what preserves separate WhatsApp-style batches.
    */
    if (unreadItems.length) {
      setNotifications((current) => {
        const unreadIds = new Set(
          unreadItems.map((item) => item._id)
        );

        const updated = current.map((item) =>
          unreadIds.has(item._id)
            ? {
              ...item,
              readAt: new Date().toISOString()
            }
            : item
        );

        updateUnreadCount(updated);

        return updated;
      });
    }

    const notification = thread.items[0];

    if (thread.type === "message") {
      navigate("/messages");
      return;
    }

    if (
      notification.type === "paper_ring" &&
      notification.actor?._id
    ) {
      navigate("/profile");
      return;
    }

    if (
      notification.type === "friend_added" &&
      notification.actor?._id
    ) {
      navigate(`/profile/${notification.actor._id}`);
    }
  };

  return (
    <div className="notifications-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">keep in the loop</span>
          <h1>Notifications</h1>
        </div>
        <button className="button" onClick={markAll}>
          <CheckCheck size={17} /> Mark all read
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading notifications…</div>
      ) : notifications.length ? (
        <div className="notification-list">
          {threadedNotifications.map((thread) => {
            const notification = thread.items[0];
            const Icon = icons[thread.type] || Bell;

            const unreadItems = thread.items.filter(
              (item) => !item.readAt
            );

            const unreadCount = unreadItems.length;
            const messageCount = thread.items.length;

            const isUnread = unreadCount > 0;
            const isMessageThread = thread.type === "message";
            return (
              <button
                key={thread.id}
                className={`notification-card ${isUnread ? "unread" : ""}`}
                onClick={() => openNotification(thread)}
              >
                <div className="notification-icon"><Icon size={19} /></div>
                <Avatar
                  src={notification.actor?.profilePicture}
                  name={notification.actor?.name || "Paper Ring"}
                  size="sm"
                />
                <div className="notification-copy">
                  <strong>
                    {isMessageThread
                      ? messageCount === 1
                        ? notification.text
                        : `${notification.actor?.name || "Someone"} sent you ${messageCount} messages`
                      : notification.text}
                  </strong>

                  {/* {isMessageThread && messageCount > 1 && (
                    <span className="notification-count">
                      {unreadCount} unread
                    </span>
                  )} */}
                  <time>{new Date(notification.createdAt).toLocaleString()}</time>
                </div>
                {isUnread && <span className="unread-dot" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="empty-state bordered">
          <span className="empty-emoji">✦</span>
          <h2>All caught up.</h2>
          <p>New friend additions, Paper Rings and messages will show up here.</p>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
