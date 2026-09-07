import { useState } from "react";
import { Link } from "react-router-dom";
import React from "react";

import api from "../api.js";
import AuthShell from "./AuthShell.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);

    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: email.trim()
      });

      setMessage(data.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not process your request."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="need a little help?"
      title="Let's get you back in."
      footer={
        <>
          Remembered your password? <Link to="/login">Log in →</Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <p className="auth-helper">
          Enter the email connected to your Paper Ring account and we'll
          send you a password reset link.
        </p>

        {error && <p className="form-error">{error}</p>}

        {message && <p className="form-success">{message}</p>}

        <button
          className="button button-primary full"
          disabled={busy}
        >
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}