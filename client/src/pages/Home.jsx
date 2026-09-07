import { useState } from "react";
import { ArrowRight, Copy, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React from "react";

import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");

  const search = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const { data } = await api.get(`/users/search/${encodeURIComponent(code.trim())}`);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "No one found.");
    } finally {
      setBusy(false);
    }
  };

  const addFriend = async () => {
    if (!result?.user) return;

    setAdding(true);
    try {
      const { data } = await api.post(`/users/add/${result.user.id}`);
      setResult({ ...result, alreadyFriends: true });
      setToast(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not add friend.");
    } finally {
      setAdding(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(user.friendCode);
    setToast("Your friend code is copied.");
  };

  return (
    <div className="home-page">
      <section className="hero-block">
        <div>
          <span className="sticker">A PRIVATE SOCIAL SPACE</span>
          <h1>Your people,<br /><em>your paper.</em></h1>
          <p>
            Find your friends with their secret code, leave little letters,
            and keep conversations where they belong: between friends.
          </p>
        </div>
        <div className="hero-doodle" aria-hidden="true">
          <div className="doodle-paper">
            <span>hey you!</span>
            <strong>♡</strong>
          </div>
        </div>
      </section>

      <section className="search-section">
        <div className="section-label">
          <span>01</span>
          <h2>Find a friend</h2>
        </div>

        <form className="friend-search" onSubmit={search}>
          <Search size={22} />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter their friend code"
            maxLength={8}
            aria-label="Friend code"
          />
          <button className="button button-primary" disabled={busy}>
            {busy ? "Searching…" : "Search"}
          </button>
        </form>

        {error && <div className="notice notice-error">{error}</div>}

        {result && (
          <div className="search-result">
            <Avatar src={result.user.profilePicture} name={result.user.name} size="lg" />
            <div className="result-copy">
              <span className="eyebrow">friend code {result.user.friendCode}</span>
              <h3>{result.user.name}</h3>
              <p>{result.user.description || "No bio yet."}</p>
            </div>
            <div className="result-actions">
              {result.alreadyFriends ? (
                <button className="button" onClick={() => navigate(`/profile/${result.user.id}`)}>
                  View profile <ArrowRight size={17} />
                </button>
              ) : (
                <button className="button button-dark" onClick={addFriend} disabled={adding}>
                  <UserPlus size={17} />
                  {adding ? "Adding…" : "Add friend"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="code-card">
        <div>
          <span className="eyebrow">your code</span>
          <h2>{user.friendCode}</h2>
          <p>Send this exact code to the friends you want to find you.</p>
        </div>
        <button className="button" onClick={copyCode}>
          <Copy size={17} /> Copy code
        </button>
      </section>

      <section className="home-explainer">
        <div className="section-label">
          <span>02</span>
          <h2>What lives here?</h2>
        </div>
        <div className="feature-grid">
          <article><b>paper rings</b><p>One thoughtful letter from each friend. Edit it later, but no duplicate letters.</p></article>
          <article><b>messages</b><p>Private one-to-one conversations with the people in your circle.</p></article>
          <article><b>notifications</b><p>Know when someone adds you, writes a Ring, or sends a message.</p></article>
        </div>
      </section>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
