import SummaryCard from "../SummaryCard";
import SummaryChart from "../SummaryChart";

type Props = {
  user: {
    username: string;
    role: string;
  };
  summary: any;
  error: string;
  usersError: string;
};

export default function DashboardOverview({
  user,
  summary,
  error,
  usersError,
}: Props) {
  return (
    <>
      <div>
        <h1 style={{ marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Logged in as <strong>{user.username}</strong> ({user.role})
        </p>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {usersError && <p style={{ color: "red" }}>{usersError}</p>}

      {summary && (
        <>
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

          <div style={{ marginTop: 24 }}>
            <SummaryChart summary={summary} />
          </div>
        </>
      )}
    </>
  );
}