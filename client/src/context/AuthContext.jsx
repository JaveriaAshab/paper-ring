import { createContext, useContext, useEffect, useState } from "react";
import api from "../api.js";
import React from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored =
      localStorage.getItem("paperring_user") ||
      sessionStorage.getItem("paperring_user");

    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("paperring_token") ||
      sessionStorage.getItem("paperring_token");

    if (!token) {
      setLoading(false);
      return;
    }

    // Immediately attach token header for initial app mount
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);

        const storage = localStorage.getItem("paperring_token")
          ? localStorage
          : sessionStorage;

        storage.setItem(
          "paperring_user",
          JSON.stringify(data.user)
        );
      })
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (data, rememberMe = false) => {
    // Clear existing storage
    localStorage.removeItem("paperring_token");
    localStorage.removeItem("paperring_user");
    sessionStorage.removeItem("paperring_token");
    sessionStorage.removeItem("paperring_user");

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("paperring_token", data.token);
    storage.setItem("paperring_user", JSON.stringify(data.user));

    // Instantly attach header to axios instance
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("paperring_token");
    localStorage.removeItem("paperring_user");
    sessionStorage.removeItem("paperring_token");
    sessionStorage.removeItem("paperring_user");

    delete api.defaults.headers.common["Authorization"];

    setUser(null);
  };

  const updateUser = (nextUser) => {
    const storage = localStorage.getItem("paperring_token")
      ? localStorage
      : sessionStorage;

    storage.setItem("paperring_user", JSON.stringify(nextUser));

    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
