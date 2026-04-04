type SummaryCardProps = {
  label: string;
  value: number;
};

export default function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}