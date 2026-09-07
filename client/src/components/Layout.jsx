import { useEffect, useState } from "react";
import { Bell, House, LogOut, MessageCircle, Menu, UserRound, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import React from "react";

import { useAuth } from "../context/AuthContext.jsx";
import api from "../api.js";
import Avatar from "./Avatar.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data } = await api.get("/notifications");
        if (active) setUnreadNotifications(data.unreadCount);
      } catch {
        // The page itself will surface auth/API errors where needed.
      }
    };

    const handleNotificationsUpdated = (event) => {
      if (typeof event.detail?.unreadCount === "number") {
        setUnreadNotifications(event.detail.unreadCount);
      } else {
        load();
      }
    };

    load();
    const timer = setInterval(load, 15000);

    window.addEventListener(
      "notifications-updated",
      handleNotificationsUpdated
    );

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated
      );
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadUnreadMessages = async () => {
      try {
        const { data } = await api.get("/messages/friends");

        const totalUnread = data.friends.reduce(
          (total, friend) => total + (friend.unreadCount || 0),
          0
        );

        if (active) {
          setUnreadMessages(totalUnread);
        }
      } catch {
        // Messages page will handle its own API errors.
      }
    };

    const handleMessagesUpdated = (event) => {
      if (typeof event.detail?.unreadCount === "number") {
        setUnreadMessages(event.detail.unreadCount);
      } else {
        loadUnreadMessages();
      }
    };

    loadUnreadMessages();

    const timer = setInterval(loadUnreadMessages, 15000);

    window.addEventListener(
      "messages-updated",
      handleMessagesUpdated
    );

    return () => {
      active = false;
      clearInterval(timer);

      window.removeEventListener(
        "messages-updated",
        handleMessagesUpdated
      );
    };
  }, []);

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const signOut = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/", label: "Home", icon: House },
    { to: "/messages", label: "Messages", icon: MessageCircle, badge: unreadMessages },
    { to: "/notifications", label: "Notifications", icon: Bell, badge: unreadNotifications },
    { to: "/profile", label: "My profile", icon: UserRound }
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => go("/")}>
          <span className="brand-stamp">PR</span>
          <span>paper ring</span>
        </button>

        <nav className={`main-nav ${menuOpen ? "nav-open" : ""}`}>
          {links.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge > 0 && <b className="nav-badge">{badge > 99 ? "99+" : badge}</b>}
            </NavLink>
          ))}
          <button className="nav-link nav-button" onClick={() => go("/support")}>
            <span>?</span>
            <span>Support</span>
          </button>
        </nav>

        <div className="topbar-user">
          <button className="mini-user" onClick={() => go("/profile")}>
            <Avatar src={user.profilePicture} name={user.name} size="sm" />
            <span>{user.name}</span>
          </button>
          <button className="logout-button" onClick={signOut} title="Log out">
            <LogOut size={18} />
          </button>
        </div>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main className="page-container">{children}</main>

      <footer className="site-footer">
        <span>paper ring © {new Date().getFullYear()}</span>
        <button onClick={() => go("/support")}>about / support</button>
      </footer>
    </div>
  );
}
