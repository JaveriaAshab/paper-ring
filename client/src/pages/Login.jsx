import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import React from "react";

import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "./AuthShell.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const rememberMeRef = useRef(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setBusy(true);
          setError("");

          try {
            const { data } = await api.post("/auth/google", {
              credential: response.credential,
              rememberMe: rememberMeRef.current
            });

            login(data, rememberMeRef.current);
            navigate("/");
          } catch (err) {
            setError(
              err.response?.data?.message ||
              "Google login could not be completed."
            );
          } finally {
            setBusy(false);
          }
        }
      });

      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        initializeGoogle();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [login, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      setBusy(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/login", form);
      login(data, rememberMeRef.current);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not log you in. Please, try again later.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="welcome back"
      title="Come on in."
      footer={
        <>
          New here? <Link to="/register">Make an account →</Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.rememberMe}
            onChange={(e) => {
              const checked = e.target.checked;

              rememberMeRef.current = checked;

              setForm({
                ...form,
                rememberMe: checked
              });
            }}
          />
          <span>Remember me</span>
        </label>
        <Link className="auth-link" to="/forgot-password">
          Forgot your password?
        </Link>
        {error && <p className="form-error">{error}</p>}
        {googleReady && (
          <div
            ref={(element) => {
              if (
                element &&
                window.google?.accounts?.id &&
                !element.hasChildNodes()
              ) {
                window.google.accounts.id.renderButton(element, {
                  theme: "outline",
                  size: "large",
                  width: 280,
                  text: "continue_with",
                  shape: "rectangular"
                });
              }
            }}
          />
        )}
        <button className="button button-primary full" disabled={busy}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
