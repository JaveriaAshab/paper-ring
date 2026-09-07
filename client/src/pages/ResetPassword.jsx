import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import React from "react";

import api from "../api.js";
import AuthShell from "./AuthShell.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

    if (!passwordRegex.test(form.password)) {
      setError(
        "Password must be 8–72 characters and contain at least one letter and one number."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { data } = await api.post(
        `/auth/reset-password/${token}`,
        {
          password: form.password
        }
      );

      setMessage(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not reset your password."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="new password"
      title="Make it a fresh one."
      footer={
        <>
          Remembered it? <Link to="/login">Back to login →</Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={submit}>
        <label>
          New password
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            placeholder="At least 8 characters"
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({
                ...form,
                confirmPassword: e.target.value
              })
            }
            placeholder="Type it again"
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        {message && <p className="form-success">{message}</p>}

        <button
          className="button button-primary full"
          disabled={busy}
        >
          {busy ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </AuthShell>
  );
}