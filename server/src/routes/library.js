import express from "express";
import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import { protect } from "../middleware/auth.js";
import { createError } from "../utils/validators.js";

const router = express.Router();

const sectionTitles = {
  history: "History",
  playlists: "Playlists",
  "watch-later": "Watch later",
  "liked-videos": "Liked videos",
  downloads: "Downloads",
  subscriptions: "Subscriptions"
};

const populateVideos = (query) => query
  .populate("channelId", "channelName avatar subscribers handle")
  .populate("uploader", "username avatar");

const idsFrom = (items = [], key) => items
  .map((item) => key ? item?.[key] : item)
  .filter(Boolean)
  .map((item) => item._id || item);

const orderedVideos = async (ids) => {
  if (!ids.length) return [];
  const videos = await populateVideos(Video.find({ _id: { $in: ids } }));
  const byId = new Map(videos.map((video) => [video._id.toString(), video]));
  return ids.map((id) => byId.get(id.toString())).filter(Boolean);
};

router.get("/:section", protect, async (req, res, next) => {
  try {
    const { section } = req.params;
    if (!sectionTitles[section]) throw createError(404, "Library section not found.");

    let videos = [];
    let channels = [];
    let playlists = [];

    if (section === "history") {
      videos = await orderedVideos(idsFrom(req.user.history, "video"));
    }

    if (section === "watch-later") {
      videos = await orderedVideos(idsFrom(req.user.watchLater));
    }

    if (section === "downloads") {
      videos = await orderedVideos(idsFrom(req.user.downloads));
    }

    if (section === "liked-videos") {
      videos = await populateVideos(
        Video.find({ likedBy: req.user._id }).sort({ updatedAt: -1 })
      );
    }

    if (section === "playlists") {
      playlists = await Promise.all(
        (req.user.playlists || []).map(async (playlist) => ({
          id: playlist._id.toString(),
          name: playlist.name,
          videos: await orderedVideos(idsFrom(playlist.videos))
        }))
      );
      videos = playlists.flatMap((playlist) => playlist.videos);
    }

    if (section === "subscriptions") {
      const channelIds = idsFrom(req.user.subscriptions);
      if (channelIds.length) {
        [channels, videos] = await Promise.all([
          Channel.find({ _id: { $in: channelIds } }),
          populateVideos(
            Video.find({ channelId: { $in: channelIds } }).sort({ createdAt: -1 })
          )
        ]);
      }
    }

    res.json({ section, title: sectionTitles[section], videos, channels, playlists });
  } catch (error) {
    next(error);
  }
});

const videoCollections = {
  "watch-later": "watchLater",
  downloads: "downloads"
};

const ensureVideo = async (videoId) => {
  const video = await Video.findById(videoId);
  if (!video) throw createError(404, "Video not found.");
  return video;
};

router.put("/:section/:videoId", protect, async (req, res, next) => {
  try {
    const { section, videoId } = req.params;

    if (section === "subscriptions") {
      const channel = await Channel.findById(videoId);
      if (!channel) throw createError(404, "Channel not found.");

      const subscribed = req.user.subscriptions.some((id) => id.equals(channel._id));
      if (!subscribed) {
        req.user.subscriptions.addToSet(channel._id);
        channel.subscribers += 1;
        await Promise.all([req.user.save(), channel.save()]);
      }

      return res.json({ active: true, subscribers: channel.subscribers });
    }

    await ensureVideo(videoId);

    if (videoCollections[section]) {
      const field = videoCollections[section];
      req.user[field].addToSet(videoId);
    } else if (section === "playlists") {
      if (!req.user.playlists.length) {
        req.user.playlists.push({ name: "Saved videos", videos: [] });
      }
      req.user.playlists[0].videos.addToSet(videoId);
    } else {
      throw createError(404, "Library section not found.");
    }

    await req.user.save();
    res.json({ active: true });
  } catch (error) {
    next(error);
  }
});

router.delete("/:section/:videoId", protect, async (req, res, next) => {
  try {
    const { section, videoId } = req.params;

    if (section === "subscriptions") {
      const channel = await Channel.findById(videoId);
      if (!channel) throw createError(404, "Channel not found.");

      const subscribed = req.user.subscriptions.some((id) => id.equals(channel._id));
      if (subscribed) {
        req.user.subscriptions.pull(channel._id);
        channel.subscribers = Math.max(0, channel.subscribers - 1);
        await Promise.all([req.user.save(), channel.save()]);
      }

      return res.json({ active: false, subscribers: channel.subscribers });
    }

    if (videoCollections[section]) {
      req.user[videoCollections[section]].pull(videoId);
    } else if (section === "playlists") {
      req.user.playlists.forEach((playlist) => playlist.videos.pull(videoId));
    } else {
      throw createError(404, "Library section not found.");
    }

    await req.user.save();
    res.json({ active: false });
  } catch (error) {
    next(error);
  }
});

export default router;
