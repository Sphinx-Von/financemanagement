import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

type Props = {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    totalRecords: number;
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function SummaryChart({ summary }: Props) {
  const data = [
    { name: "Income", value: summary.totalIncome, color: "#16a34a" },
    { name: "Expenses", value: summary.totalExpenses, color: "#dc2626" },
    { name: "Net Balance", value: summary.netBalance, color: "#2563eb" },
  ];

  return (
    <div
      style={{
        marginTop: 24,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Financial Overview</h3>
        <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
          Total records: {summary.totalRecords}
        </p>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `₹${value}`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}