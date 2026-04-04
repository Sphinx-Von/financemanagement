type RecordsTableProps = {
  records: any[];
};

export default function RecordsTable({ records }: RecordsTableProps) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={th}>ID</th>
          <th style={th}>Date</th>
          <th style={th}>Type</th>
          <th style={th}>Category</th>
          <th style={th}>Amount</th>
          <th style={th}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id}>
            <td style={td}>{r.id}</td>
            <td style={td}>{r.date}</td>
            <td style={td}>{r.type}</td>
            <td style={td}>{r.category}</td>
            <td style={td}>{r.amount}</td>
            <td style={td}>{r.notes ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  padding: "8px",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px",
};