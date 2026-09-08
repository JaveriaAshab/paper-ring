import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import 'dotenv/config';
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import { generateFriendCode } from "../utils/code.js";
import { signToken, requireAuth } from "../utils/auth.js";

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;


console.log('SMTP Host:', process.env.SMTP_HOST);
console.log('SMTP User:', process.env.SMTP_USER);

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendVerificationEmail(user, rawToken) {
  const verificationUrl =
    `${process.env.CLIENT_URL}/verify-email/${rawToken}?email=${encodeURIComponent(user.email)}`;


  await mailTransporter.sendMail({
    from: `"Paper Ring" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Verify your Paper Ring email",
    text: `Welcome to Paper Ring! Verify your email using this link: ${verificationUrl}. This link expires in 24 hours.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto;">
        <h2>Welcome to Paper Ring ♡</h2>

        <p>
          Hi ${user.name},
        </p>

        <p>
          Thanks for creating your Paper Ring account.
          Please verify your email address to finish setting up your account.
        </p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #111;
              color: white;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Verify my email
          </a>
        </p>

        <p>This link expires in 24 hours.</p>

        <p>
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `
  });
}

mailTransporter.verify()
  .then(() => {
    console.log("Paper Ring SMTP connection ready.");
  })
  .catch((error) => {
    console.error("Paper Ring SMTP configuration error:", error.message);
  });

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    friendCode: user.friendCode,
    description: user.description,
    profilePicture: user.profilePicture,
    banner: user.banner
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, rememberMe } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    if (name.trim().length < 2 || name.trim().length > 40) {
      return res.status(400).json({
        message: "Name must be between 2 and 40 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be 8–72 characters and contain at least one letter and one number."
      });
    }

    // const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rawVerificationToken = crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      authProvider: "local",
      emailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
      friendCode: await generateFriendCode()
    });

    await sendVerificationEmail(user, rawVerificationToken);

    res.status(201).json({
      message: "Account created. Please check your email to verify your account.",
      requiresVerification: true,
      email: user.email
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    const user = await User.findOne({
      email: normalizedEmail
    }).select("+password");

    if (!user || user.authProvider === "google" || !user.password) {
      return res.status(401).json({
        message: user?.authProvider === "google"
          ? "This account uses Google login. Please continue with Google."
          : "Email or password is incorrect."
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in."
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Email or password is incorrect."
      });
    }

    const token = signToken(
      user._id.toString(),
      Boolean(rememberMe)
    );

    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.options("/google", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "https://paper-ring-client.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res.sendStatus(204);
});

router.post("/google", async (req, res, next) => {
  try {
    const { credential, rememberMe } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required."
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({
        message: "Google could not verify this account."
      });
    }

    const email = payload.email.toLowerCase().trim();

    let user = await User.findOne({ email });

    if (user) {
      if (user.authProvider === "local") {
        return res.status(409).json({
          message: "An account with this email already exists. Please log in with your email and password."
        });
      }
    } else {
      user = await User.create({
        name: String(payload.name || "Paper Ring user").trim().slice(0, 40),
        email,
        authProvider: "google",
        emailVerified: true,
        profilePicture: payload.picture || "",
        friendCode: await generateFriendCode()
      });
    }

    const token = signToken(
      user._id.toString(),
      Boolean(rememberMe)
    );

    res.json({
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Google authentication error:", error);

    res.status(401).json({
      message: "Google login could not be completed."
    });
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    const user = await User.findOne({ email }).select(
      "+resetPasswordToken +resetPasswordExpires"
    );

    // Always return the same response whether the account exists or not.
    if (!user) {
      return res.json({
        message: "If an account exists for that email, a reset link has been sent."
      });
    }

    if (user.authProvider === "google") {
      return res.json({
        message: "If an account exists for that email, a reset link has been sent."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl =
      `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    await mailTransporter.sendMail({
      from: `"Paper Ring" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Reset your Paper Ring password",
      text: `Reset your Paper Ring password using this link: ${resetUrl}. This link expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset your Paper Ring password</h2>
          <p>You requested a password reset for your Paper Ring account.</p>
          <p>
            <a href="${resetUrl}">
              Reset my password
            </a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({
      message: "If an account exists for that email, a reset link has been sent."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password/:token", async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!passwordRegex.test(password || "")) {
      return res.status(400).json({
        message: "Password must be 8–72 characters and contain at least one letter and one number."
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid or has expired."
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.authProvider = "local";
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "Your password has been reset. You can now log in."
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify-email/:token", async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() }
    }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      return res.status(400).json({
        message: "This verification link is invalid or has expired."
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.json({
      message: "Your email has been verified successfully."
    });
  } catch (error) {
    next(error);
  }
});

router.post("/resend-verification", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user || user.authProvider === "google" || user.emailVerified) {
      return res.json({
        message: "If your account needs verification, a new verification email has been sent."
      });
    }

    const rawVerificationToken = crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await user.save();

    await sendVerificationEmail(user, rawVerificationToken);

    res.json({
      message: "If your account needs verification, a new verification email has been sent."
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
