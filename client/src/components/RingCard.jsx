import { Pencil, Trash2 } from "lucide-react";
import Avatar from "./Avatar.jsx";
import React from "react";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function RingCard({ ring, mode, onOpen, onEdit, onDelete }) {
  const person = mode === "given" ? ring.recipient : ring.sender;

  return (
    <article className="ring-card">
      <button className="ring-card-main" onClick={() => onOpen(ring)}>
        <Avatar src={person?.profilePicture} name={person?.name} size="sm" />
        <div className="ring-card-copy">
          <strong>{person?.name || "Friend"}</strong>
          <span>{ring.body.length > 92 ? `${ring.body.slice(0, 92)}…` : ring.body}</span>
          <small>Updated {formatDate(ring.updatedAt || ring.createdAt)}</small>
        </div>
      </button>

      {mode === "given" && (
        <div className="ring-actions">
          <button className="tiny-button" onClick={() => onEdit(ring)} title="Edit">
            <Pencil size={16} />
          </button>
          <button className="tiny-button danger" onClick={() => onDelete(ring)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </article>
  );
}
