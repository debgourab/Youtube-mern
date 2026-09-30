import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../api.js";
import { useDispatch } from "react-redux";
import { videosApi } from "../store/videosApi.js";
import VideoPlayer from "../components/VideoPlayer.jsx";
import { resolveVideoSource, VIDEO_SOURCE_HELP } from "../utils/media.js";
import VideoCard from "../components/VideoCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { videoCategories } from "../utils/categories.js";
import { useFallbackChannelAvatar } from "../utils/imageFallback.js";

const blankChannel = { channelName: "", handle: "", description: "", channelBanner: "", avatar: "" };
const blankVideo = {
  title: "",
  thumbnailUrl: "",
  videoUrl: "",
  description: "",
  category: "React",
  duration: ""
};

export default function Channel({ studio = false }) {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState("");
  const [videosLoading, setVideosLoading] = useState(false);
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [channelForm, setChannelForm] = useState(blankChannel);
  const [settingsForm, setSettingsForm] = useState(blankChannel);
  const [videoForm, setVideoForm] = useState(blankVideo);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeChannelId = useMemo(() => studio ? channel?._id : id, [studio, channel, id]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api.get(studio ? "/channels/mine" : `/channels/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        if (studio) {
          setChannels(Array.isArray(data) ? data : []);
          setChannel(data[0] || null);
          setVideos([]);
        } else {
          setChannel(data.channel);
          setVideos(Array.isArray(data.videos) ? data.videos : []);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.response?.data?.message || "Could not load channel.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, studio]);

  useEffect(() => {
    if (!studio || !activeChannelId) return;
    const controller = new AbortController();
    setVideosLoading(true);
    setVideos([]);
    setEditing(null);
    setVideoForm(blankVideo);
    setPreview("");
    api.get(`/channels/${activeChannelId}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setVideos(Array.isArray(data.videos) ? data.videos : []);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.response?.data?.message || "Could not load channel videos.");
      })
      .finally(() => { if (!controller.signal.aborted) setVideosLoading(false); });
    return () => controller.abort();
  }, [activeChannelId, studio]);

  useEffect(() => {
    if (loading || location.hash !== "#videos") return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("channel-videos")?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, location.hash, videosLoading]);

  useEffect(() => {
    if (!channel) {
      setSettingsForm(blankChannel);
      return;
    }

    setSettingsForm({
      channelName: channel.channelName || "",
      handle: channel.handle || "",
      description: channel.description || "",
      channelBanner: channel.channelBanner || "",
      avatar: channel.avatar || ""
    });
  }, [channel]);

  const createChannel = async (event) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    try {
      const { data } = await api.post("/channels", channelForm);
      setChannels((items) => [data, ...items]);
      setChannel(data);
      setChannelForm(blankChannel);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create channel.");
    } finally { setPending(false); }
  };

  const updateChannel = async (event) => {
    event.preventDefault();
    if (pending) return;
    if (!activeChannelId) return;
    setError("");
    setPending(true);

    try {
      const { data } = await api.put(`/channels/${activeChannelId}`, settingsForm);
      setChannel(data);
      setChannels((items) => items.map((item) => (item._id === data._id ? data : item)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update channel.");
    } finally { setPending(false); }
  };

  const saveVideo = async (event) => {
    event.preventDefault();
    if (pending) return;
    if (!activeChannelId) return setError("Create or select a channel before adding videos.");
    if (!resolveVideoSource(videoForm.videoUrl)) return setError(VIDEO_SOURCE_HELP);
    setPending(true);
    setError("");

    try {
      if (editing) {
        const { data } = await api.put(`/videos/${editing}`, videoForm);
        setVideos((items) => items.map((item) => (item._id === editing ? data : item)));
      } else {
        const { data } = await api.post("/videos", { ...videoForm, channelId: activeChannelId });
        setVideos((items) => [data, ...items]);
      }
      dispatch(videosApi.util.invalidateTags(["Videos"]));
      setEditing(null);
      setPreview("");
      setVideoForm(blankVideo);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save video.");
    } finally { setPending(false); }
  };

  const editVideo = (video) => {
    setPreview("");
    setEditing(video._id);
    setVideoForm({
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: video.videoUrl,
      description: video.description,
      category: video.category,
      duration: video.duration || ""
    });
  };

  const deleteVideo = async (videoId) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api.delete(`/videos/${videoId}`);
      setVideos((items) => items.filter((item) => item._id !== videoId));
      dispatch(videosApi.util.invalidateTags(["Videos"]));
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete video.");
    } finally { setPending(false); }
  };

  const cancelEdit = () => {
    setPreview("");
    setEditing(null);
    setVideoForm(blankVideo);
  };

  if (loading) return <main className="channel-page"><div className="status">Loading channel...</div></main>;

  if (!channel && !studio) {
    return (
      <main className="status-page">
        <h1>Channel unavailable</h1>
        <p>{error || "The requested channel could not be found."}</p>
        <Link className="primary-link" to="/">Back to Home</Link>
      </main>
    );
  }

  return (
    <main className="channel-page">
      {error && <p className="form-error notice" role="alert">{error}</p>}
      {channel && (
        <section className="channel-hero">
          <img src={channel.channelBanner} alt="" />
          <div className="channel-info">
            <img src={channel.avatar || "/avatars/channel.svg"} alt="" onError={useFallbackChannelAvatar} />
            <div>
              <h1>{channel.channelName}</h1>
              {channel.handle && <span className="channel-handle">@{channel.handle}</span>}
              <p>{channel.description}</p>
              <span>{channel.subscribers?.toLocaleString()} subscribers</span>
            </div>
          </div>
        </section>
      )}

      {studio && (
        <section className="studio-panel">
          <div className="panel-column">
            <h2>Create channel</h2>
            <form onSubmit={createChannel} className="stack-form"><fieldset disabled={pending}>
              <label>
                Channel name
                <input value={channelForm.channelName} onChange={(event) => setChannelForm({ ...channelForm, channelName: event.target.value })} required />
              </label>
              <label>
                Handle
                <input value={channelForm.handle} onChange={(event) => setChannelForm({ ...channelForm, handle: event.target.value })} placeholder="codewithdeb" />
              </label>
              <label>
                Description
                <textarea value={channelForm.description} onChange={(event) => setChannelForm({ ...channelForm, description: event.target.value })} required />
              </label>
              <label>
                Banner image URL
                <input value={channelForm.channelBanner} onChange={(event) => setChannelForm({ ...channelForm, channelBanner: event.target.value })} placeholder="https://..." />
              </label>
              <label>
                Avatar URL
                <input value={channelForm.avatar} onChange={(event) => setChannelForm({ ...channelForm, avatar: event.target.value })} placeholder="https://... or /avatars/channel.svg" />
              </label>
              <button className="primary"><Plus size={18} /> Create channel</button>
            </fieldset></form>
          </div>

          <div className="panel-column">
            <h2>Channel settings</h2>
            {channel ? (
              <form onSubmit={updateChannel} className="stack-form"><fieldset disabled={pending}>
                <label>
                  Active channel
                  <select value={activeChannelId || ""} onChange={(event) => setChannel(channels.find((item) => item._id === event.target.value))}>
                    {channels.map((item) => <option key={item._id} value={item._id}>{item.channelName}</option>)}
                  </select>
                </label>
                <label>
                  Channel name
                  <input value={settingsForm.channelName} onChange={(event) => setSettingsForm({ ...settingsForm, channelName: event.target.value })} required />
                </label>
                <label>
                  Handle
                  <input value={settingsForm.handle} onChange={(event) => setSettingsForm({ ...settingsForm, handle: event.target.value })} />
                </label>
                <label>
                  Description
                  <textarea value={settingsForm.description} onChange={(event) => setSettingsForm({ ...settingsForm, description: event.target.value })} required />
                </label>
                <label>
                  Banner image URL
                  <input value={settingsForm.channelBanner} onChange={(event) => setSettingsForm({ ...settingsForm, channelBanner: event.target.value })} />
                </label>
                <label>
                  Avatar URL
                  <input value={settingsForm.avatar} onChange={(event) => setSettingsForm({ ...settingsForm, avatar: event.target.value })} />
                </label>
                <button className="primary"><Edit2 size={18} /> Save channel</button>
              </fieldset></form>
            ) : (
              <p className="muted">Create a channel before publishing videos.</p>
            )}
          </div>

          <div className="panel-column wide">
            <h2>{editing ? "Edit video" : "Publish a video"}</h2>
            <form onSubmit={saveVideo} className="stack-form">
              <fieldset disabled={!activeChannelId || pending || videosLoading}>
                <label>
                  Title
                  <input minLength={3} maxLength={120} value={videoForm.title} onChange={(event) => setVideoForm({ ...videoForm, title: event.target.value })} required />
                </label>
                <label>
                  Thumbnail URL
                  <input type="url" value={videoForm.thumbnailUrl} onChange={(event) => setVideoForm({ ...videoForm, thumbnailUrl: event.target.value })} required />
                </label>
                <label>
                  Video URL
                  <input type="url" aria-describedby="video-url-help" value={videoForm.videoUrl} onChange={(event) => { setVideoForm({ ...videoForm, videoUrl: event.target.value }); setPreview(""); }} required />
                </label>
                <p id="video-url-help" className="muted">{VIDEO_SOURCE_HELP}</p>
                <button type="button" className="secondary" disabled={!resolveVideoSource(videoForm.videoUrl)} onClick={() => setPreview(videoForm.videoUrl)}>Preview video</button>
                {preview && <VideoPlayer key={preview} url={preview} poster={videoForm.thumbnailUrl} title="Video preview" />}
                <div className="form-row">
                  <label>
                    Category
                    <select value={videoForm.category} onChange={(event) => setVideoForm({ ...videoForm, category: event.target.value })}>
                      {videoCategories.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label>
                    Duration
                    <input value={videoForm.duration} onChange={(event) => setVideoForm({ ...videoForm, duration: event.target.value })} placeholder="12:48" />
                  </label>
                </div>
                <label>
                  Description
                  <textarea minLength={10} maxLength={2000} value={videoForm.description} onChange={(event) => setVideoForm({ ...videoForm, description: event.target.value })} required />
                </label>
                <div className="form-actions">
                  <button className="primary">{editing ? <Edit2 size={18} /> : <Plus size={18} />} {editing ? "Update video" : "Add video"}</button>
                  {editing && <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>}
                </div>
              </fieldset>
            </form>
          </div>
        </section>
      )}

      <section className="channel-videos" id="channel-videos">
        <h2>{studio ? "Your videos" : "Videos"}</h2>
        {videosLoading && <p className="status" role="status">Loading channel videos…</p>}
        <div className="video-grid">
          {videos.map((video) => (
            <div className="managed-video" key={video._id}>
              <VideoCard video={{ ...video, channelId: video.channelId || channel }} />
              {studio && (
                <div className="manage-tools">
                  <button type="button" disabled={pending} onClick={() => editVideo(video)}><Edit2 size={16} /> Edit</button>
                  <button type="button" disabled={pending} onClick={() => deleteVideo(video._id)}><Trash2 size={16} /> Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!videosLoading && !videos.length && <p className="status">{studio && user ? "Create a channel and add your first video." : "This channel has no videos yet."}</p>}
      </section>
    </main>
  );
}
