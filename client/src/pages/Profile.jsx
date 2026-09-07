import { useEffect, useState } from "react";
import { ArrowLeft, Edit3, Heart, ImagePlus, Link as LinkIcon, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import React from "react";

import api from "../api.js";
import Avatar from "../components/Avatar.jsx";
import Modal from "../components/Modal.jsx";
import RingCard from "../components/RingCard.jsx";
import RingModal from "../components/RingModal.jsx";
import Toast from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const isOwn = !params.id || String(params.id) === String(user.id);
  const profileId = params.id || user.id;

  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [rings, setRings] = useState([]);
  const [givenRings, setGivenRings] = useState([]);
  const [tab, setTab] = useState("received");
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [ringOpen, setRingOpen] = useState(false);
  const [editingRing, setEditingRing] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${profileId}`);
      setProfile(data.profile);
      setFriends(data.friends || []);
      setRings(data.receivedRings || []);

      if (isOwn) {
        const given = await api.get("/rings/given");
        setGivenRings(given.data.rings);
      }
    } catch (err) {
      console.error("Profile loading failed:", err);
      console.error("Profile API response:", err.response?.data);

      setToast(
        err.response?.data?.message ||
        "Could not load this profile."
      );
    } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadProfile();
}, [profileId]);

const openCreateRing = () => {
  setEditingRing(null);
  setRingOpen(true);
};

const openEditRing = (ring) => {
  setEditingRing(ring);
  setRingOpen(true);
};

const deleteRing = async (ring) => {
  if (!window.confirm("Delete this Paper Ring?")) return;

  try {
    await api.delete(`/rings/${ring._id}`);
    setGivenRings((current) => current.filter((item) => item._id !== ring._id));
    setToast("Paper Ring deleted.");
  } catch (err) {
    setToast(err.response?.data?.message || "Could not delete the Ring.");
  }
};

const handleRingSaved = async () => {
  await loadProfile();
  setToast(editingRing ? "Paper Ring updated." : "Paper Ring left.");
};

const saveProfile = async (form) => {
  try {
    const { data } = await api.put("/users/me", form);
    updateUser(data.user);
    setProfile((current) => ({ ...current, ...data.user }));
    setEditingProfile(false);
    setToast("Profile updated.");
  } catch (err) {
    setToast(err.response?.data?.message || "Could not update your profile.");
  }
};

if (loading) return <div className="empty-state">Loading profile…</div>;
if (!profile) return <div className="empty-state bordered"><h2>Profile unavailable.</h2></div>;

const shownRings = isOwn && tab === "given" ? givenRings : rings;

return (
  <div className="profile-page">
    {!isOwn && (
      <button className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={17} /> back
      </button>
    )}

    <section className="profile-cover">
      <div
        className={`profile-banner ${profile.banner ? "has-image" : ""}`}
        style={profile.banner ? { backgroundImage: `url(${profile.banner})` } : undefined}
      >
        {!profile.banner && <span>paper ring</span>}
        {isOwn && (
          <button className="banner-edit" onClick={() => setEditingProfile(true)}>
            <ImagePlus size={16} /> {profile.banner ? "change banner" : "add banner"}
          </button>
        )}
      </div>

      <div className="profile-info">
        <div className="profile-avatar-wrap">
          <Avatar src={profile.profilePicture} name={profile.name} size="xl" />
          {isOwn && (
            <button className="avatar-edit" onClick={() => setEditingProfile(true)} aria-label="Edit profile">
              <Edit3 size={15} />
            </button>
          )}
        </div>

        <div className="profile-main">
          <div className="profile-name-row">
            <div>
              <h1>{profile.name}</h1>
              <span className="friend-code-label">#{profile.friendCode}</span>
            </div>
            {isOwn && (
              <button className="button" onClick={() => setEditingProfile(true)}>
                <Edit3 size={16} /> Edit profile
              </button>
            )}
          </div>
          <p className="profile-description">{profile.description || "No description yet."}</p>

          <button
            className={`friend-count ${isOwn ? "clickable" : ""}`}
            onClick={() => isOwn && setFriendsOpen(true)}
            disabled={!isOwn}
          >
            <Users size={17} />
            <strong>{profile.friendsCount}</strong> friends
          </button>
        </div>
      </div>
    </section>

    <section className="rings-section">
      <div className="rings-heading">
        <div>
          <span className="eyebrow">{isOwn ? "your little archive" : `${profile.name}'s archive`}</span>
          <h2>Paper Rings</h2>
        </div>
        {!isOwn && (
          <button className="button button-dark" onClick={openCreateRing}>
            <Heart size={16} /> Leave a Ring
          </button>
        )}
      </div>

      {isOwn && (
        <div className="ring-tabs">
          <button className={tab === "received" ? "active" : ""} onClick={() => setTab("received")}>
            Received
          </button>
          <button className={tab === "given" ? "active" : ""} onClick={() => setTab("given")}>
            Given
          </button>
        </div>
      )}

      {shownRings.length ? (
        <div className="ring-grid">
          {shownRings.map((ring) => (
            <RingCard
              key={ring._id}
              ring={ring}
              mode={isOwn && tab === "given" ? "given" : "received"}
              onOpen={(item) => {
                setEditingRing(null);
                setRingOpen(item);
              }}
              onEdit={openEditRing}
              onDelete={deleteRing}
            />
          ))}
        </div>
      ) : (
        <div className="rings-empty">
          <span>♡</span>
          <h3>{tab === "given" && isOwn ? "You haven't written one yet." : "No Paper Rings here yet."}</h3>
          {!isOwn && <p>Be the first friend to leave a little note.</p>}
        </div>
      )}
    </section>

    <FriendsModal
      open={friendsOpen}
      friends={friends}
      onClose={() => setFriendsOpen(false)}
      onOpen={(id) => {
        setFriendsOpen(false);
        navigate(`/profile/${id}`);
      }}
    />

    <ProfileEditor
      open={editingProfile}
      profile={profile}
      onClose={() => setEditingProfile(false)}
      onSave={saveProfile}
    />

    <RingModal
      open={ringOpen}
      ring={ringOpen?._id ? ringOpen : editingRing}
      recipient={!isOwn ? { id: profile.id, name: profile.name, profilePicture: profile.profilePicture } : null}
      editable={!ringOpen?._id || Boolean(editingRing)}
      onClose={() => {
        setRingOpen(false);
        setEditingRing(null);
      }}
      onSaved={handleRingSaved}
    />

    <Toast message={toast} onClose={() => setToast("")} />
  </div>
);
}

