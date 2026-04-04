import { useState } from "react";

type LoginPageProps = {
  onLogin: (username: string, password: string) => void;
  loading: boolean;
  error: string;
};

export default function LoginPage({ onLogin, loading, error }: LoginPageProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Login</h1>
        <p style={{ marginBottom: 20, color: "#666" }}>
          Sign in to access the finance dashboard
        </p>

        <label style={{ display: "block", marginBottom: 8 }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          style={inputStyle}
        />

        <label style={{ display: "block", marginBottom: 8 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "red", marginTop: 8, marginBottom: 8 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "none",
            borderRadius: 8,
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
            marginTop: 12,
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <div style={{ marginTop: 16, fontSize: 14, color: "#666" }}>
          Demo users:
          <div>admin / admin123</div>
          <div>analyst / analyst123</div>
          <div>viewer / viewer123</div>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 16,
  borderRadius: 8,
  border: "1px solid #ccc",
  outline: "none",
};