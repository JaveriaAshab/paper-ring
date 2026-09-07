import jwt from "jsonwebtoken";

export function signToken(userId, rememberMe = false) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? "30d" : "2h"
    }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}
