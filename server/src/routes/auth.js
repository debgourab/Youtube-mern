import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import {
  createError,
  escapeRegex,
  isImageDataUrl,
  isValidEmail,
  isLocalAssetPath,
  normalizeEmail,
  normalizeString,
  publicUser
} from "../utils/validators.js";

import { validatePassword } from "../utils/password.js";

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const MAX_AVATAR_LENGTH = 1_500_000;

const validateRegister = ({ username, email, password }) => {
  const cleanUsername = normalizeString(username);

  if (cleanUsername.length < 3) return "Username must be at least 3 characters.";
  if (cleanUsername.length > 32) return "Username must be 32 characters or fewer.";
  if (!/^[a-zA-Z0-9_. -]+$/.test(cleanUsername)) return "Username can use letters, numbers, spaces, dots, dashes, and underscores.";
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (validatePassword(password)) return validatePassword(password);
  return "";
};

const findUserByIdentifier = (identifier) => {
  const cleanIdentifier = normalizeString(identifier);

  if (isValidEmail(cleanIdentifier)) {
    return User.findOne({ email: normalizeEmail(cleanIdentifier) }).select("+password");
  }

  return User.findOne({
    username: { $regex: `^${escapeRegex(cleanIdentifier)}$`, $options: "i" }
  }).select("+password");
};

router.post("/register", async (req, res, next) => {
  try {
    const message = validateRegister(req.body || {});
    if (message) return res.status(400).json({ message });

    const username = normalizeString(req.body.username);
    const email = normalizeEmail(req.body.email);
    const duplicate = await User.findOne({
      $or: [
        { email },
        { username: { $regex: `^${escapeRegex(username)}$`, $options: "i" } }
      ]
    });

    if (duplicate?.email === email) return res.status(409).json({ message: "Email is already registered." });
    if (duplicate) return res.status(409).json({ message: "Username is already taken." });

    const hashed = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ username, email, password: hashed });

    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    req.body ||= {};
    const identifier = normalizeString(req.body.identifier || req.body.email || req.body.username);
    if (!identifier) throw createError(400, "Email or username is required.");
    if (typeof req.body.password !== "string" || req.body.password.length < 8) throw createError(400, "Password must be at least 8 characters.");

    const user = await findUserByIdentifier(identifier);
    const isPasswordValid = user ? await bcrypt.compare(req.body.password, user.password) : false;

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email/username or password." });
    }

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

const updateAvatar = async (req, res, next) => {
  try {
    const avatar = normalizeString(req.body?.avatar);

    if (!avatar) throw createError(400, "Profile picture is required.");
    if (avatar.length > MAX_AVATAR_LENGTH) throw createError(400, "Profile picture must be 1 MB or smaller.");
    if (!isLocalAssetPath(avatar) && !isImageDataUrl(avatar)) {
      throw createError(400, "Profile picture must be a PNG, JPG, WebP, or GIF image.");
    }

    req.user.avatar = avatar;
    await req.user.save();

    res.json({ user: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
};

router.put("/me/avatar", protect, updateAvatar);
router.patch("/me", protect, updateAvatar);

export default router;
