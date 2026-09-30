import express from "express";
import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
import Comment from "../models/Comment.js";
import { optionalAuth, protect } from "../middleware/auth.js";
import { createVideoComment, listVideoComments } from "./comments.js";
import {
  VIDEO_CATEGORIES,
  createError,
  escapeRegex,
  isHttpUrl,
  normalizeString
} from "../utils/validators.js";

import { resolveVideoSource, VIDEO_SOURCE_HELP } from "../utils/media.js";

const router = express.Router();

const populateVideo = (query) => query
  .populate("channelId", "channelName avatar subscribers handle")
  .populate("uploader", "username avatar");

const serializeVideo = (video, userId) => {
  const payload = video.toObject ? video.toObject() : { ...video };
  const viewerId = userId?.toString();

  payload.viewerReaction = "";
  if (viewerId && payload.likedBy?.some((id) => id.toString() === viewerId)) payload.viewerReaction = "like";
  if (viewerId && payload.dislikedBy?.some((id) => id.toString() === viewerId)) payload.viewerReaction = "dislike";

  delete payload.likedBy;
  delete payload.dislikedBy;
  return payload;
};

const validateVideoInput = (body = {}, partial = false) => {
  const payload = {};
  const fields = ["title", "thumbnailUrl", "videoUrl", "description", "category", "duration"];

  fields.forEach((field) => {
    if (body[field] !== undefined) payload[field] = normalizeString(body[field]);
  });

  if (!partial || payload.title !== undefined) {
    if (!payload.title || payload.title.length < 3) throw createError(400, "Video title must be at least 3 characters.");
  }

  if (!partial || payload.description !== undefined) {
    if (!payload.description || payload.description.length < 10) {
      throw createError(400, "Video description must be at least 10 characters.");
    }
  }

  if (!partial || payload.thumbnailUrl !== undefined) {
    if (!isHttpUrl(payload.thumbnailUrl)) throw createError(400, "Thumbnail URL must be a valid http(s) URL.");
  }

  if (!partial || payload.videoUrl !== undefined) {
    if (!resolveVideoSource(payload.videoUrl)) throw createError(400, VIDEO_SOURCE_HELP);
  }

  if (!partial || payload.category !== undefined) {
    if (!VIDEO_CATEGORIES.includes(payload.category)) {
      throw createError(400, `Category must be one of: ${VIDEO_CATEGORIES.join(", ")}.`);
    }
  }

  if (payload.duration && !/^(?:\d{1,2}:)?\d{1,2}:[0-5]\d$/.test(payload.duration)) {
    throw createError(400, "Duration must use mm:ss or hh:mm:ss.");
  }
  return payload;
};

const findOwnedVideo = async (videoId, userId) => {
  const video = await Video.findById(videoId);
  if (!video) throw createError(404, "Video not found.");
  if (video.uploader.toString() !== userId.toString()) {
    throw createError(403, "You can manage only your own videos.");
  }
  return video;
};

const applyReaction = async (videoId, userId, reaction) => {
  const video = await Video.findById(videoId);
  if (!video) throw createError(404, "Video not found.");

  const userKey = userId.toString();
  const hasLiked = video.likedBy.some((id) => id.toString() === userKey);
  const hasDisliked = video.dislikedBy.some((id) => id.toString() === userKey);

  if (reaction === "like") {
    if (hasLiked) {
      video.likedBy.pull(userId);
      video.likes = Math.max(0, video.likes - 1);
    } else {
      video.likedBy.addToSet(userId);
      video.likes += 1;
      if (hasDisliked) {
        video.dislikedBy.pull(userId);
        video.dislikes = Math.max(0, video.dislikes - 1);
      }
    }
  }

  if (reaction === "dislike") {
    if (hasDisliked) {
      video.dislikedBy.pull(userId);
      video.dislikes = Math.max(0, video.dislikes - 1);
    } else {
      video.dislikedBy.addToSet(userId);
      video.dislikes += 1;
      if (hasLiked) {
        video.likedBy.pull(userId);
        video.likes = Math.max(0, video.likes - 1);
      }
    }
  }

  await video.save();
  return serializeVideo(video, userId);
};

