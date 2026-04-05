import { useEffect, useState } from "react";


import {
  login,
  getDashboardSummary,
  getRecords,
  getTenantDashboard,
  type TenantDashboardRow,
} from "../src/api";


import LoginPage from "../src/features/auth/Login";
import DashboardRouter from "../src/features/Dashboard/DashboardRouter";

type User = {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

export default function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<any>(null);


const [tenantRows, setTenantRows] = useState<TenantDashboardRow[]>([]);
 

const [records, setRecords] = useState<any[]>([]);
const [recordsPage, setRecordsPage] = useState(1);
const [recordsTotal, setRecordsTotal] = useState(0);
const [recordsTotalPages, setRecordsTotalPages] = useState(1);
const [recordsLimit] = useState(10);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoading(true);
      setError("");

      const auth = await login(username, password);
      setToken(auth.token);
      setUser(auth.user);
    } catch (e: any) {
      setError(e.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
  const loadDashboard = async () => {
    if (!token || !user) return;

    try {
      setError("");

      const summaryRes = await getDashboardSummary(token);
      setSummary(summaryRes);

      const recordsRes = await getRecords(token, recordsPage, recordsLimit);
      setRecords(recordsRes.data);
      setRecordsTotal(recordsRes.total);
      setRecordsTotalPages(recordsRes.totalPages);

      if (user.role === "analyst" || user.role === "admin") {
        const tenantsRes = await getTenantDashboard(token);
        setTenantRows(tenantsRes);
      } else {
        setTenantRows([]);
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load dashboard");
    }
  };

  loadDashboard();
}, [token, user, recordsPage, recordsLimit]);


  const handleLogout = () => {
    setToken("");
    setUser(null);
    setSummary(null);
    setRecords([]);
    setError("");
  };

  if (!token || !user) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loading={loading}
        error={error}
      />
    );
  }

  return (
  <DashboardRouter
    token={token}
    user={user}
    summary={summary}
    records={records}
    error={error}
    onLogout={handleLogout}
    recordsPage={recordsPage}
    recordsTotal={recordsTotal}
    recordsTotalPages={recordsTotalPages}
    onRecordsPageChange={setRecordsPage}
    tenantRows={tenantRows}
  />
);
}