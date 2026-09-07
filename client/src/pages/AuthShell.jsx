import { Link } from "react-router-dom";
import React from "react";

export default function AuthShell({ title, eyebrow, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-grid-decoration" />
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-stamp">PR</span>
          <span>paper ring</span>
        </div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
        <div className="auth-footer">{footer}</div>
      </div>
      <div className="auth-side">
        <span className="side-sticker">PRIVATE / FRIENDS ONLY</span>
        <h2>Small circle.<br />Big feelings.</h2>
        <p>Paper Ring is a quiet little corner of the internet for people who already know each other.</p>
        <div className="side-note">No follower counts.<br />No public profiles.<br />Just your people.</div>
      </div>
    </div>
  );
}
