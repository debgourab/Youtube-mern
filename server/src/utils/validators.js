export const VIDEO_CATEGORIES = [
  "Web Development",
  "JavaScript",
  "React",
  "Node.js",
  "MongoDB",
  "Programming",
  "Music",
  "Gaming",
  "News"
];

export const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export const normalizeEmail = (value) => normalizeString(value).toLowerCase();

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));

export const escapeRegex = (value) => normalizeString(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeHandle = (value) => {
  const handle = normalizeString(value)
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "");

  return handle || undefined;
};

export const isHttpUrl = (value) => {
  const candidate = normalizeString(value);
  if (!candidate) return false;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const isLocalAssetPath = (value) => normalizeString(value).startsWith("/avatars/");

export const isImageDataUrl = (value) =>
  /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(normalizeString(value));

export const createError = (status, message) => Object.assign(new Error(message), { status });

export const publicUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  channels: user.channels
});
