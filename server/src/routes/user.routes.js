import { Router } from "express";

import User from "../models/User.js";
import Friendship from "../models/Friendship.js";
import Notification from "../models/Notification.js";
import PaperRing from "../models/PaperRing.js";
import { requireAuth } from "../utils/auth.js";
import { areFriends, getFriendIds } from "../utils/friend.js";

const router = Router();

function profileData(user, friends = []) {
  return {
    id: user._id,
    name: user.name,
    friendCode: user.friendCode,
    description: user.description,
    profilePicture: user.profilePicture,
    banner: user.banner,
    friendsCount: friends.length
  };
}

router.get("/search/:code", requireAuth, async (req, res, next) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    if (!code) return res.status(400).json({ message: "Enter a friend code." });

    const user = await User.findOne({ friendCode: code });

    if (!user) return res.status(404).json({ message: "No user has that friend code." });
    if (String(user._id) === String(req.userId)) {
      return res.status(400).json({ message: "That is your own friend code." });
    }

    const friends = await getFriendIds(req.userId);
    const alreadyFriends = friends.some((id) => String(id) === String(user._id));

    res.json({
      user: profileData(user),
      alreadyFriends
    });
  } catch (error) {
    next(error);
  }
});

router.post("/add/:id", requireAuth, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);

    if (!target) return res.status(404).json({ message: "User not found." });
    if (String(target._id) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot add yourself." });
    }

    const existing = await Friendship.findOne({
      users: { $all: [req.userId, target._id] }
    });

    if (existing) {
      return res.status(409).json({ message: "You are already friends." });
    }

    const pairKey = [String(req.userId), String(target._id)].sort().join("_");

    await Friendship.create({
      users: [req.userId, target._id],
      pairKey,
      addedBy: req.userId
    });

    const actor = await User.findById(req.userId).select("name");

    await Notification.create({
      recipient: target._id,
      actor: req.userId,
      type: "friend_added",
      text: `${actor.name} added you as a friend.`
    });

    res.status(201).json({ message: `You and ${target.name} are now friends.` });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You are already friends." });
    }
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);

    if (!target) return res.status(404).json({ message: "User not found." });

    const self = String(target._id) === String(req.userId);
    const friends = await getFriendIds(target._id);

    if (!self && !(await areFriends(req.userId, target._id))) {
      return res.status(403).json({
        message: "This profile is private. Add this person as a friend first."
      });
    }

    const friendUsers = self
      ? await User.find({ _id: { $in: friends } }).select("name friendCode profilePicture")
      : [];

    const receivedRings = await PaperRing.find({ recipient: target._id })
      .populate("sender", "name profilePicture")
      .sort({ updatedAt: -1 });

    res.json({
      profile: profileData(target, friends),
      friends: friendUsers,
      receivedRings
    });
  } catch (error) {
    next(error);
  }
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, description, profilePicture, banner } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name: name.trim(),
        description: String(description || "").trim().slice(0, 240),
        profilePicture: String(profilePicture || "").trim(),
        banner: String(banner || "").trim()
      },
      { new: true, runValidators: true }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        friendCode: user.friendCode,
        description: user.description,
        profilePicture: user.profilePicture,
        banner: user.banner
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
