import { useMemo, useState } from "react";
import type { ApiUser, UserRole, UserStatus } from "../../../api";

type Props = {
  users: ApiUser[];
  usersError: string;
  currentUserId: number;
  editingUserId: number | null;
  editEmail: string;
  editRole: UserRole;
  editStatus: UserStatus;
  editPassword: string;
  setEditEmail: (value: string) => void;
  setEditRole: (value: UserRole) => void;
  setEditStatus: (value: UserStatus) => void;
  setEditPassword: (value: string) => void;
  startEdit: (user: ApiUser) => void;
  cancelEdit: () => void;
  handleSaveEdit: (id: number) => void;
  handleDeleteUser: (id: number) => void;
};

// ── Shared tokens ────────────────────────────────────────────────────────────

const font = "'DM Sans', sans-serif";

const ROLE_STYLE: Record<UserRole, { bg: string; color: string }> = {
  admin:   { bg: "#EEEDFE", color: "#3C3489" },
  analyst: { bg: "#E6F1FB", color: "#185FA5" },
  viewer:  { bg: "#E1F5EE", color: "#0F6E56" },
};

const STATUS_STYLE: Record<UserStatus, { bg: string; color: string }> = {
  active:   { bg: "#EAF3DE", color: "#3B6D11" },
  inactive: { bg: "#F1EFE8", color: "#5F5E5A" },
};

