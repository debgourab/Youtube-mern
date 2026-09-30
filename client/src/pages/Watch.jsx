import {
  Bell,
  Bookmark,
  Download,
  Edit2,
  ListPlus,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api.js";
import VideoPlayer from "../components/VideoPlayer.jsx";
import VideoCard from "../components/VideoCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, formatViews } from "../utils/categories.js";
import {
  useFallbackChannelAvatar,
  useFallbackUserAvatar,
} from "../utils/imageFallback.js";

export default function Watch() {
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [library, setLibrary] = useState({
    watchLater: false,
    downloaded: false,
    inPlaylist: false,
    subscribed: false,
  });

  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    api
      .get(`/videos/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setVideo(data.video);
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setRelated(Array.isArray(data.related) ? data.related : []);
        setLibrary(
          data.library || {
            watchLater: false,
            downloaded: false,
            inPlaylist: false,
            subscribed: false,
          },
        );
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setVideo(null);
        setComments([]);
        setRelated([]);
        setError(err.response?.data?.message || "Video not found.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, user?.id]);

  const react = async (action) => {
    if (!user) return setError("Please sign in to like or dislike videos.");
    if (pending) return;
    setError("");
    setPending(true);

    try {
      const { data } = await api.put(`/videos/${id}/${action}`);
      setVideo((current) => ({
        ...current,
        likes: data.likes,
        dislikes: data.dislikes,
        viewerReaction: data.viewerReaction,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update reaction.");
    } finally {
      setPending(false);
    }
  };

  const updateLibrary = async (section, stateKey) => {
    if (!user) return setError("Please sign in to save videos.");
    if (pending) return;
    setPending(true);
    setError("");

    try {
      const request = library[stateKey] ? api.delete : api.put;
      const { data } = await request(`/library/${section}/${id}`);
      setLibrary((current) => ({ ...current, [stateKey]: data.active }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update your library.");
    } finally {
      setPending(false);
    }
  };

  const updateSubscription = async () => {
    if (!user) return setError("Please sign in to subscribe.");
    if (pending) return;
    const channelId = video.channelId?._id;
    if (!channelId) return setError("This channel is unavailable.");
    setPending(true);
    setError("");

    try {
      const request = library.subscribed ? api.delete : api.put;
      const { data } = await request(`/library/subscriptions/${channelId}`);
      setLibrary((current) => ({ ...current, subscribed: data.active }));
      setVideo((current) => ({
        ...current,
        channelId: { ...current.channelId, subscribers: data.subscribers },
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update subscription.");
    } finally {
      setPending(false);
    }
  };

  const saveComment = async (event) => {
    event.preventDefault();
    if (!user) return setError("Please sign in to comment.");
    if (!text.trim()) return setError("Comment text is required.");
    if (pending) return;
    setPending(true);
    setError("");

    try {
      if (editing) {
        const { data } = await api.put(`/comments/${editing}`, { text });
        setComments((items) =>
          items.map((item) => (item._id === editing ? data : item)),
        );
        setEditing(null);
      } else {
        const { data } = await api.post(`/videos/${id}/comments`, { text });
        setComments((items) => [data, ...items]);
      }
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save comment.");
    } finally {
      setPending(false);
    }
  };

  const removeComment = async (commentId) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((items) => items.filter((item) => item._id !== commentId));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete comment.");
    } finally {
      setPending(false);
    }
  };

  const startEdit = (comment) => {
    setEditing(comment._id);
    setText(comment.text);
  };

  const cancelEdit = () => {
    setEditing(null);
    setText("");
  };

  if (loading)
    return (
      <main className="watch-page">
        <div className="status">Loading video...</div>
      </main>
    );

  if (!video) {
    return (
      <main className="status-page">
        <h1>Video unavailable</h1>
        <p>{error || "The requested video could not be found."}</p>
        <Link className="primary-link" to="/">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="watch-page">
      <section className="watch-main">
        <section className="watch-content">
          <VideoPlayer
            key={video.videoUrl}
            url={video.videoUrl}
            poster={video.thumbnailUrl}
            title={video.title}
          />
          <h1>{video.title}</h1>
          <div className="watch-actions">
            <div className="channel-actions">
              <Link
                className="channel-chip"
                to={`/channel/${video.channelId?._id}`}
              >
                <img
                  src={video.channelId?.avatar || "/avatars/channel.svg"}
                  alt=""
                  onError={useFallbackChannelAvatar}
                />
                <span>
                  <strong>
                    {video.channelId?.channelName || "YouTube Creator"}
                  </strong>
                  <small>
                    {video.channelId?.subscribers?.toLocaleString() || 0}{" "}
                    subscribers
                  </small>
                </span>
              </Link>
              <button
                type="button"
                className={`subscribe-button ${library.subscribed ? "active" : ""}`}
                disabled={pending}
                aria-pressed={library.subscribed}
                onClick={updateSubscription}
              >
                <Bell size={18} />{" "}
                {library.subscribed ? "Subscribed" : "Subscribe"}
              </button>
            </div>
            <div className="video-action-groups">
              <div className="reaction-group" aria-label="Video reactions">
                <button
                  type="button"
                  className={video.viewerReaction === "like" ? "active" : ""}
                  disabled={pending}
                  aria-label="Like video"
                  aria-pressed={video.viewerReaction === "like"}
                  onClick={() => react("like")}
                >
                  <ThumbsUp size={18} /> {video.likes}
                </button>
                <button
                  type="button"
                  className={video.viewerReaction === "dislike" ? "active" : ""}
                  disabled={pending}
                  aria-label="Dislike video"
                  aria-pressed={video.viewerReaction === "dislike"}
                  onClick={() => react("dislike")}
                >
                  <ThumbsDown size={18} /> {video.dislikes}
                </button>
              </div>
              <div className="library-actions" aria-label="Save video">
                <button
                  type="button"
                  className={library.watchLater ? "active" : ""}
                  disabled={pending}
                  aria-pressed={library.watchLater}
                  onClick={() => updateLibrary("watch-later", "watchLater")}
                >
                  <Bookmark size={18} />{" "}
                  <span>{library.watchLater ? "Saved" : "Watch later"}</span>
                </button>
                <button
                  type="button"
                  className={library.inPlaylist ? "active" : ""}
                  disabled={pending}
                  aria-pressed={library.inPlaylist}
                  onClick={() => updateLibrary("playlists", "inPlaylist")}
                >
                  <ListPlus size={18} />{" "}
                  <span>{library.inPlaylist ? "In playlist" : "Playlist"}</span>
                </button>
                <button
                  type="button"
                  className={library.downloaded ? "active" : ""}
                  disabled={pending}
                  aria-pressed={library.downloaded}
                  onClick={() => updateLibrary("downloads", "downloaded")}
                >
                  <Download size={18} />{" "}
                  <span>{library.downloaded ? "Downloaded" : "Download"}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="description">
            <strong>
              {formatViews(video.views)} -{" "}
              {formatDate(video.uploadDate || video.createdAt)}
            </strong>
            <p>{video.description}</p>
          </div>

          <section className="comments">
            <h2>{comments.length} Comments</h2>
            <form className="comment-form" onSubmit={saveComment}>
              <input
                maxLength={1000}
                disabled={!user || pending}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={user ? "Add a comment..." : "Sign in to comment"}
                aria-label="Comment text"
              />
              {editing && (
                <button
                  type="button"
                  className="cancel-comment"
                  aria-label="Cancel edit"
                  onClick={cancelEdit}
                >
                  <X size={18} />
                </button>
              )}
              <button
                type="submit"
                disabled={!user || pending || !text.trim()}
                aria-label={editing ? "Update comment" : "Send comment"}
              >
                <Send size={18} />
              </button>
            </form>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {comments.map((comment) => {
              const ownerId =
                comment.userId?._id || comment.userId?.id || comment.userId;
              const isOwner = user?.id === ownerId;

              return (
                <article className="comment" key={comment._id}>
                  <img
                    src={comment.userId?.avatar || "/avatars/user.svg"}
                    alt=""
                    onError={useFallbackUserAvatar}
                  />
                  <div>
                    <strong>{comment.userId?.username || "Viewer"}</strong>
                    <time>
                      {formatDate(comment.createdAt || comment.timestamp)}
                    </time>
                    <p>{comment.text}</p>
                  </div>
                  {isOwner && (
                    <div className="comment-tools">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startEdit(comment)}
                        aria-label="Edit comment"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => removeComment(comment._id)}
                        aria-label="Delete comment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            {!comments.length && (
              <p className="muted">
                No comments yet. Start the conversation after signing in.
              </p>
            )}
          </section>
        </section>

        <aside className="related-videos" aria-label="Related videos">
          <h2>Related</h2>
          {related.map((item) => (
            <VideoCard key={item._id} video={item} compact />
          ))}
          {!related.length && <p className="muted">No related videos yet.</p>}
        </aside>
      </section>
    </main>
  );
}
