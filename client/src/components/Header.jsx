import {
  Bell,
  Camera,
  LogOut,
  Mail,
  Menu,
  Mic,
  Play,
  Plus,
  Search,
  User,
  UserCircle,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFallbackUserAvatar } from "../utils/imageFallback.js";

export default function Header({ expanded, onToggle }) {
  const { user, logout, updateProfile } = useAuth();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("search") || "");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");

  const recognitionRef = useRef(null);
  const notificationRef = useRef(null);
  const bellRef = useRef(null);
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);
  const avatarInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setQuery(params.get("search") || "");
  }, [params]);

  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
    setProfileMessage("");
    setProfileError("");
  }, [location, user?.id]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const closeOutside = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        bellRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!profileOpen) return;

    const closeOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;

      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    };
  }, []);

  const onSearch = (event) => {
    event.preventDefault();

    const search = query.trim();
    const next = new URLSearchParams();
    const currentCategory = params.get("category");

    if (search) next.set("search", search);

    if (location.pathname === "/" && currentCategory) {
      next.set("category", currentCategory);
    }

    navigate(next.toString() ? `/?${next.toString()}` : "/");
  };

  const onVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setVoiceMessage("Voice search stopped.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage(
        "Voice search is unavailable in this browser. Please type your search."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      setQuery(transcript);
      setVoiceMessage("Voice captured. Press Search to see results.");
    };

    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Allow microphone access to use voice search.",
        "audio-capture": "No microphone is available.",
        "no-speech": "No speech detected. Please try again.",
        network: "Voice search could not connect. Please try again.",
      };

      setVoiceMessage(
        messages[event.error] || "Voice search failed. Please try again."
      );
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setVoiceMessage((message) =>
        message === "Listening… Speak now."
          ? "Listening finished. Try again if no text appeared."
          : message
      );
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
      setVoiceMessage("Listening… Speak now.");
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setVoiceMessage("Could not start voice search. Please try again.");
    }
  };

  const onAvatarSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setProfileMessage("");
    setProfileError("");

    if (!file.type.startsWith("image/")) {
      setProfileError("Choose an image file from your device.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setProfileError("Choose an image that is 1 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    setAvatarSaving(true);

    reader.onload = async () => {
      const avatar = typeof reader.result === "string" ? reader.result : "";

      try {
        await updateProfile({ avatar });
        setProfileMessage("Profile picture updated.");
      } catch (err) {
        setProfileError(
          typeof err === "string"
            ? err
            : "Could not update your profile picture."
        );
      } finally {
        setAvatarSaving(false);
      }
    };

    reader.onerror = () => {
      setAvatarSaving(false);
      setProfileError("Could not read that image file.");
    };

    reader.readAsDataURL(file);
  };

  return (
    <header className="header light-header">
      <div className="lh-brand-row">
        <button
          type="button"
          className="lh-icon"
          id="menu-toggle"
          aria-label="Toggle sidebar"
          aria-controls="site-sidebar"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <Menu size={22} />
        </button>

        <Link className="lh-brand" to="/" aria-label="YouTube home">
          <span className="lh-play">
            <Play size={18} fill="white" strokeWidth={0} />
          </span>
          <span className="lh-brand-name">YouTube</span>
          <sup>IN</sup>
        </Link>
      </div>

      <div className="lh-search-area">
        <form className="lh-search" onSubmit={onSearch} role="search">
          <input
            type="search"
            name="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search videos by title"
          />

          <button type="submit" aria-label="Search">
            <Search size={22} />
          </button>
        </form>

        <button
          type="button"
          className={`lh-icon lh-mic ${listening ? "is-listening" : ""}`}
          onClick={onVoiceSearch}
          aria-label={listening ? "Stop voice search" : "Search with your voice"}
          aria-pressed={listening}
          title={listening ? "Stop listening" : "Search with your voice"}
        >
          <Mic size={21} />
        </button>

        {voiceMessage && (
          <div className="lh-voice-message">
            <span role="status">{voiceMessage}</span>
            <button
              type="button"
              className="lh-icon"
              onClick={() => setVoiceMessage("")}
              aria-label="Dismiss voice search message"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="lh-account">
        <Link
          className="lh-create"
          to={user ? "/studio" : "/auth"}
          aria-label={user ? "Create or manage videos" : "Sign in to create videos"}
        >
          <Plus size={22} />
          <span>Create</span>
        </Link>

        <div className="lh-notifications" ref={notificationRef}>
          <button
            ref={bellRef}
            type="button"
            className="lh-icon"
            onClick={() => {
              setProfileOpen(false);
              setNotificationsOpen((open) => !open);
            }}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls="header-notifications"
            title="Notifications"
          >
            <Bell size={22} />
          </button>

          {notificationsOpen && (
            <section
              id="header-notifications"
              className="lh-notification-panel"
              aria-label="Notifications"
            >
              <div className="lh-panel-heading">
                <h2>Notifications</h2>
                <button
                  type="button"
                  className="lh-icon"
                  aria-label="Close notifications"
                  onClick={() => {
                    setNotificationsOpen(false);
                    bellRef.current?.focus();
                  }}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="lh-empty">
                <Bell size={32} aria-hidden="true" />
                <strong>
                  {user ? "No notifications to display" : "Stay in the loop"}
                </strong>
                <p>
                  {user
                    ? "There are no updates available here."
                    : "Sign in to access your account."}
                </p>
                {!user && <Link to="/auth">Sign in</Link>}
              </div>
            </section>
          )}
        </div>

        {user ? (
          <div className="lh-profile" ref={profileRef}>
            <button
              ref={profileButtonRef}
              type="button"
              className="lh-avatar-button"
              aria-label="Open account menu"
              aria-expanded={profileOpen}
              aria-controls="header-profile-menu"
              onClick={() => {
                setNotificationsOpen(false);
                setProfileOpen((open) => !open);
              }}
            >
              <img
                src={user.avatar || "/avatars/user.svg"}
                alt=""
                className="lh-avatar"
                onError={useFallbackUserAvatar}
              />
            </button>

            {profileOpen && (
              <section
                id="header-profile-menu"
                className="lh-profile-panel"
                aria-label="Account"
              >
                <div className="lh-profile-card">
                  <img
                    src={user.avatar || "/avatars/user.svg"}
                    alt=""
                    className="lh-profile-avatar"
                    onError={useFallbackUserAvatar}
                  />
                  <div className="lh-profile-copy">
                    <strong>{user.username || "Signed in user"}</strong>
                    <span>
                      <Mail size={15} aria-hidden="true" />
                      {user.email}
                    </span>
                  </div>
                </div>

                <div className="lh-profile-actions">
                  <input
                    ref={avatarInputRef}
                    className="lh-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={onAvatarSelected}
                  />
                  <button
                    type="button"
                    className="lh-profile-action"
                    disabled={avatarSaving}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={18} aria-hidden="true" />
                    <span>{avatarSaving ? "Uploading..." : "Change picture"}</span>
                  </button>
                  <Link
                    className="lh-profile-action"
                    to="/studio"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={18} aria-hidden="true" />
                    <span>Your channel</span>
                  </Link>
                  <button
                    type="button"
                    className="lh-profile-action danger"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={18} aria-hidden="true" />
                    <span>Log out</span>
                  </button>
                  {profileMessage && (
                    <p className="lh-profile-status" role="status">
                      {profileMessage}
                    </p>
                  )}
                  {profileError && (
                    <p className="lh-profile-error" role="alert">
                      {profileError}
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        ) : (
          <Link className="lh-signin" to="/auth">
            <UserCircle size={20} />
            <span>Sign in</span>
          </Link>
        )}
      </div>
    </header>
  );
}
