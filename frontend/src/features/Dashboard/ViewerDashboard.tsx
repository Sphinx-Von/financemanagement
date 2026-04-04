import SummaryCard from "./SummaryCard";
import RecordsTable from "./RecordTable";

type User = {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

type Props = {
  user: User;
  summary: any;
  records: any[];
  error: string;
  onLogout: () => void;
};

export default function ViewerDashboard({
  user,
  summary,
  records,
  error,
  onLogout,
}: Props) {
  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Viewer Dashboard</h1>
          <p>
            Logged in as <strong>{user.username}</strong> ({user.role})
          </p>
        </div>
        <button onClick={onLogout}>Logout</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {summary && (
        <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          <SummaryCard label="Total Income" value={summary.totalIncome} />
          <SummaryCard label="Total Expenses" value={summary.totalExpenses} />
          <SummaryCard label="Net Balance" value={summary.netBalance} />
          <SummaryCard label="Total Records" value={summary.totalRecords} />
        </div>
      )}

      {records.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2>Recent Records</h2>
          <RecordsTable records={records} />
        </div>
      )}
    </div>
  );
}