import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import type { UserRole } from "../../../api";

type Props = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  formError: string;
  submitting: boolean;
  setUsername: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRole: (value: UserRole) => void;
  onSubmit: (e: FormEvent) => void;
};

// ── Shared tokens (mirrors UserManagementSection) ─────────────────────────────

const font = "'DM Sans', sans-serif";

const ROLE_META: Record<UserRole, { bg: string; color: string; desc: string }> = {
  admin:   { bg: "#EEEDFE", color: "#3C3489", desc: "Full control over all settings and users." },
  analyst: { bg: "#E6F1FB", color: "#185FA5", desc: "Can review reports and analytics data." },
  viewer:  { bg: "#E1F5EE", color: "#0F6E56", desc: "Read-only access to tenant-facing data." },
};

// ── Reusable sub-components ───────────────────────────────────────────────────

function Pill({ value }: { value: UserRole }) {
  const cfg = ROLE_META[value];
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: "3px 10px",
      borderRadius: 20, background: cfg.bg, color: cfg.color,
      whiteSpace: "nowrap", fontFamily: font,
    }}>
      {value}
    </span>
  );
}

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        padding: "8px 11px", fontSize: 13, fontFamily: font,
        border: focused
          ? "0.5px solid #1D9E75"
          : "0.5px solid rgba(0,0,0,0.18)",
        borderRadius: 7, outline: "none",
        background: "#fff",
        color: "#111", width: "100%", boxSizing: "border-box",
        boxShadow: focused ? "0 0 0 3px rgba(29,158,117,0.1)" : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

// ── Page / background ─────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  fontFamily: font,
  position: "relative",
  minHeight: "100%",
};

const bgStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  backgroundImage: `
    linear-gradient(
      to bottom,
      rgba(245, 245, 243, 0.82) 0%,
      rgba(245, 245, 243, 0.93) 50%,
      rgba(245, 245, 243, 1)   100%
    ),
    url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=1400&q=80&auto=format&fit=crop")
  `,
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundRepeat: "no-repeat",
  pointerEvents: "none",
};

const innerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: 600,
  padding: "0 0 40px 0",
};

// ── Section header (identical pattern to UserManagement) ──────────────────────

const eyebrowStyle: CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary, #888)",
  marginBottom: 4,
};

const titleStyle: CSSProperties = {
  fontFamily: "'DM Serif Display', serif",
  fontSize: 22,
  color: "var(--color-text-primary, #111)",
  margin: 0,
};

// ── Metric summary cards ──────────────────────────────────────────────────────

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
  margin: "20px 0",
};

const metricCardStyle: CSSProperties = {
  background: "var(--color-background-secondary, #f5f5f3)",
  borderRadius: 8,
  padding: "12px 14px",
};

const metricLabelStyle: CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary, #888)",
  marginBottom: 4,
};

// ── Form card (mirrors the table card in UserManagement) ──────────────────────

const formCardStyle: CSSProperties = {
  background: "var(--color-background-primary, #fff)",
  border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
  borderRadius: 12,
  overflow: "hidden",
};

const formCardHeaderStyle: CSSProperties = {
  padding: "10px 14px",
  borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
  background: "var(--color-background-secondary, #f9f9f7)",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const formCardTitleStyle: CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary, #888)",
  margin: 0,
};

const formBodyStyle: CSSProperties = {
  padding: "20px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

// ── Field ─────────────────────────────────────────────────────────────────────

const fieldGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const labelStyle: CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-tertiary, #888)",
};

const helperStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-tertiary, #aaa)",
  margin: 0,
};

const dividerStyle: CSSProperties = {
  height: "0.5px",
  background: "var(--color-border-tertiary, rgba(0,0,0,0.08))",
  margin: "2px 0",
};

// ── Role pill-button row ──────────────────────────────────────────────────────

function RoleBadge({
  value, selected, onClick,
}: { value: UserRole; selected: boolean; onClick: () => void }) {
  const cfg = ROLE_META[value];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 1 auto",
        padding: "8px 12px",
        borderRadius: 7,
        border: selected
          ? `0.5px solid ${cfg.color}`
          : "0.5px solid rgba(0,0,0,0.15)",
        background: selected ? cfg.bg : "var(--color-background-secondary, #f5f5f3)",
        color: selected ? cfg.color : "var(--color-text-secondary, #555)",
        fontWeight: selected ? 600 : 400,
        fontSize: 13,
        fontFamily: font,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: selected ? `0 0 0 3px ${cfg.bg}` : "none",
      }}
    >
      {value}
    </button>
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────

const errorStyle: CSSProperties = {
  display: "flex", gap: 8, alignItems: "flex-start",
  padding: "9px 14px", borderRadius: 8, fontSize: 13,
  background: "#FCEBEB",
  border: "0.5px solid rgba(162,45,45,0.2)",
  color: "#A32D2D",
  fontFamily: font,
};