function FriendsModal({ open, friends, onClose, onOpen }) {
  return (
    <Modal open={open} title="Your friends" onClose={onClose}>
      <div className="modal-friend-list">
        {friends.length ? friends.map((friend) => (
          <button key={friend._id} className="modal-friend" onClick={() => onOpen(friend._id)}>
            <Avatar src={friend.profilePicture} name={friend.name} size="sm" />
            <span><strong>{friend.name}</strong><small>#{friend.friendCode}</small></span>
            <LinkIcon size={16} />
          </button>
        )) : (
          <p className="muted">You haven't added anyone yet.</p>
        )}
      </div>
    </Modal>
  );
}

function ProfileEditor({ open, profile, onClose, onSave }) {
  const [form, setForm] = useState({
    name: profile?.name || "",
    description: profile?.description || "",
    profilePicture: profile?.profilePicture || "",
    banner: profile?.banner || ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        description: profile.description || "",
        profilePicture: profile.profilePicture || "",
        banner: profile.banner || ""
      });
    }
  }, [profile, open]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Modal open={open} title="Edit profile" onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={240} placeholder="A tiny introduction…" /></label>
        <label>Profile picture URL<input value={form.profilePicture} onChange={(e) => setForm({ ...form, profilePicture: e.target.value })} placeholder="https://…" /></label>
        <label>Banner image URL<input value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} placeholder="https://…" /></label>
        <button className="button button-primary full" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
      </form>
    </Modal>
  );
}
