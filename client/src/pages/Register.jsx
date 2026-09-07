import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import React from "react";

import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "./AuthShell.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rememberMe: false
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const rememberMeRef = useRef(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

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
              "Google registration could not be completed."
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

    if (!passwordRegex.test(form.password)) {
      setError(
        "Password must be 8–72 characters and contain at least one letter and one number."
      );
      setBusy(false);
      return;
    }

    try {
      const { data } = await api.post("/auth/register", form);
      login(data, rememberMeRef.current);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="your private corner"
      title="Let's make your circle."
      footer={
        <>
          Already have an account? <Link to="/login">Log in →</Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={submit}>
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="What should your friends call you?"
            minLength={2}
            maxLength={40}
            required
          />
        </label>
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
            placeholder="At least 8 characters"
            minLength={8}
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
                  width: "100%",
                  text: "continue_with",
                  shape: "rectangular"
                });
              }
            }}
          />
        )}
        <button className="button button-primary full" disabled={busy}>
          {busy ? "Making your space…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
