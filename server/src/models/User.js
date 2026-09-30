import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    avatar: {
      type: String,
      default: "/avatars/user.svg"
    },
    channels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Channel" }],
    subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Channel" }],
    watchLater: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    playlists: [
      {
        name: { type: String, trim: true, default: "Saved videos" },
        videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }]
      }
    ],
    history: [
      {
        video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
        viewedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
