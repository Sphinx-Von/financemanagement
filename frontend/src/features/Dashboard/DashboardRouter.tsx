import AdminDashboard from "./admin/AdminDashboard";
import AnalystDashboard from "../Dashboard/AnalystDashboard";
import ViewerDashboard from "../Dashboard/ViewerDashboard";

type User = {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

type DashboardRouterProps = {
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

export default function DashboardRouter(props: DashboardRouterProps) {
  switch (props.user.role) {
    case "admin":
      return <AdminDashboard {...props} />;
    case "analyst":
      return <AnalystDashboard {...props} />;
    case "viewer":
      return <ViewerDashboard {...props} />;
    default:
      return <div>Unknown role</div>;
  }
}