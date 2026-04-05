import { useMemo, useState } from "react";
import type { ApiRecord, RecordType } from "../../../api";

type Props = {
  adminRecords: ApiRecord[];
  editingRecordId: number | null;
  editRecordAmount: string;
  editRecordType: RecordType;
  editRecordCategory: string;
  editRecordDate: string;
  editRecordNotes: string;
  recordsPage: number;
  recordsTotal: number;
  recordsTotalPages: number;
  setEditRecordAmount: (value: string) => void;
  setEditRecordType: (value: RecordType) => void;
  setEditRecordCategory: (value: string) => void;
  setEditRecordDate: (value: string) => void;
  setEditRecordNotes: (value: string) => void;
  startRecordEdit: (record: ApiRecord) => void;
  cancelRecordEdit: () => void;
  handleSaveRecordEdit: (id: number) => void;
  handleDeleteRecord: (id: number) => void;
  onRecordsPageChange: (page: number) => void;
};

// ── Design tokens — consistent with UserManagement + CreateRecord ─────────────

const font = "'DM Sans', sans-serif";

const FLOW = {
  income: {
    accent: "#0F6E56", light: "#1D9E75",
    bg: "#E1F5EE", border: "rgba(15,110,86,0.2)",
    label: "IN", icon: "↓",
    pillBg: "#E1F5EE", pillColor: "#0F6E56",
  },
  expense: {
    accent: "#92400E", light: "#B45309",
    bg: "#FEF3C7", border: "rgba(146,64,14,0.2)",
    label: "OUT", icon: "↑",
    pillBg: "#FEF3C7", pillColor: "#92400E",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function FlowPill({ type }: { type: RecordType }) {
  const f = FLOW[type];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 600, padding: "3px 9px",
      borderRadius: 20, background: f.pillBg, color: f.pillColor,
      whiteSpace: "nowrap", fontFamily: font,
      border: `0.5px solid ${f.border}`,
    }}>
      <span style={{ fontSize: 10 }}>{f.icon}</span>
      {f.label}
    </span>
  );
}

function ActionBtn({
  label, onClick, variant, disabled,
}: {
  label: string; onClick: () => void;
  variant: "primary" | "secondary" | "danger"; disabled?: boolean;
}) {
  const variants = {
    primary:   { background: "#1D9E75", color: "#fff",    borderColor: "#1D9E75" },
    secondary: { background: "#fff",    color: "#555",    borderColor: "rgba(0,0,0,0.18)" },
    danger:    { background: "#FCEBEB", color: "#A32D2D", borderColor: "rgba(162,45,45,0.2)" },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 11, fontWeight: 500, fontFamily: font,
        padding: "4px 11px", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
        border: "0.5px solid", opacity: disabled ? 0.45 : 1,
        whiteSpace: "nowrap", transition: "opacity 0.15s",
        ...variants[variant],
      }}
    >
      {label}
    </button>
  );
}

