import { useEffect, useState } from "react";
import SummaryCard from "./SummaryCard";
import SummaryChart from "./SummaryChart";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../../api";
import type {
  ApiUser,
  UserRole,
  UserStatus,
  ApiRecord,
  RecordType,
} from "../../api";

type User = {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

type Props = {
  token: string;
  user: User;
  summary: any;
  records: any[];
  error: string;
  onLogout: () => void;
  recordsPage: number;
  recordsTotal: number;
  recordsTotalPages: number;
  onRecordsPageChange: (page: number) => void;
};

export default function AdminDashboard({
  token,
  user,
  summary,
  records,
  error,
  onLogout,
  recordsPage,
  recordsTotal,
  recordsTotalPages,
  onRecordsPageChange,
}: Props) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [usersError, setUsersError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("viewer");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [editPassword, setEditPassword] = useState("");

  const [adminRecords, setAdminRecords] = useState<ApiRecord[]>(records as ApiRecord[]);
  const [recordError, setRecordError] = useState("");
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  const [recordAmount, setRecordAmount] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("income");
  const [recordCategory, setRecordCategory] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [recordNotes, setRecordNotes] = useState("");

  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editRecordAmount, setEditRecordAmount] = useState("");
  const [editRecordType, setEditRecordType] = useState<RecordType>("income");
  const [editRecordCategory, setEditRecordCategory] = useState("");
  const [editRecordDate, setEditRecordDate] = useState("");
  const [editRecordNotes, setEditRecordNotes] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersError("");
        const data = await getUsers(token);
        setUsers(data);
      } catch (e: any) {
        setUsersError(e.message ?? "Failed to load users");
      }
    };

    loadUsers();
  }, [token]);

  useEffect(() => {
    setAdminRecords(records as ApiRecord[]);
  }, [records]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");

      const newUser = await createUser(token, {
        username,
        email,
        password,
        role,
      });

      setUsers((prev) => [...prev, newUser]);
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("viewer");
    } catch (e: any) {
      setFormError(e.message ?? "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (selectedUser: ApiUser) => {
    setEditingUserId(selectedUser.id);
    setEditEmail(selectedUser.email);
    setEditRole(selectedUser.role);
    setEditStatus(selectedUser.status);
    setEditPassword("");
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditEmail("");
    setEditRole("viewer");
    setEditStatus("active");
    setEditPassword("");
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await updateUser(token, id, {
        email: editEmail,
        role: editRole,
        ...(id !== user.id ? { status: editStatus } : {}),
        ...(editPassword ? { password: editPassword } : {}),
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                email: editEmail,
                role: editRole,
                status: id === user.id ? u.status : editStatus,
              }
            : u
        )
      );

      cancelEdit();
    } catch (e: any) {
      alert(e.message ?? "Failed to update user");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === user.id) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      await deleteUser(token, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e.message ?? "Failed to delete user");
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setRecordSubmitting(true);
      setRecordError("");

      const newRecord = await createRecord(token, {
        amount: Number(recordAmount),
        type: recordType,
        category: recordCategory,
        date: recordDate,
        notes: recordNotes || undefined,
      });

      setAdminRecords((prev) => [newRecord, ...prev]);
      setRecordAmount("");
      setRecordType("income");
      setRecordCategory("");
      setRecordDate("");
      setRecordNotes("");
    } catch (e: any) {
      setRecordError(e.message ?? "Failed to create record");
    } finally {
      setRecordSubmitting(false);
    }
  };

  const startRecordEdit = (record: ApiRecord) => {
    setEditingRecordId(record.id);
    setEditRecordAmount(String(record.amount));
    setEditRecordType(record.type);
    setEditRecordCategory(record.category);
    setEditRecordDate(record.date);
    setEditRecordNotes(record.notes ?? "");
  };

  const cancelRecordEdit = () => {
    setEditingRecordId(null);
    setEditRecordAmount("");
    setEditRecordType("income");
    setEditRecordCategory("");
    setEditRecordDate("");
    setEditRecordNotes("");
  };

  const handleSaveRecordEdit = async (id: number) => {
    try {
      await updateRecord(token, id, {
        amount: Number(editRecordAmount),
        type: editRecordType,
        category: editRecordCategory,
        date: editRecordDate,
        notes: editRecordNotes,
      });

      setAdminRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                amount: Number(editRecordAmount),
                type: editRecordType,
                category: editRecordCategory,
                date: editRecordDate,
                notes: editRecordNotes || null,
              }
            : r
        )
      );

      cancelRecordEdit();
    } catch (e: any) {
      alert(e.message ?? "Failed to update record");
    }
  };

  const handleDeleteRecord = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this record?");
    if (!confirmed) return;

    try {
      await deleteRecord(token, id);
      setAdminRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e.message ?? "Failed to delete record");
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Logged in as <strong>{user.username}</strong> ({user.role})
          </p>
        </div>
        <button onClick={onLogout}>Logout</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {usersError && <p style={{ color: "red" }}>{usersError}</p>}

      {summary && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 24,
            flexWrap: "wrap",
          }}
        >
          <SummaryCard label="Total Income" value={summary.totalIncome} />
          <SummaryCard label="Total Expenses" value={summary.totalExpenses} />
          <SummaryCard label="Net Balance" value={summary.netBalance} />
          <SummaryCard label="Total Records" value={summary.totalRecords} />
        </div>
      )}
      {summary && <SummaryChart summary={summary} />}

      <div style={{ marginTop: 32 }}>
        <h2>Create User</h2>

        <form
          onSubmit={handleCreateUser}
          style={{
            display: "grid",
            gap: 12,
            maxWidth: 420,
            marginTop: 12,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            style={inputStyle}
          >
            <option value="viewer">viewer</option>
            <option value="analyst">analyst</option>
            <option value="admin">admin</option>
          </select>

          {formError && <p style={{ color: "red", margin: 0 }}>{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={buttonPrimaryStyle}
          >
            {submitting ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 32 }}>
        <h2>User Management</h2>

        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 12,
              fontSize: 14,
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
              {users.map((u) => {
                const isEditing = editingUserId === u.id;
                const isCurrentUser = u.id === user.id;

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
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
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
                            onChange={(e) => setEditStatus(e.target.value as UserStatus)}
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
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <input
                            type="password"
                            placeholder="New password (optional)"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
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
                        <div style={{ display: "flex", gap: 8 }}>
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
                              cursor: isCurrentUser ? "not-allowed" : "pointer",
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
        )}
      </div>

      <div style={{ marginTop: 32 }}>
        <h2>Create Record</h2>

        <form
          onSubmit={handleCreateRecord}
          style={{
            display: "grid",
            gap: 12,
            maxWidth: 520,
            marginTop: 12,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
          }}
        >
          <input
            type="number"
            placeholder="Amount"
            value={recordAmount}
            onChange={(e) => setRecordAmount(e.target.value)}
            style={inputStyle}
            required
          />

          <select
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as RecordType)}
            style={inputStyle}
          >
            <option value="income">income</option>
            <option value="expense">expense</option>
          </select>

          <input
            type="text"
            placeholder="Category"
            value={recordCategory}
            onChange={(e) => setRecordCategory(e.target.value)}
            style={inputStyle}
            required
          />

          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            style={inputStyle}
            required
          />

          <textarea
            placeholder="Notes (optional)"
            value={recordNotes}
            onChange={(e) => setRecordNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: 90 }}
          />

          {recordError && <p style={{ color: "red", margin: 0 }}>{recordError}</p>}

          <button
            type="submit"
            disabled={recordSubmitting}
            style={buttonPrimaryStyle}
          >
            {recordSubmitting ? "Creating..." : "Create Record"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 32 }}>
        <h2>Records</h2>

        {adminRecords.length === 0 ? (
          <p>No records found.</p>
        ) : (
          <>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 12,
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminRecords.map((r) => {
                  const isEditing = editingRecordId === r.id;

                  return (
                    <tr key={r.id}>
                      <td style={tdStyle}>{r.id}</td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editRecordAmount}
                            onChange={(e) => setEditRecordAmount(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.amount
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <select
                            value={editRecordType}
                            onChange={(e) => setEditRecordType(e.target.value as RecordType)}
                            style={smallInputStyle}
                          >
                            <option value="income">income</option>
                            <option value="expense">expense</option>
                          </select>
                        ) : (
                          r.type
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            value={editRecordCategory}
                            onChange={(e) => setEditRecordCategory(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.category
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editRecordDate}
                            onChange={(e) => setEditRecordDate(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.date
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <input
                            value={editRecordNotes}
                            onChange={(e) => setEditRecordNotes(e.target.value)}
                            style={smallInputStyle}
                          />
                        ) : (
                          r.notes ?? "-"
                        )}
                      </td>

                      <td style={tdStyle}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleSaveRecordEdit(r.id)}
                              style={buttonPrimaryStyle}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelRecordEdit}
                              style={buttonSecondaryStyle}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => startRecordEdit(r)}
                              style={buttonSecondaryStyle}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r.id)}
                              style={buttonDangerStyle}
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 16,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <p style={{ margin: 0 }}>
                Page {recordsPage} of {recordsTotalPages} • Total records: {recordsTotal}
              </p>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onRecordsPageChange(recordsPage - 1)}
                  disabled={recordsPage <= 1}
                  style={{
                    ...buttonSecondaryStyle,
                    opacity: recordsPage <= 1 ? 0.5 : 1,
                    cursor: recordsPage <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => onRecordsPageChange(recordsPage + 1)}
                  disabled={recordsPage >= recordsTotalPages}
                  style={{
                    ...buttonSecondaryStyle,
                    opacity: recordsPage >= recordsTotalPages ? 0.5 : 1,
                    cursor: recordsPage >= recordsTotalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  outline: "none",
};

const smallInputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  outline: "none",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: 8,
};

const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
  verticalAlign: "top",
};

const buttonPrimaryStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
};

const buttonSecondaryStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  background: "#fff",
  color: "#111",
  cursor: "pointer",
};

const buttonDangerStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "#fff",
  cursor: "pointer",
};