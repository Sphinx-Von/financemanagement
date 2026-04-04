import { sidebarStyle, getSidebarItemStyle } from "./adminstyles";

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

export default function AdminSidebar({
  user,
  activeSection,
  onChangeSection,
  onLogout,
}: Props) {
  return (
    <aside style={sidebarStyle}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Admin Panel</h2>
        <p style={{ marginTop: 8, fontSize: 14, color: "#d1d5db" }}>
          {user.username} ({user.role})
        </p>
      </div>

      <button
        onClick={() => onChangeSection("overview")}
        style={getSidebarItemStyle(activeSection === "overview")}
      >
        Overview
      </button>

      <button
        onClick={() => onChangeSection("create-user")}
        style={getSidebarItemStyle(activeSection === "create-user")}
      >
        Create User
      </button>

      <button
        onClick={() => onChangeSection("manage-users")}
        style={getSidebarItemStyle(activeSection === "manage-users")}
      >
        User Management
      </button>

      <button
        onClick={() => onChangeSection("create-record")}
        style={getSidebarItemStyle(activeSection === "create-record")}
      >
        Create Record
      </button>

      <button
        onClick={() => onChangeSection("records")}
        style={getSidebarItemStyle(activeSection === "records")}
      >
        Records
      </button>

      <div style={{ marginTop: "auto" }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "none",
            borderRadius: 8,
            background: "#dc2626",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}