function Pill({ value, map }: { value: string; map: Record<string, { bg: string; color: string }> }) {
  const cfg = map[value] ?? { bg: "#F1EFE8", color: "#5F5E5A" };
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

const inlineInput: React.CSSProperties = {
  padding: "6px 10px", fontSize: 13, fontFamily: font,
  border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 7,
  outline: "none", background: "#fff", color: "#111",
  width: "100%", boxSizing: "border-box",
};

const inlineSelect: React.CSSProperties = { ...inlineInput, cursor: "pointer" };

function ActionBtn({
  label, onClick, variant, disabled,
}: {
  label: string;
  onClick: () => void;
  variant: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, fontFamily: font,
    padding: "5px 13px", borderRadius: 7, cursor: disabled ? "not-allowed" : "pointer",
    border: "0.5px solid", opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  };
  const variants = {
    primary:   { background: "#1D9E75", color: "#fff",    borderColor: "#1D9E75" },
    secondary: { background: "#fff",    color: "#555",    borderColor: "rgba(0,0,0,0.18)" },
    danger:    { background: "#FCEBEB", color: "#A32D2D", borderColor: "rgba(162,45,45,0.2)" },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {label}
    </button>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────

function Avatar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  const hue = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},40%,88%)`, color: `hsl(${hue},40%,35%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 500, fontFamily: font,
    }}>
      {initials}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UserManagementSection({
  users, usersError, currentUserId,
  editingUserId, editEmail, editRole, editStatus, editPassword,
  setEditEmail, setEditRole, setEditStatus, setEditPassword,
  startEdit, cancelEdit, handleSaveEdit, handleDeleteUser,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter,   setRoleFilter]   = useState<"all" | UserRole>("all");
  const [search,       setSearch]       = useState("");

  const filteredUsers = useMemo(() => users.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (roleFilter   !== "all" && u.role   !== roleFilter)   return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!u.username.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [users, statusFilter, roleFilter, search]);

  const activeCount   = users.filter((u) => u.status === "active").length;
  const inactiveCount = users.filter((u) => u.status === "inactive").length;

  return (
    <div style={{ fontFamily: font }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: "0.07em",
          textTransform: "uppercase", color: "var(--color-text-tertiary, #888)",
          marginBottom: 4,
        }}>
          Administration
        </div>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 22, color: "var(--color-text-primary, #111)",
        }}>
          User Management
        </div>
      </div>

      {usersError && (
        <div style={{
          padding: "9px 14px", marginBottom: 16, borderRadius: 8, fontSize: 13,
          background: "#FCEBEB", border: "0.5px solid rgba(162,45,45,0.2)", color: "#A32D2D",
        }}>
          {usersError}
        </div>
      )}

      {/* Summary metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total users",  value: users.length,   color: "var(--color-text-primary, #111)" },
          { label: "Active",       value: activeCount,    color: "#0F6E56" },
          { label: "Inactive",     value: inactiveCount,  color: "#5F5E5A" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--color-background-secondary, #f5f5f3)",
            borderRadius: 8, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-tertiary, #888)", marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inlineInput, paddingLeft: 32 }}
          />
        </div>

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)} style={{ ...inlineSelect, maxWidth: 150 }}>
          <option value="all">All roles</option>
          <option value="viewer">Viewer</option>
          <option value="analyst">Analyst</option>
          <option value="admin">Admin</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | UserStatus)} style={{ ...inlineSelect, maxWidth: 150 }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {(search || roleFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
            style={{ ...inlineInput, width: "auto", color: "#A32D2D", background: "#FCEBEB", borderColor: "rgba(162,45,45,0.2)", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div style={{
          padding: "32px 20px", textAlign: "center", fontSize: 14,
          color: "var(--color-text-tertiary, #888)",
          background: "var(--color-background-secondary, #f5f5f3)",
          borderRadius: 10, border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        }}>
          No users match the current filters.
        </div>
      ) : (
        <div style={{
          overflowX: "auto",
          border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
          borderRadius: 12,
          background: "var(--color-background-primary, #fff)",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary, #f9f9f7)" }}>
                {["ID", "User", "Email", "Role", "Status", "Actions"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left", fontWeight: 500,
                    fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: "var(--color-text-tertiary, #888)",
                    borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
                    whiteSpace: "nowrap",
                    ...(i === 0 ? { width: 48 } : {}),
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => {
                const isEditing     = editingUserId === u.id;
                const isCurrentUser = u.id === currentUserId;
                const rowBg = idx % 2 === 0
                  ? "var(--color-background-primary, #fff)"
                  : "var(--color-background-secondary, #fafaf8)";

                const td: React.CSSProperties = {
                  padding: "10px 14px",
                  borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.06))",
                  verticalAlign: "middle",
                  background: isEditing ? "var(--color-background-secondary, #f7faf8)" : rowBg,
                };

                return (
                  <tr key={u.id}>
                    {/* ID */}
                    <td style={{ ...td, color: "var(--color-text-tertiary, #aaa)", fontSize: 12 }}>
                      {u.id}
                    </td>

                    {/* User */}
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar username={u.username} />
                        <div>
                          <div style={{ fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
                            {u.username}
                            {isCurrentUser && (
                              <span style={{
                                marginLeft: 6, fontSize: 10, fontWeight: 500,
                                padding: "1px 7px", borderRadius: 20,
                                background: "#E1F5EE", color: "#0F6E56",
                              }}>you</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={td}>
                      {isEditing ? (
                        <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={inlineInput} />
                      ) : (
                        <span style={{ color: "var(--color-text-secondary, #555)" }}>{u.email}</span>
                      )}
                    </td>

                    {/* Role */}
                    <td style={td}>
                      {isEditing ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} style={inlineSelect}>
                          <option value="viewer">viewer</option>
                          <option value="analyst">analyst</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <Pill value={u.role} map={ROLE_STYLE} />
                      )}
                    </td>

                    {/* Status */}
                    <td style={td}>
                      {isEditing ? (
                        isCurrentUser ? (
                          <Pill value={u.status} map={STATUS_STYLE} />
                        ) : (
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as UserStatus)} style={inlineSelect}>
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        )
                      ) : (
                        <Pill value={u.status} map={STATUS_STYLE} />
                      )}
                    </td>

                    {/* Actions */}
                    <td style={td}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <input
                            type="password"
                            placeholder="New password (optional)"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            style={inlineInput}
                          />
                          <div style={{ display: "flex", gap: 6 }}>
                            <ActionBtn label="Save"   onClick={() => handleSaveEdit(u.id)} variant="primary" />
                            <ActionBtn label="Cancel" onClick={cancelEdit}                 variant="secondary" />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <ActionBtn label="Edit"   onClick={() => startEdit(u)}          variant="secondary" />
                          <ActionBtn label="Delete" onClick={() => handleDeleteUser(u.id)} variant="danger" disabled={isCurrentUser} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      <div style={{ fontSize: 12, color: "var(--color-text-tertiary, #aaa)", marginTop: 10, textAlign: "right" }}>
        Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}