import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { passwordRules, validatePassword } from "../utils/password.js";

const initial = { username: "", email: "", identifier: "", password: "" };

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { user, initializing, login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const destination =
    typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    from !== "/auth"
      ? from
      : "/";
  const update = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });

  if (initializing)
    return (
      <div className="status" role="status">
        Checking your session…
      </div>
    );
  if (user) return <Navigate to={destination} replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    if (mode === "register" && validatePassword(form.password))
      return setError(validatePassword(form.password));
    try {
      if (mode === "register") {
        await register({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        setMode("login");
        setShowPassword(false);
        setForm({ ...initial, identifier: form.email });
        setSuccess("Account created. Sign in to get started.");
      } else {
        await login({
          identifier: form.identifier.trim(),
          password: form.password,
        });
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">
          <span className="auth-logo">YT</span>
          <span>YouTube</span>
        </div>
        <h1>{mode === "login" ? "Welcome" : "Create your account"}</h1>
        <p>
          {mode === "login"
            ? "Your favourites. New discoveries. All in one place. Sign in and find your next favourite video."
            : "Discover new favourites, share your stories, and join the conversation."}
        </p>
        {mode === "register" && (
          <label>
            Username
            <input
              autoComplete="username"
              value={form.username}
              onChange={update("username")}
              minLength={3}
              maxLength={32}
              required
            />
          </label>
        )}
        {mode === "register" ? (
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update("email")}
              required
            />
          </label>
        ) : (
          <label>
            Email
            <input
              autoComplete="username"
              value={form.identifier}
              onChange={update("identifier")}
              required
            />
          </label>
        )}
        <label htmlFor="password">Password</label>
        <div className="password-field">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            value={form.password}
            onChange={update("password")}
            minLength={8}
            required
            aria-describedby={
              mode === "register" ? "password-rules" : undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {mode === "register" && (
          <ul id="password-rules" className="password-rules">
            {passwordRules.map((rule) => (
              <li
                key={rule.label}
                className={rule.test(form.password) ? "met" : ""}
              >
                <span aria-hidden="true">
                  {rule.test(form.password) ? "✓" : "○"}
                </span>{" "}
                {rule.label}
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="form-success" role="status">
            {success}
          </p>
        )}
        <button className="primary" disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={loading}
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setSuccess("");
            setShowPassword(false);
            setForm(initial);
          }}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}
