import { useEffect, useMemo, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import React from "react";

import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Messages() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const bottomRef = useRef(null);

  const selected = useMemo(
    () => friends.find((friend) => String(friend._id) === String(selectedId)),
    [friends, selectedId]
  );

  const loadFriends = async () => {
    const { data } = await api.get("/messages/friends");

    setFriends(data.friends);

    updateUnreadMessages(data.friends);
  };

  const updateUnreadMessages = (friendsList) => {
    const unreadCount = friendsList.reduce(
      (total, friend) => total + (friend.unreadCount || 0),
      0
    );

    window.dispatchEvent(
      new CustomEvent("messages-updated", {
        detail: { unreadCount }
      })
    );
  };

  const loadMessages = async (id = selectedId) => {
    if (!id) {
      setMessages([]);
      return;
    }

    const { data } = await api.get(`/messages/${id}`);
    setMessages(data.messages);
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await loadFriends();
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Could not load your friends.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    let active = true;

    const load = async () => {
      try {
        const { data } = await api.get(`/messages/${selectedId}`);
        if (active) setMessages(data.messages);
        await loadFriends();
      } catch {
        // Keep the existing conversation visible during a transient request failure.
      }
    };

    load();
    const timer = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    if (!body.trim() || !selectedId) return;

    try {
      const { data } = await api.post(`/messages/${selectedId}`, { body });
      setMessages((current) => [...current, data.message]);
      setBody("");
    } catch (err) {
      setToast(err.response?.data?.message || "Message could not be sent.");
    }
  };

  if (loading) return <div className="empty-state">Loading messages…</div>;

  return (
    <div className="messages-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">private conversations</span>
          <h1>Messages</h1>
        </div>
        <span className="heading-note">only you + them</span>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      {!friends.length ? (
        <div className="empty-state bordered">
          <span className="empty-emoji">♡</span>
          <h2>Your inbox is quiet.</h2>
          <p>Add a friend from Home and your conversations will appear here.</p>
        </div>
      ) : (
        <div className="messages-layout">
          <aside className="friend-panel">
            <div className="panel-title">friends <span>{friends.length}</span></div>

            <select
              className="friend-select-mobile"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="" disabled>
                Select a friend…
              </option>
              {friends.map((friend) => (
                <option key={friend._id} value={friend._id}>{friend.name}</option>
              ))}
            </select>

            <div className="friend-list">
              {friends.map((friend) => (
                <button
                  key={friend._id}
                  className={`friend-chat-card ${String(friend._id) === String(selectedId) ? "selected" : ""}`}
                  onClick={() => setSelectedId(String(friend._id))}
                >
                  <Avatar src={friend.profilePicture} name={friend.name} size="sm" />
                  <span className="friend-chat-copy">
                    <strong>{friend.name}</strong>
                    <small>friend code {friend.friendCode}</small>
                  </span>
                  {friend.unreadCount > 0 && (
                    <b className="unread-bubble">{friend.unreadCount > 99 ? "99+" : friend.unreadCount}</b>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <section className="chat-panel">
            {selected ? (
              <>
                <div className="chat-head">
                  <Avatar src={selected.profilePicture} name={selected.name} size="sm" />

                  <div>
                    <strong>{selected.name}</strong>
                    <span>private chat</span>
                  </div>

                  <button
                    type="button"
                    className="close-chat-button"
                    onClick={() => {
                      setSelectedId("");
                      setMessages([]);
                      setBody("");
                    }}
                    aria-label="Close chat"
                    title="Close chat"
                  >
                    <X size={19} />
                    <span>Close</span>
                  </button>
                </div>

                <div className="chat-messages">
                  {messages.length ? messages.map((message) => {
                    const mine = String(message.sender) === String(user.id);
                    return (
                      <div key={message._id} className={`message-row ${mine ? "mine" : "theirs"}`}>
                        <div className="message-bubble">
                          <p>{message.body}</p>
                          <time>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </time>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="chat-empty">
                      <span>♡</span>
                      <p>No messages yet. Say hi.</p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <form className="chat-composer" onSubmit={send}>
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={`Message ${selected.name}…`}
                    maxLength={2000}
                  />
                  <button className="send-button" disabled={!body.trim()} aria-label="Send message">
                    <Send size={19} />
                  </button>
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                <span>♡</span>
                <h2>No chat selected</h2>
                <p>Select a friend to start a private conversation.</p>
              </div>
            )}
          </section>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
