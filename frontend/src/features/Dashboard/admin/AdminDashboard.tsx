import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../../../api";
import type {
  ApiUser,
  UserRole,
  UserStatus,
  ApiRecord,
  RecordType,
} from "../../../api";

import AdminSidebar, { type DashboardSection } from "./AdminSidebar";
import DashboardOverview from "./DashboardOverview";
import CreateUserSection from "./CreateUserSection";
import UserManagementSection from "./UserManagementSection";
import CreateRecordSection from "./CreateRecordSection";
import RecordsSection from "./RecordsSection";
import {
  layoutStyle,
  mainContentStyle,
  panelStyle,
} from "./adminstyles";

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
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("overview");

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

  const [adminRecords, setAdminRecords] = useState<ApiRecord[]>(
    records as ApiRecord[]
  );
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
      setActiveSection("manage-users");
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
      setActiveSection("records");
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

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <DashboardOverview
            user={user}
            summary={summary}
            error={error}
            usersError={usersError}
          />
        );

      case "create-user":
        return (
          <CreateUserSection
            username={username}
            email={email}
            password={password}
            role={role}
            formError={formError}
            submitting={submitting}
            setUsername={setUsername}
            setEmail={setEmail}
            setPassword={setPassword}
            setRole={setRole}
            onSubmit={handleCreateUser}
          />
        );

      case "manage-users":
        return (
          <UserManagementSection
            users={users}
            usersError={usersError}
            currentUserId={user.id}
            editingUserId={editingUserId}
            editEmail={editEmail}
            editRole={editRole}
            editStatus={editStatus}
            editPassword={editPassword}
            setEditEmail={setEditEmail}
            setEditRole={setEditRole}
            setEditStatus={setEditStatus}
            setEditPassword={setEditPassword}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            handleSaveEdit={handleSaveEdit}
            handleDeleteUser={handleDeleteUser}
          />
        );

      case "create-record":
        return (
          <CreateRecordSection
            recordAmount={recordAmount}
            recordType={recordType}
            recordCategory={recordCategory}
            recordDate={recordDate}
            recordNotes={recordNotes}
            recordError={recordError}
            recordSubmitting={recordSubmitting}
            setRecordAmount={setRecordAmount}
            setRecordType={setRecordType}
            setRecordCategory={setRecordCategory}
            setRecordDate={setRecordDate}
            setRecordNotes={setRecordNotes}
            onSubmit={handleCreateRecord}
          />
        );

      case "records":
        return (
          <RecordsSection
            adminRecords={adminRecords}
            editingRecordId={editingRecordId}
            editRecordAmount={editRecordAmount}
            editRecordType={editRecordType}
            editRecordCategory={editRecordCategory}
            editRecordDate={editRecordDate}
            editRecordNotes={editRecordNotes}
            recordsPage={recordsPage}
            recordsTotal={recordsTotal}
            recordsTotalPages={recordsTotalPages}
            setEditRecordAmount={setEditRecordAmount}
            setEditRecordType={setEditRecordType}
            setEditRecordCategory={setEditRecordCategory}
            setEditRecordDate={setEditRecordDate}
            setEditRecordNotes={setEditRecordNotes}
            startRecordEdit={startRecordEdit}
            cancelRecordEdit={cancelRecordEdit}
            handleSaveRecordEdit={handleSaveRecordEdit}
            handleDeleteRecord={handleDeleteRecord}
            onRecordsPageChange={onRecordsPageChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={layoutStyle}>
      <AdminSidebar
        user={user}
        activeSection={activeSection}
        onChangeSection={setActiveSection}
        onLogout={onLogout}
      />

      <main style={mainContentStyle}>
        <div style={panelStyle}>{renderContent()}</div>
      </main>
    </div>
  );
}