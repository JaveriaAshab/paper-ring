import { Router } from "express";

import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { requireAuth } from "../utils/auth.js";
import { areFriends, getFriendIds } from "../utils/friend.js";

const router = Router();

router.get("/friends", requireAuth, async (req, res, next) => {
  try {
    const ids = await getFriendIds(req.userId);

    const friends = await User.find({ _id: { $in: ids } })
      .select("name profilePicture friendCode")
      .lean();

    const unread = await Message.aggregate([
      {
        $match: {
          recipient: (await User.findById(req.userId))._id,
          readAt: null
        }
      },
      { $group: { _id: "$sender", count: { $sum: 1 } } }
    ]);

    const unreadMap = new Map(unread.map((row) => [String(row._id), row.count]));

    res.json({
      friends: friends.map((friend) => ({
        ...friend,
        unreadCount: unreadMap.get(String(friend._id)) || 0
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:friendId", requireAuth, async (req, res, next) => {
  try {
    if (!(await areFriends(req.userId, req.params.friendId))) {
      return res.status(403).json({ message: "You can only message friends." });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: req.params.friendId },
        { sender: req.params.friendId, recipient: req.userId }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(500);

    await Message.updateMany(
      {
        sender: req.params.friendId,
        recipient: req.userId,
        readAt: null
      },
      { readAt: new Date() }
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post("/:friendId", requireAuth, async (req, res, next) => {
  try {
    const { body } = req.body;

    if (!(await areFriends(req.userId, req.params.friendId))) {
      return res.status(403).json({ message: "You can only message friends." });
    }

    if (!body?.trim()) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    const message = await Message.create({
      sender: req.userId,
      recipient: req.params.friendId,
      body: body.trim()
    });

    const sender = await User.findById(req.userId).select("name");

    await Notification.create({
      recipient: req.params.friendId,
      actor: req.userId,
      type: "message",
      text: `${sender.name} sent you a new message.`
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

export default router;
