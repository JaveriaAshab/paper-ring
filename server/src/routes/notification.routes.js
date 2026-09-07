import { Router } from "express";

import Notification from "../models/Notification.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate("actor", "name profilePicture")
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      readAt: null
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, readAt: null },
      { readAt: new Date() }
    );

    res.json({ message: "Notifications marked as read." });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { readAt: new Date() }
    );

    res.json({ message: "Notification marked as read." });
  } catch (error) {
    next(error);
  }
});

export default router;