router.get("/", async (req, res, next) => {
  try {
    const search = normalizeString(req.query.search);
    const category = normalizeString(req.query.category || "All");
    const filter = {};

    if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };
    if (category && category !== "All") filter.category = category;

    const videos = await populateVideo(Video.find(filter).sort({ createdAt: -1 }));
    res.json(videos.map((video) => serializeVideo(video)));
  } catch (error) {
    next(error);
  }
});

router.get("/:videoId/comments", async (req, res, next) => {
  try {
    res.json(await listVideoComments(req.params.videoId));
  } catch (error) {
    next(error);
  }
});

router.post("/:videoId/comments", protect, async (req, res, next) => {
  try {
    const comment = await createVideoComment(req.params.videoId, req.user._id, req.body);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const video = await populateVideo(
      Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { returnDocument: "after" })
    );
    if (!video) throw createError(404, "Video not found.");

    if (req.user) {
      req.user.history = (req.user.history || []).filter(
        (entry) => entry.video.toString() !== video._id.toString()
      );
      req.user.history.unshift({ video: video._id, viewedAt: new Date() });
      req.user.history = req.user.history.slice(0, 100);
      await req.user.save();
    }

    const channelId = video.channelId?._id || video.channelId;
    const [comments, related] = await Promise.all([
      Comment.find({ videoId: video._id }).populate("userId", "username avatar").sort({ createdAt: -1 }),
      populateVideo(
        Video.find({
          _id: { $ne: video._id },
          $or: [{ category: video.category }, { channelId }]
        })
          .sort({ createdAt: -1 })
          .limit(12)
      )
    ]);

    res.json({
      video: serializeVideo(video, req.user?._id),
      comments,
      related: related.map((item) => serializeVideo(item, req.user?._id)),
      library: req.user ? {
        watchLater: req.user.watchLater.some((item) => item.equals(video._id)),
        downloaded: req.user.downloads.some((item) => item.equals(video._id)),
        inPlaylist: req.user.playlists.some((playlist) =>
          playlist.videos.some((item) => item.equals(video._id))
        ),
        subscribed: req.user.subscriptions.some((item) => item.equals(channelId))
      } : null
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", protect, async (req, res, next) => {
  try {
    const payload = validateVideoInput(req.body);
    const channelId = normalizeString(req.body.channelId);
    if (!channelId) throw createError(400, "Channel is required.");

    const channel = await Channel.findOne({ _id: channelId, owner: req.user._id });
    if (!channel) throw createError(403, "You can upload only to your own channel.");

    const video = await Video.create({
      ...payload,
      channelId: channel._id,
      uploader: req.user._id
    });

    await Channel.findByIdAndUpdate(channel._id, { $addToSet: { videos: video._id } });
    await video.populate("channelId", "channelName avatar subscribers handle");
    await video.populate("uploader", "username avatar");
    res.status(201).json(serializeVideo(video, req.user._id));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", protect, async (req, res, next) => {
  try {
    const video = await findOwnedVideo(req.params.id, req.user._id);
    const payload = validateVideoInput(req.body, true);

    Object.assign(video, payload);
    await video.save();
    await video.populate("channelId", "channelName avatar subscribers handle");
    await video.populate("uploader", "username avatar");
    res.json(serializeVideo(video, req.user._id));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", protect, async (req, res, next) => {
  try {
    const video = await findOwnedVideo(req.params.id, req.user._id);

    await Comment.deleteMany({ videoId: video._id });
    await Channel.findByIdAndUpdate(video.channelId, { $pull: { videos: video._id } });
    await video.deleteOne();
    res.json({ message: "Video deleted." });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/like", protect, async (req, res, next) => {
  try {
    res.json(await applyReaction(req.params.id, req.user._id, "like"));
  } catch (error) {
    next(error);
  }
});

router.put("/:id/dislike", protect, async (req, res, next) => {
  try {
    res.json(await applyReaction(req.params.id, req.user._id, "dislike"));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/like", protect, async (req, res, next) => {
  try {
    const action = req.body.action === "dislike" ? "dislike" : "like";
    res.json(await applyReaction(req.params.id, req.user._id, action));
  } catch (error) {
    next(error);
  }
});

export default router;
