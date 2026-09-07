import { useState } from "react";
import { FolderKanban, MessageSquareText } from "lucide-react";
import React from "react";

import api from "../api.js";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Support() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user.name, email: user.email, message: "" });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);

    try {
      const { data } = await api.post("/support/feedback", form);
      setToast(data.message);
      setForm((current) => ({ ...current, message: "" }));
    } catch (err) {
      setToast(err.response?.data?.message || "Could not send feedback.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="support-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">need a hand?</span>
          <h1>Support</h1>
        </div>
      </div>

      <div className="support-grid">
        <section className="about-card">
          <span className="sticker">ABOUT US</span>
          <h2>A tiny social network with the door locked.</h2>
          <p>
            Paper Ring was made around one simple idea: social media does not
            have to mean being social with everyone. This space is for the
            people you actually know.
          </p>
          <div className="support-facts">
            <div><b>01</b><span>Friend codes instead of public search</span></div>
            <div><b>02</b><span>Private friend lists</span></div>
            <div><b>03</b><span>One Paper Ring per friendship direction</span></div>
          </div>
        </section>

        <section className="feedback-card">
          <div className="card-title">
            <MessageSquareText size={21} />
            <div><span className="eyebrow">talk to us</span><h2>Feedback</h2></div>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Your message<textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={3000} placeholder="Found a bug? Have an idea? Tell us." required /></label>
            <button className="button button-dark full" disabled={busy}>{busy ? "Sending…" : "Send feedback"}</button>
          </form>
        </section>
      </div>

      <section className="developer-card">
        <div className="developer-mark">PR</div>
        <div>
          <span className="eyebrow">developed by</span>
          <h2>Javeria Ashab</h2>
          <p>Check out more of me!</p>
        </div>
        <a className="button" href="https://javeriaashab.netlify.app/" target="_blank"><FolderKanban strokeWidth={2} size={20} /> Javeria Ashab</a>
      </section>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
