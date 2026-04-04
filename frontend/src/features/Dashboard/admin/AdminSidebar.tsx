export type DashboardSection =
  | "overview"
  | "create-user"
  | "manage-users"
  | "create-record"
  | "records";

type User = {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

type Props = {
  user: User;
  activeSection: DashboardSection;
  onChangeSection: (section: DashboardSection) => void;
  onLogout: () => void;
};

const font = "'DM Sans', sans-serif";

const NAV_ITEMS: { section: DashboardSection; label: string; icon: React.ReactNode }[] = [
  {
    section: "overview",
    label: "Overview",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    section: "create-user",
    label: "Create User",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" /><line x1="16" y1="11" x2="22" y2="11" />
      </svg>
    ),
  },
  {
    section: "manage-users",
    label: "User Management",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    section: "create-record",
    label: "Create Record",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    section: "records",
    label: "Records",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
];

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  admin:   { bg: "rgba(238,237,254,0.15)", color: "#c4c1f9" },
  analyst: { bg: "rgba(230,241,251,0.15)", color: "#93c5fd" },
  viewer:  { bg: "rgba(225,245,238,0.15)", color: "#6ee7b7" },
};

function Avatar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
      background: "rgba(29,158,117,0.25)", color: "#6ee7b7",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 500, fontFamily: font,
    }}>
      {initials}
    </div>
  );
}

export default function AdminSidebar({ user, activeSection, onChangeSection, onLogout }: Props) {
  const roleStyle = ROLE_STYLE[user.role] ?? ROLE_STYLE.viewer;

  return (
    <aside style={{
      width: 224,
      minWidth: 224,
      minHeight: "100vh",
      background: "#0f1a16",
      display: "flex",
      flexDirection: "column",
      padding: "24px 14px",
      boxSizing: "border-box",
      fontFamily: font,
    }}>

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: "rgba(29,158,117,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#f0fdf4", letterSpacing: "0.01em" }}>
            RentAdmin
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Dashboard
          </div>
        </div>
      </div>

      {/* User card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.05)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 10, padding: "10px 12px", marginBottom: 24,
      }}>
        <Avatar username={user.username} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "#f0fdf4",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {user.username}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 500, padding: "1px 8px",
            borderRadius: 20, background: roleStyle.bg, color: roleStyle.color,
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Nav label */}
      <div style={{
        fontSize: 10, fontWeight: 500, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
        marginBottom: 6, paddingLeft: 6,
      }}>
        Navigation
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(({ section, label, icon }) => {
          const isActive = activeSection === section;
          return (
            <button
              key={section}
              type="button"
              onClick={() => onChangeSection(section)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 12px",
                border: "none", borderRadius: 8, cursor: "pointer",
                fontFamily: font, fontSize: 13, fontWeight: isActive ? 500 : 400,
                textAlign: "left",
                background: isActive ? "rgba(29,158,117,0.18)" : "transparent",
                color: isActive ? "#6ee7b7" : "rgba(255,255,255,0.55)",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                }
              }}
            >
              {/* Active indicator bar */}
              <span style={{
                width: 3, height: 16, borderRadius: 2, flexShrink: 0,
                background: isActive ? "#1D9E75" : "transparent",
                transition: "background 0.15s",
              }} />
              <span style={{ display: "flex", alignItems: "center", opacity: isActive ? 1 : 0.7 }}>
                {icon}
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", margin: "16px 0" }} />

      {/* Logout */}
      <button
        type="button"
        onClick={onLogout}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "9px 12px",
          border: "0.5px solid rgba(162,45,45,0.35)", borderRadius: 8, cursor: "pointer",
          fontFamily: font, fontSize: 13, fontWeight: 400, textAlign: "left",
          background: "rgba(162,45,45,0.1)", color: "#fca5a5",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(162,45,45,0.2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(162,45,45,0.1)"; }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>

    </aside>
  );
}