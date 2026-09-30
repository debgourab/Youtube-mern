import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api.js";
import VideoCard from "../components/VideoCard.jsx";
import { useFallbackChannelAvatar } from "../utils/imageFallback.js";

const validSections = new Set([
  "history",
  "playlists",
  "watch-later",
  "liked-videos",
  "downloads",
  "subscriptions"
]);

export default function Library({ section: fixedSection }) {
  const params = useParams();
  const section = fixedSection || params.section;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!validSections.has(section)) {
      setError("Library section not found.");
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    api.get(`/library/${section}`, { signal: controller.signal })
      .then(({ data: result }) => setData(result))
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || "Could not load this section.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [section]);

  useEffect(() => load(), [load]);

  if (loading) return <main className="content library-page"><div className="status">Loading library...</div></main>;

  if (error) {
    return (
      <main className="content library-page">
        <div className="status error-state" role="alert">
          <h1>Could not open this menu</h1>
          <p>{error}</p>
          <button type="button" className="secondary" onClick={load}>Try again</button>
        </div>
      </main>
    );
  }

  const videos = data?.videos || [];
  const channels = data?.channels || [];

  return (
    <main className="content library-page">
      <header className="library-heading">
        <p className="eyebrow">Your library</p>
        <h1>{data?.title}</h1>
        <p>{videos.length} {videos.length === 1 ? "video" : "videos"}</p>
      </header>

      {channels.length > 0 && (
        <section className="subscription-channels" aria-label="Subscribed channels">
          {channels.map((channel) => (
            <Link key={channel._id} to={`/channel/${channel._id}`} className="subscription-channel">
              <img src={channel.avatar || "/avatars/channel.svg"} alt="" onError={useFallbackChannelAvatar} />
              <span>
                <strong>{channel.channelName}</strong>
                <small>{channel.subscribers?.toLocaleString() || 0} subscribers</small>
              </span>
            </Link>
          ))}
        </section>
      )}

      {videos.length > 0 ? (
        <div className="video-grid">
          {videos.map((video) => <VideoCard key={video._id} video={video} />)}
        </div>
      ) : (
        <div className="status empty-state">
          <h2>Nothing here yet</h2>
          <p>Use the controls on a video to add items to this section.</p>
          <Link className="primary-link" to="/">Browse videos</Link>
        </div>
      )}
    </main>
  );
}
