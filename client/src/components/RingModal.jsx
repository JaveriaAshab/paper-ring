import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import Avatar from "./Avatar.jsx";
import api from "../api.js";
import React from "react";

export default function RingModal({
  open,
  ring,
  recipient,
  editable = false,
  onClose,
  onSaved
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBody(ring?.body || "");
    setError("");
  }, [ring]);

  const save = async () => {
    if (!body.trim()) return setError("A Paper Ring cannot be empty.");

    setSaving(true);
    setError("");

    try {
      const url = ring?._id ? `/rings/${ring._id}` : "/rings";
      const method = ring?._id ? "put" : "post";
      const payload = ring?._id
        ? { body }
        : { recipientId: recipient.id, body };

      const { data } = await api[method](url, payload);
      onSaved?.(data.ring);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the Paper Ring.");
    } finally {
      setSaving(false);
    }
  };

  const person = ring?.sender || recipient;

  return (
    <Modal open={open} title={ring ? "Paper Ring" : `Write to ${recipient?.name}`} onClose={onClose}>
      <div className="ring-modal-person">
        <Avatar src={person?.profilePicture} name={person?.name} />
        <div>
          <strong>{person?.name}</strong>
          <span>{ring ? "a little note left for you" : "leave something worth keeping"}</span>
        </div>
      </div>

      {editable ? (
        <>
          <textarea
            className="letter-editor"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            placeholder="Write your Paper Ring…"
            autoFocus
          />
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <span className="character-count">{body.length}/4000</span>
            <button className="button button-primary" disabled={saving} onClick={save}>
              {saving ? "Saving…" : ring ? "Save changes" : "Leave Paper Ring"}
            </button>
          </div>
        </>
      ) : (
        <div className="letter-read">
          {ring?.body}
        </div>
      )}
    </Modal>
  );
}
