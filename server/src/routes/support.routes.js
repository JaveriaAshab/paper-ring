import { Router } from "express";

import Feedback from "../models/Feedback.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

router.post("/feedback", requireAuth, async (req, res, next) => {
  try {
    const { name, email, message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Please write a message." });
    }

    await Feedback.create({
      name: String(name || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      message: message.trim()
    });

    res.status(201).json({ message: "Thanks! Your feedback has been sent." });
  } catch (error) {
    next(error);
  }
});

export default router;
