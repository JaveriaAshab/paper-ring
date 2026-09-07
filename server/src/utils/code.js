import crypto from "crypto";
import User from "../models/User.js";

export async function generateFriendCode() {
  while (true) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const exists = await User.exists({ friendCode: code });
    if (!exists) return code;
  }
}
