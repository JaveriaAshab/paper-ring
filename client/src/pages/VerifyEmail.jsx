import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import React from "react";

import api from "../api.js";
import AuthShell from "./AuthShell.jsx";

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setBusy(false);
      setError("No verification token was provided.");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get(
          `/auth/verify-email/${token}`
        );

        setMessage(data.message);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Could not verify your email."
        );
      } finally {
        setBusy(false);
      }
    };

    verify();
  }, [token]);

  const resend = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setResending(true);

    try {
      const { data } = await api.post(
        "/auth/resend-verification",
        {
          email: email.trim()
        }
      );

      setMessage(data.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not resend the verification email."
      );
    } finally {
      setResending(false);
    }
  };

  if (busy) {
    return (
      <AuthShell
        eyebrow="one little thing"
        title="Checking your email."
        footer={
          <>
            <Link to="/login">Back to login →</Link>
          </>
        }
      >
        <p className="auth-helper">
          We're verifying your Paper Ring email address…
        </p>
      </AuthShell>
    );
  }

  if (message && !error) {
    return (
      <AuthShell
        eyebrow="you're all set"
        title="Email verified."
        footer={
          <>
            Ready? <Link to="/login">Log in →</Link>
          </>
        }
      >
        <p className="form-success">{message}</p>

        <p className="auth-helper">
          Your Paper Ring account is ready to use.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="almost there"
      title="Let's try that again."
      footer={
        <>
          <Link to="/login">Back to login →</Link>
        </>
      }
    >
      {error && <p className="form-error">{error}</p>}

      <form className="form-stack" onSubmit={resend}>
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
          If your verification link expired, enter your email and
          we'll send you a fresh one.
        </p>

        <button
          className="button button-primary full"
          disabled={resending}
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      </form>
    </AuthShell>
  );
}