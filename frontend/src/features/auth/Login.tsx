import { useState, useEffect } from "react";

type LoginPageProps = {
  onLogin: (username: string, password: string) => void;
  loading: boolean;
  error: string;
};

function loadFont(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

const DEMO_USERS = [
  { username: "admin", password: "admin123", role: "Admin" },
  { username: "analyst", password: "analyst123", role: "Analyst" },
  { username: "viewer", password: "viewer123", role: "Viewer" },
];

export default function LoginPage({ onLogin, loading, error }: LoginPageProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    loadFont(
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap"
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%",
    padding: "10px 13px",
    fontSize: 14,
    border: `0.5px solid ${focused === name ? "#1D9E75" : "rgba(0,0,0,0.18)"}`,
    borderRadius: 8,
    outline: "none",
    background: "#fff",
    color: "#111",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f2f1ee",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#E1F5EE",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26,
              lineHeight: 1.2,
              color: "#111",
            }}
          >
            Welcome <em style={{ fontStyle: "italic", color: "#1D9E75" }}>back.</em>
          </div>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
            Sign in to access your rental dashboard
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: 16,
            padding: "28px 28px 24px",
          }}
        >
          {/* Quote */}
          <div
            style={{
              borderLeft: "3px solid #1D9E75",
              borderRadius: "0 6px 6px 0",
              background: "#f7faf8",
              padding: "10px 14px",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontStyle: "italic",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#555",
                margin: 0,
              }}
            >
              "Home is where your story begins."
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#888",
                  marginBottom: 6,
                }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={inputStyle("username")}
                onFocus={() => setFocused("username")}
                onBlur={() => setFocused(null)}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 4 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#888",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={inputStyle("password")}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: "9px 13px",
                  background: "#FCEBEB",
                  border: "0.5px solid rgba(162,45,45,0.2)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#A32D2D",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 16px",
                marginTop: 20,
                border: "none",
                borderRadius: 8,
                background: loading ? "#9FE1CB" : "#1D9E75",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                letterSpacing: "0.01em",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Demo users */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#aaa",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Demo accounts
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {DEMO_USERS.map(({ username: u, password: p, role }) => (
              <button
                key={u}
                type="button"
                onClick={() => { setUsername(u); setPassword(p); }}
                style={{
                  background: "#fff",
                  border: "0.5px solid rgba(0,0,0,0.12)",
                  borderRadius: 10,
                  padding: "10px 8px",
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#1D9E75")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)")}
              >
                <div style={{ fontSize: 11, fontWeight: 500, color: "#0F6E56", marginBottom: 2 }}>
                  {role}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>{u}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{p}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: 10 }}>
            Click a card to auto-fill credentials
          </p>
        </div>

      </div>
    </div>
  );
}