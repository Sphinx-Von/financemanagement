import type { ApiUser, UserRole, UserStatus } from "../../../api";
import {
  smallInputStyle,
  thStyle,
  tdStyle,
  buttonPrimaryStyle,
  buttonSecondaryStyle,
  buttonDangerStyle,
} from "./adminstyles";


export const filterBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 12,
  marginBottom: 8,
  alignItems: "center",
};

export const filterSelectStyle: React.CSSProperties = {
  ...smallInputStyle,
  minWidth: 140,
};
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

import { useMemo, useState } from "react";

export default function UserManagementSection({
  users,
  usersError,
  currentUserId,
  editingUserId,
  editEmail,
  editRole,
  editStatus,
  editPassword,
  setEditEmail,
  setEditRole,
  setEditStatus,
  setEditPassword,
  startEdit,
  cancelEdit,
  handleSaveEdit,
  handleDeleteUser,
}: Props) {
  // filter state
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) {
        return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !u.username.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, statusFilter, roleFilter, search]);

  return (
    <div>
      <h2>User Management</h2>

      {usersError && <p style={{ color: "red" }}>{usersError}</p>}

      {/* Filters */}
      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Search by username or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...smallInputStyle, width: "100%", maxWidth: 260 }}
        />

        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value as "all" | UserRole)
          }
          style={filterSelectStyle}
        >
          <option value="all">All roles</option>
          <option value="viewer">viewer</option>
          <option value="analyst">analyst</option>
          <option value="admin">admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | UserStatus)
          }
          style={filterSelectStyle}
        >
          <option value="all">All status</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <p>No users match the current filters.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              background: "#fff",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isEditing = editingUserId === u.id;
                const isCurrentUser = u.id === currentUserId;

                return (
                  <tr key={u.id}>
                    <td style={tdStyle}>{u.id}</td>
                    <td style={tdStyle}>{u.username}</td>

                    <td style={tdStyle}>
                      {isEditing ? (
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          style={smallInputStyle}
                        />
                      ) : (
                        u.email
                      )}
                    </td>

                    <td style={tdStyle}>
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as UserRole)
                          }
                          style={smallInputStyle}
                        >
                          <option value="viewer">viewer</option>
                          <option value="analyst">analyst</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>

                    <td style={tdStyle}>
                      {isEditing ? (
                        isCurrentUser ? (
                          <span>{u.status}</span>
                        ) : (
                          <select
                            value={editStatus}
                            onChange={(e) =>
                              setEditStatus(e.target.value as UserStatus)
                            }
                            style={smallInputStyle}
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                          </select>
                        )
                      ) : (
                        u.status
                      )}
                    </td>

                    <td style={tdStyle}>
                      {isEditing ? (
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <input
                            type="password"
                            placeholder="New password (optional)"
                            value={editPassword}
                            onChange={(e) =>
                              setEditPassword(e.target.value)
                            }
                            style={smallInputStyle}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(u.id)}
                            style={buttonPrimaryStyle}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            style={buttonSecondaryStyle}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            style={buttonSecondaryStyle}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            style={{
                              ...buttonDangerStyle,
                              opacity: isCurrentUser ? 0.5 : 1,
                              cursor: isCurrentUser
                                ? "not-allowed"
                                : "pointer",
                            }}
                            disabled={isCurrentUser}
                          >
                            Delete
                          </button>
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
    </div>
  );
}