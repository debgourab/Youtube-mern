import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Home,
  UserCircle,
  History,
  ListVideo,
  Clock,
  ThumbsUp,
  Video,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ShoppingBag,
  Music,
  Clapperboard,
  TrendingUp,
  Radio,
  Gamepad2,
  Newspaper,
  Trophy,
  GraduationCap,
  Podcast,
  Grid3X3,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const personalItems = [
  { label: "Your channel", icon: UserCircle, to: "/studio" },
  { label: "History", icon: History, to: "/library/history" },
  { label: "Playlists", icon: ListVideo, to: "/library/playlists" },
  { label: "Watch later", icon: Clock, to: "/library/watch-later" },
  { label: "Liked videos", icon: ThumbsUp, to: "/library/liked-videos" },
  { label: "Your videos", icon: Video, to: "/studio#videos" },
  { label: "Downloads", icon: Download, to: "/library/downloads" },
];

const exploreItems = [
  { label: "Shopping", icon: ShoppingBag, search: "shopping" },
  { label: "Music", icon: Music, search: "music" },
  { label: "Movies & TV", icon: Clapperboard, search: "movies" },
  { label: "Hype", icon: TrendingUp, search: "trending" },
  { label: "Live", icon: Radio, search: "live" },
  { label: "Gaming", icon: Gamepad2, search: "gaming" },
  { label: "News", icon: Newspaper, search: "news" },
  { label: "Sports", icon: Trophy, search: "sports" },
  { label: "Courses", icon: GraduationCap, search: "courses" },
  { label: "Podcasts", icon: Podcast, search: "podcasts" },
  { label: "Playables", icon: Grid3X3, search: "games" },
];

export default function Sidebar({ overlay = false, onClose }) {
  return (
    <>
      {overlay && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}
      <aside
        id="site-sidebar"
        className={`sidebar ${overlay ? "drawer" : ""}`.trim()}
        aria-label="Sidebar"
      >
        {overlay && (
          <div className="drawer-heading">
            <strong>YouTube</strong>
            <button
              type="button"
              className="lh-icon"
              aria-label="Close sidebar"
              onClick={onClose}
            >
              <X size={19} />
            </button>
          </div>
        )}
        <SidebarContent onNavigate={overlay ? onClose : undefined} />
      </aside>
    </>
  );
}

function SidebarContent({ onNavigate }) {
  const { user } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();

  const [showMore, setShowMore] = useState(false);

  const visiblePersonalItems = showMore
    ? personalItems
    : personalItems.slice(0, 5);

  const isHome =
    location.pathname === "/" &&
    !params.get("search") &&
    !params.get("category");

  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <nav className="yt-side-content" aria-label="Main navigation">
      <div className="yt-side-section">
        <Link
          to="/"
          className={`yt-side-link ${isHome ? "is-active" : ""}`}
          aria-current={isHome ? "page" : undefined}
          onClick={handleNavigate}
          title="Home"
        >
          <Home size={22} aria-hidden="true" />
          <span className="yt-side-label">Home</span>
        </Link>
        <Link
          to="/shorts"
          className={`yt-side-link ${
            location.pathname === "/shorts"
              ? "is-active"
              : ""
          }`}
          aria-current={location.pathname === "/shorts" ? "page" : undefined}
          onClick={handleNavigate}
          title="Shorts"
        >
          <Clapperboard size={22} aria-hidden="true" />
          <span className="yt-side-label">Shorts</span>
        </Link>
        <Link
          to={user ? "/subscriptions" : "/auth"}
          className={`yt-side-link ${
            location.pathname === "/subscriptions"
              ? "is-active"
              : ""
          }`}
          aria-current={location.pathname === "/subscriptions" ? "page" : undefined}
          onClick={handleNavigate}
          title="Subscriptions"
        >
          <ListVideo size={22} aria-hidden="true" />
          <span className="yt-side-label">Subscriptions</span>
        </Link>
      </div>

      <section className="yt-side-section" aria-labelledby="sidebar-you-title">
        <h2 id="sidebar-you-title" className="yt-side-heading">
          You
          <ChevronRight size={17} aria-hidden="true" />
        </h2>

        <div id="sidebar-personal-items">
          {visiblePersonalItems.map(({ label, icon: Icon, to }) => {
            // Signed-out visitors go to the existing login page.
            const destination = !user ? "/auth" : to;

            const active = Boolean(user && to) &&
              `${location.pathname}${location.hash}` === to;
            return (
              <Link
                key={label}
                to={destination}
                className={`yt-side-link ${active ? "is-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={handleNavigate}
                title={label}
              >
                <Icon size={22} aria-hidden="true" />
                <span className="yt-side-label">{label}</span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="yt-side-link"
          aria-expanded={showMore}
          aria-controls="sidebar-personal-items"
          onClick={() => setShowMore((value) => !value)}
          title={showMore ? "Show less" : "Show more"}
        >
          {showMore ? (
            <ChevronUp size={22} aria-hidden="true" />
          ) : (
            <ChevronDown size={22} aria-hidden="true" />
          )}
          <span className="yt-side-label">
            {showMore ? "Show less" : "Show more"}
          </span>
        </button>

      </section>

      <section
        className="yt-side-section"
        aria-labelledby="sidebar-explore-title"
      >
        <h2 id="sidebar-explore-title" className="yt-side-heading">
          Explore
        </h2>

        {exploreItems.map(({ label, icon: Icon, search }) => {
          const active =
            location.pathname === "/" &&
            params.get("search") === search;

          return (
            <Link
              key={label}
              to={`/?search=${encodeURIComponent(search)}`}
              className={`yt-side-link ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={handleNavigate}
              title={label}
            >
              <Icon size={22} aria-hidden="true" />
              <span className="yt-side-label">{label}</span>
            </Link>
          );
        })}
      </section>
    </nav>
  );
}