const inlineInput: React.CSSProperties = {
  padding: "5px 9px", fontSize: 12, fontFamily: font,
  border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 6,
  outline: "none", background: "#fff", color: "#111",
  width: "100%", boxSizing: "border-box",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function RecordsSection({
  adminRecords,
  editingRecordId, editRecordAmount, editRecordType,
  editRecordCategory, editRecordDate, editRecordNotes,
  recordsPage, recordsTotal, recordsTotalPages,
  setEditRecordAmount, setEditRecordType, setEditRecordCategory,
  setEditRecordDate, setEditRecordNotes,
  startRecordEdit, cancelRecordEdit,
  handleSaveRecordEdit, handleDeleteRecord, onRecordsPageChange,
}: Props) {

  // ── Local filter state ──────────────────────────────────────────────────────
  const [typeFilter,   setTypeFilter]   = useState<"all" | RecordType>("all");
  const [search,       setSearch]       = useState("");
  const [sortBy,       setSortBy]       = useState<"date" | "amount">("date");
  const [sortDir,      setSortDir]      = useState<"desc" | "asc">("desc");

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalIncome  = adminRecords.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const totalExpense = adminRecords.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const netFlow      = totalIncome - totalExpense;

  const filtered = useMemo(() => {
    let rows = [...adminRecords];
    if (typeFilter !== "all") rows = rows.filter(r => r.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.category.toLowerCase().includes(q) ||
        (r.notes ?? "").toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortBy === "amount") return mul * (a.amount - b.amount);
      return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return rows;
  }, [adminRecords, typeFilter, search, sortBy, sortDir]);

  const hasFilters = typeFilter !== "all" || search.trim() !== "";

  const fmt = (n: number) =>
    "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return d; }
  };

  const toggleSort = (col: "date" | "amount") => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: "date" | "amount" }) => {
    if (sortBy !== col) return <span style={{ color: "#ccc", marginLeft: 3 }}>↕</span>;
    return <span style={{ color: "#1D9E75", marginLeft: 3 }}>{sortDir === "desc" ? "↓" : "↑"}</span>;
  };

  return (
    <div style={{ fontFamily: font, position: "relative", minHeight: "100%" }}>

      {/* Page background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(to bottom, rgba(245,245,243,0.85) 0%, rgba(245,245,243,0.96) 60%, rgba(245,245,243,1) 100%),
          url("https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=80&auto=format&fit=crop")
        `,
        backgroundSize: "cover", backgroundPosition: "center top",
      }} />

      <div style={{ position: "relative", zIndex: 1, paddingBottom: 40 }}>

        {/* ── Section header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.07em",
            textTransform: "uppercase", color: "var(--color-text-tertiary, #888)", marginBottom: 4,
          }}>
            Finance
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 22, color: "var(--color-text-primary, #111)", margin: 0,
          }}>
            Cash Flow Records
          </h2>
        </div>

        {/* ── Summary metric cards ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10, marginBottom: 20,
        }}>
          {/* Total IN */}
          <div style={{
            background: "#E1F5EE", borderRadius: 8, padding: "12px 14px",
            border: "0.5px solid rgba(15,110,86,0.15)",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.05em",
              textTransform: "uppercase", color: "#0F6E56", marginBottom: 4,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>↓</span> Total IN
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0F6E56", fontFamily: font }}>
              {fmt(totalIncome)}
            </div>
          </div>

          {/* Total OUT */}
          <div style={{
            background: "#FEF3C7", borderRadius: 8, padding: "12px 14px",
            border: "0.5px solid rgba(146,64,14,0.15)",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.05em",
              textTransform: "uppercase", color: "#92400E", marginBottom: 4,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>↑</span> Total OUT
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#92400E", fontFamily: font }}>
              {fmt(totalExpense)}
            </div>
          </div>

          {/* Net flow */}
          <div style={{
            background: netFlow >= 0 ? "#E1F5EE" : "#FCEBEB",
            borderRadius: 8, padding: "12px 14px",
            border: `0.5px solid ${netFlow >= 0 ? "rgba(15,110,86,0.15)" : "rgba(162,45,45,0.15)"}`,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: netFlow >= 0 ? "#0F6E56" : "#A32D2D",
              marginBottom: 4,
            }}>
              Net Flow
            </div>
            <div style={{
              fontSize: 18, fontWeight: 600,
              color: netFlow >= 0 ? "#0F6E56" : "#A32D2D",
              fontFamily: font,
            }}>
              {netFlow >= 0 ? "+" : "−"}{fmt(netFlow)}
            </div>
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "center",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 260 }}>
            <svg style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search category or notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inlineInput, paddingLeft: 28, fontSize: 13 }}
            />
          </div>

          {/* Type filter — pill buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "income", "expense"] as const).map(t => {
              const active = typeFilter === t;
              const color = t === "income" ? "#0F6E56" : t === "expense" ? "#92400E" : "#555";
              const bg    = t === "income" ? "#E1F5EE" : t === "expense" ? "#FEF3C7" : "#f5f5f3";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  style={{
                    fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: font,
                    padding: "5px 12px", borderRadius: 20,
                    border: active ? `0.5px solid ${color}` : "0.5px solid rgba(0,0,0,0.15)",
                    background: active ? bg : "var(--color-background-secondary, #f5f5f3)",
                    color: active ? color : "#888",
                    cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                  }}
                >
                  {t === "all" ? "All" : t === "income" ? "↓ IN" : "↑ OUT"}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            {(["date", "amount"] as const).map(col => (
              <button
                key={col}
                type="button"
                onClick={() => toggleSort(col)}
                style={{
                  fontSize: 12, fontWeight: sortBy === col ? 600 : 400, fontFamily: font,
                  padding: "5px 11px", borderRadius: 6,
                  border: "0.5px solid rgba(0,0,0,0.15)",
                  background: sortBy === col ? "#fff" : "transparent",
                  color: sortBy === col ? "#111" : "#888",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 2,
                }}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)}
                <SortIcon col={col} />
              </button>
            ))}
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(""); setTypeFilter("all"); }}
              style={{
                ...inlineInput, width: "auto", fontSize: 12,
                color: "#A32D2D", background: "#FCEBEB",
                borderColor: "rgba(162,45,45,0.2)", cursor: "pointer",
                whiteSpace: "nowrap", padding: "5px 11px",
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Table card ── */}
        {filtered.length === 0 ? (
          <div style={{
            padding: "36px 20px", textAlign: "center", fontSize: 14,
            color: "var(--color-text-tertiary, #888)",
            background: "var(--color-background-secondary, #f5f5f3)",
            borderRadius: 10,
            border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
          }}>
            {hasFilters ? "No records match the current filters." : "No records found."}
          </div>
        ) : (
          <div style={{
            overflowX: "auto",
            border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
            borderRadius: 12,
            background: "var(--color-background-primary, #fff)",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-background-secondary, #f9f9f7)" }}>
                  {["ID", "Flow", "Amount", "Category", "Date", "Notes", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      onClick={h === "Amount" ? () => toggleSort("amount") : h === "Date" ? () => toggleSort("date") : undefined}
                      style={{
                        padding: "10px 14px", textAlign: "left", fontWeight: 500,
                        fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                        color: "var(--color-text-tertiary, #888)",
                        borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
                        whiteSpace: "nowrap",
                        cursor: (h === "Amount" || h === "Date") ? "pointer" : "default",
                        userSelect: "none",
                        ...(i === 0 ? { width: 40 } : {}),
                      }}
                    >
                      {h}
                      {h === "Amount" && <SortIcon col="amount" />}
                      {h === "Date"   && <SortIcon col="date" />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => {
                  const isEditing = editingRecordId === r.id;
                  const f = FLOW[r.type];
                  const rowBg = idx % 2 === 0
                    ? "var(--color-background-primary, #fff)"
                    : "var(--color-background-secondary, #fafaf8)";

                  const td: React.CSSProperties = {
                    padding: "10px 14px",
                    borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.06))",
                    verticalAlign: "middle",
                    background: isEditing ? (r.type === "income" ? "#F2FBF7" : "#FFFBF0") : rowBg,
                    transition: "background 0.2s",
                  };

                  return (
                    <tr key={r.id}>
                      {/* ID */}
                      <td style={{ ...td, color: "var(--color-text-tertiary, #aaa)", fontSize: 12 }}>
                        {r.id}
                      </td>

                      {/* Flow type */}
                      <td style={td}>
                        {isEditing ? (
                          <select
                            value={editRecordType}
                            onChange={e => setEditRecordType(e.target.value as RecordType)}
                            style={inlineInput}
                          >
                            <option value="income">↓ IN (Income)</option>
                            <option value="expense">↑ OUT (Expense)</option>
                          </select>
                        ) : (
                          <FlowPill type={r.type} />
                        )}
                      </td>

                      {/* Amount */}
                      <td style={td}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editRecordAmount}
                            onChange={e => setEditRecordAmount(e.target.value)}
                            style={inlineInput}
                          />
                        ) : (
                          <span style={{
                            fontWeight: 600, fontFamily: font,
                            color: f.accent,
                          }}>
                            {r.type === "income" ? "+" : "−"}{fmt(r.amount)}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td style={td}>
                        {isEditing ? (
                          <input
                            value={editRecordCategory}
                            onChange={e => setEditRecordCategory(e.target.value)}
                            style={inlineInput}
                          />
                        ) : (
                          <span style={{ color: "var(--color-text-secondary, #444)", fontWeight: 500 }}>
                            {r.category}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={td}>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editRecordDate}
                            onChange={e => setEditRecordDate(e.target.value)}
                            style={inlineInput}
                          />
                        ) : (
                          <span style={{ color: "var(--color-text-secondary, #555)", whiteSpace: "nowrap" }}>
                            {fmtDate(r.date)}
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td style={{ ...td, maxWidth: 180 }}>
                        {isEditing ? (
                          <input
                            value={editRecordNotes}
                            onChange={e => setEditRecordNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            style={inlineInput}
                          />
                        ) : (
                          <span style={{
                            color: r.notes ? "var(--color-text-secondary, #555)" : "var(--color-text-tertiary, #bbb)",
                            fontSize: 12,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                          }}>
                            {r.notes ?? "—"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={td}>
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", gap: 5 }}>
                              <ActionBtn label="Save"   onClick={() => handleSaveRecordEdit(r.id)} variant="primary" />
                              <ActionBtn label="Cancel" onClick={cancelRecordEdit}                  variant="secondary" />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 5 }}>
                            <ActionBtn label="Edit"   onClick={() => startRecordEdit(r)}    variant="secondary" />
                            <ActionBtn label="Delete" onClick={() => handleDeleteRecord(r.id)} variant="danger" />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table footer totals row */}
              {filtered.length > 1 && (
                <tfoot>
                  <tr style={{ background: "var(--color-background-secondary, #f9f9f7)" }}>
                    <td colSpan={2} style={{
                      padding: "10px 14px",
                      borderTop: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
                      fontSize: 11, fontWeight: 500, letterSpacing: "0.05em",
                      textTransform: "uppercase", color: "var(--color-text-tertiary, #888)",
                    }}>
                      Filtered totals
                    </td>
                    <td style={{
                      padding: "10px 14px",
                      borderTop: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
                      fontSize: 12, fontWeight: 600,
                    }}>
                      <div style={{ color: "#0F6E56" }}>
                        +{fmt(filtered.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0))}
                      </div>
                      <div style={{ color: "#92400E", marginTop: 2 }}>
                        −{fmt(filtered.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0))}
                      </div>
                    </td>
                    <td colSpan={4} style={{
                      padding: "10px 14px",
                      borderTop: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
                    }} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {recordsTotalPages > 1 && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 12, gap: 12, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary, #aaa)", fontFamily: font }}>
              Page {recordsPage} of {recordsTotalPages} · {recordsTotal} total record{recordsTotal !== 1 ? "s" : ""}
            </span>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => onRecordsPageChange(recordsPage - 1)}
                disabled={recordsPage <= 1}
                style={{
                  fontSize: 12, fontWeight: 500, fontFamily: font,
                  padding: "5px 13px", borderRadius: 6, cursor: recordsPage <= 1 ? "not-allowed" : "pointer",
                  border: "0.5px solid rgba(0,0,0,0.18)",
                  background: "#fff", color: "#555",
                  opacity: recordsPage <= 1 ? 0.4 : 1, transition: "opacity 0.15s",
                }}
              >
                ← Prev
              </button>

              {/* Page number pills */}
              {Array.from({ length: Math.min(recordsTotalPages, 5) }, (_, i) => {
                const page = i + 1;
                const active = page === recordsPage;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onRecordsPageChange(page)}
                    style={{
                      width: 30, height: 30, borderRadius: 6,
                      fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: font,
                      border: active ? "0.5px solid #1D9E75" : "0.5px solid rgba(0,0,0,0.15)",
                      background: active ? "#E1F5EE" : "#fff",
                      color: active ? "#0F6E56" : "#555",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              {recordsTotalPages > 5 && (
                <span style={{ fontSize: 12, color: "#aaa" }}>…</span>
              )}

              <button
                type="button"
                onClick={() => onRecordsPageChange(recordsPage + 1)}
                disabled={recordsPage >= recordsTotalPages}
                style={{
                  fontSize: 12, fontWeight: 500, fontFamily: font,
                  padding: "5px 13px", borderRadius: 6,
                  cursor: recordsPage >= recordsTotalPages ? "not-allowed" : "pointer",
                  border: "0.5px solid rgba(0,0,0,0.18)",
                  background: "#fff", color: "#555",
                  opacity: recordsPage >= recordsTotalPages ? 0.4 : 1, transition: "opacity 0.15s",
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Footer count */}
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary, #aaa)", marginTop: 10, textAlign: "right", fontFamily: font }}>
          Showing {filtered.length} of {adminRecords.length} record{adminRecords.length !== 1 ? "s" : ""} on this page
        </div>
      </div>
    </div>
  );
}