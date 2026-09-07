import { Router } from "express";

import PaperRing from "../models/PaperRing.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { requireAuth } from "../utils/auth.js";
import { areFriends } from "../utils/friend.js";

const router = Router();

router.get("/received", requireAuth, async (req, res, next) => {
  try {
    const rings = await PaperRing.find({ recipient: req.userId })
      .populate("sender", "name profilePicture")
      .sort({ updatedAt: -1 });

    res.json({ rings });
  } catch (error) {
    next(error);
  }
});

router.get("/given", requireAuth, async (req, res, next) => {
  try {
    const rings = await PaperRing.find({ sender: req.userId })
      .populate("recipient", "name profilePicture")
      .sort({ updatedAt: -1 });

    res.json({ rings });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { recipientId, body } = req.body;

    if (!recipientId || !body?.trim()) {
      return res.status(400).json({ message: "Recipient and letter text are required." });
    }

    if (String(recipientId) === String(req.userId)) {
      return res.status(400).json({ message: "You cannot write a Paper Ring to yourself." });
    }

    if (!(await areFriends(req.userId, recipientId))) {
      return res.status(403).json({ message: "You can only leave Paper Rings for friends." });
    }

    const existing = await PaperRing.findOne({
      sender: req.userId,
      recipient: recipientId
    });

    if (existing) {
      return res.status(409).json({
        message: "You already left this friend a Paper Ring. Edit your existing one instead."
      });
    }

    const ring = await PaperRing.create({
      sender: req.userId,
      recipient: recipientId,
      body: body.trim()
    });

    const sender = await User.findById(req.userId).select("name");

    await Notification.create({
      recipient: recipientId,
      actor: req.userId,
      type: "paper_ring",
      text: `${sender.name} left a new Paper Ring on your profile.`
    });

    await ring.populate("sender", "name profilePicture");

    res.status(201).json({ ring });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already left this friend a Paper Ring. Edit your existing one instead."
      });
    }
    next(error);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ message: "Letter text cannot be empty." });
    }

    const ring = await PaperRing.findOneAndUpdate(
      { _id: req.params.id, sender: req.userId },
      { body: body.trim() },
      { new: true, runValidators: true }
    ).populate("recipient", "name profilePicture");

    if (!ring) {
      return res.status(404).json({ message: "Paper Ring not found or you do not own it." });
    }

    res.json({ ring });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const deleted = await PaperRing.findOneAndDelete({
      _id: req.params.id,
      sender: req.userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Paper Ring not found or you do not own it." });
    }

    res.json({ message: "Paper Ring deleted." });
  } catch (error) {
    next(error);
  }
});

export default router;