// ── Actions ───────────────────────────────────────────────────────────────────

const actionsRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 8,
  paddingTop: 4,
};

function SubmitBtn({ submitting }: { submitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 12, fontWeight: 500, fontFamily: font,
        padding: "7px 16px", borderRadius: 7,
        cursor: submitting ? "not-allowed" : "pointer",
        border: "0.5px solid #1D9E75",
        background: "#1D9E75", color: "#fff",
        opacity: submitting ? 0.5 : 1,
        transition: "opacity 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {submitting ? (
        <>
          <Spinner /> Creating…
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Create User
        </>
      )}
    </button>
  );
}

// ── Live preview row ──────────────────────────────────────────────────────────

function PreviewRow({
  username, email, role,
}: { username: string; email: string; role: UserRole }) {
  if (!username && !email) return null;

  const initials = username ? username.slice(0, 2).toUpperCase() : "??";
  const hue = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div style={{
      border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
      borderRadius: 10, overflow: "hidden",
      background: "var(--color-background-primary, #fff)",
      marginBottom: 16,
    }}>
      {/* Matches thead style from UserManagement table */}
      <div style={{
        padding: "10px 14px",
        background: "var(--color-background-secondary, #f9f9f7)",
        borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--color-text-tertiary, #888)",
      }}>
        Preview
      </div>
      {/* Matches tbody row style from UserManagement table */}
      <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: `hsl(${hue},40%,88%)`, color: `hsl(${hue},40%,35%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 500, fontFamily: font,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
            {username || <span style={{ color: "#ccc" }}>username</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-tertiary, #888)" }}>
            {email || <span style={{ color: "#ccc" }}>email</span>}
          </div>
        </div>
        <Pill value={role} />
        {/* Status pill matching UserManagement STATUS_STYLE active */}
        <span style={{
          fontSize: 11, fontWeight: 500, padding: "3px 10px",
          borderRadius: 20, background: "#EAF3DE", color: "#3B6D11",
          whiteSpace: "nowrap", fontFamily: font,
        }}>
          active
        </span>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateUserSection({
  username, email, password, role, formError, submitting,
  setUsername, setEmail, setPassword, setRole, onSubmit,
}: Props) {
  return (
    <div style={pageStyle}>
      <div style={bgStyle} />

      <div style={innerStyle}>

        {/* Section header — identical eyebrow + DM Serif Display title */}
        <div style={{ marginBottom: 0 }}>
          <div style={eyebrowStyle}>Administration</div>
          <h2 style={titleStyle}>Create User</h2>
        </div>

        {/* Metric strip — mirrors UserManagement's stat cards */}
        <div style={metricsGridStyle}>
          {[
            { label: "Fields",  value: "4",       color: "var(--color-text-primary, #111)" },
            { label: "Role",    value: role,       color: ROLE_META[role].color },
            { label: "Status",  value: "active",   color: "#3B6D11" },
          ].map(({ label, value, color }) => (
            <div key={label} style={metricCardStyle}>
              <div style={metricLabelStyle}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color, fontFamily: font }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Live preview — appears once user starts typing */}
        <PreviewRow username={username} email={email} role={role} />

        {/* Form card — same visual container as the users table */}
        <div style={formCardStyle}>
          <div style={formCardHeaderStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            <span style={formCardTitleStyle}>Account details</span>
          </div>

          <form onSubmit={onSubmit} style={formBodyStyle}>

            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="cu-username">Username</label>
              <FocusInput
                id="cu-username" type="text" placeholder="e.g. john.doe"
                value={username} onChange={(e) => setUsername(e.target.value)} required
              />
              <p style={helperStyle}>Used for login and identification.</p>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="cu-email">Email</label>
              <FocusInput
                id="cu-email" type="email" placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle} htmlFor="cu-password">Password</label>
              <FocusInput
                id="cu-password" type="password" placeholder="Choose a secure password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>

            <div style={dividerStyle} />

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Role</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["viewer", "analyst", "admin"] as UserRole[]).map((r) => (
                  <RoleBadge key={r} value={r} selected={role === r} onClick={() => setRole(r)} />
                ))}
              </div>
              <p style={helperStyle}>{ROLE_META[role].desc}</p>
            </div>

            {formError && (
              <div style={errorStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {formError}
              </div>
            )}

            <div style={actionsRowStyle}>
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary, #aaa)", fontFamily: font }}>
                User will be active immediately
              </span>
              <SubmitBtn submitting={submitting} />
            </div>

          </form>
        </div>

        {/* Footer hint — mirrors "Showing N of M users" in UserManagement */}
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary, #aaa)", marginTop: 10, textAlign: "right", fontFamily: font }}>
          New user will appear in User Management after creation
        </div>

      </div>
    </div>
  );
}