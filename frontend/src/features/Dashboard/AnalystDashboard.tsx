import { useEffect, useRef, useState, useMemo } from "react";
import type { CSSProperties } from "react";
import SummaryCard from "./SummaryCard";
import RecordsTable from "./RecordTable";
import type { TenantDashboardRow } from "../../api";

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
  tenantRows: TenantDashboardRow[];
};

declare global {
  interface Window {
    Chart: any;
  }
}

// ─── Asset URLs ────────────────────────────────────────────────────────────────
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap";
const CHARTJS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadFont(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}
function fmtInr(v: number) {
  return "₹" + v.toLocaleString("en-IN");
}
function fmtK(v: number) {
  return v >= 1_00_000
    ? "₹" + (v / 1_00_000).toFixed(1) + "L"
    : "₹" + (v / 1000).toFixed(0) + "k";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pill({
  value,
  variant = "blue",
}: {
  value: string;
  variant?: "blue" | "green" | "amber" | "red" | "gray" | "teal" | "violet";
}) {
  const map: Record<string, { bg: string; color: string }> = {
    blue:   { bg: "#E6F1FB", color: "#185FA5" },
    green:  { bg: "#EAF3DE", color: "#3B6D11" },
    amber:  { bg: "#FAEEDA", color: "#854F0B" },
    red:    { bg: "#FCEBEB", color: "#A32D2D" },
    gray:   { bg: "#F1EFE8", color: "#5F5E5A" },
    teal:   { bg: "#E1F5EE", color: "#0F6E56" },
    violet: { bg: "#EDE9FB", color: "#5B3FBF" },
  };
  const { bg, color } = map[variant] ?? map.gray;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap" }}>
      {value || "—"}
    </span>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "0.5px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      padding: "18px 20px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
    }}>
      {accent && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "16px 16px 0 0" }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
          {label}
        </div>
        {icon && <div style={{ opacity: 0.35 }}>{icon}</div>}
      </div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, lineHeight: 1, color: "#111", marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

type FilterStatus = "all" | "paid" | "unpaid" | "overdue";

function statusVariant(s: string | null | undefined): "green" | "amber" | "red" | "gray" {
  if (s === "paid") return "green";
  if (s === "unpaid") return "amber";
  if (s === "overdue") return "red";
  return "gray";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalystDashboard({
  user,
  summary,
  records,
  error,
  onLogout,
  tenantRows,
}: Props) {
  useEffect(() => { loadFont(FONTS_URL); }, []);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"username" | "amountPaid" | "outstandingBalance" | "dueDate">("username");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // All viewer tenants
  const allRows = tenantRows.filter((r) => r.role === "viewer");

  // Unique properties for filter dropdown
  const properties = useMemo(() => {
    const set = new Set(allRows.map((r) => r.propertyName ?? "—"));
    return ["all", ...Array.from(set)];
  }, [allRows]);

  // Filtered + sorted rows
  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (statusFilter !== "all") rows = rows.filter((r) => r.paymentStatus === statusFilter);
    if (propertyFilter !== "all") rows = rows.filter((r) => (r.propertyName ?? "—") === propertyFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.username?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.propertyName?.toLowerCase().includes(q) ||
          r.fullAddress?.toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      let av: any = a[sortBy] ?? "";
      let bv: any = b[sortBy] ?? "";
      if (sortBy === "amountPaid" || sortBy === "outstandingBalance") {
        av = Number(av); bv = Number(bv);
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [allRows, statusFilter, propertyFilter, search, sortBy, sortDir]);

  // ── Derived Metrics ──────────────────────────────────────────────────────────
  const totalCollected  = allRows.reduce((s, r) => s + Number(r.amountPaid ?? 0), 0);
  const totalOutstanding = allRows.reduce((s, r) => s + Number(r.outstandingBalance ?? 0), 0);
  const paidCount       = allRows.filter((r) => r.paymentStatus === "paid").length;
  const overdueCount    = allRows.filter((r) => r.paymentStatus === "overdue").length;
  const unpaidCount     = allRows.filter((r) => r.paymentStatus === "unpaid").length;
  const collectionRate  = allRows.length > 0 ? Math.round((paidCount / allRows.length) * 100) : 0;
  // Projected annual revenue (simple: totalCollected per cycle × 12)
  const projectedAnnual = totalCollected * 12;
  // Profit margin estimate (assume 30% expenses)
  const estimatedProfit = Math.round(projectedAnnual * 0.7);

  // ── Charts ───────────────────────────────────────────────────────────────────
  const statusPieRef = useRef<HTMLCanvasElement>(null);
  const collectionBarRef = useRef<HTMLCanvasElement>(null);
  const projectionLineRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<any[]>([]);

  useEffect(() => {
    loadScript(CHARTJS_URL).then(() => {
      chartsRef.current.forEach((c) => c?.destroy());
      chartsRef.current = [];

      const tickColor = "rgba(0,0,0,0.45)";
      const gridColor = "rgba(0,0,0,0.07)";

      // 1. Donut — payment status breakdown
      if (statusPieRef.current) {
        chartsRef.current.push(new window.Chart(statusPieRef.current, {
          type: "doughnut",
          data: {
            labels: ["Paid", "Unpaid", "Overdue"],
            datasets: [{ data: [paidCount, unpaidCount, overdueCount], backgroundColor: ["#1D9E75", "#EF9F27", "#E24B4A"], borderWidth: 0, hoverOffset: 5 }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} tenants` } },
            },
          },
        }));
      }

      // 2. Horizontal bar — collected vs outstanding per property
      const propMap: Record<string, { collected: number; outstanding: number }> = {};
      allRows.forEach((r) => {
        const k = r.propertyName ?? "Unknown";
        if (!propMap[k]) propMap[k] = { collected: 0, outstanding: 0 };
        propMap[k].collected += Number(r.amountPaid ?? 0);
        propMap[k].outstanding += Number(r.outstandingBalance ?? 0);
      });
      const propLabels = Object.keys(propMap).slice(0, 6);
      if (collectionBarRef.current) {
        chartsRef.current.push(new window.Chart(collectionBarRef.current, {
          type: "bar",
          data: {
            labels: propLabels.length ? propLabels : ["No Data"],
            datasets: [
              { label: "Collected", data: propLabels.map((k) => propMap[k].collected), backgroundColor: "#1D9E75", borderRadius: 5, borderSkipped: false, stack: "s" },
              { label: "Outstanding", data: propLabels.map((k) => propMap[k].outstanding), backgroundColor: "#EF9F27", borderRadius: 5, borderSkipped: false, stack: "s" },
            ],
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtInr(ctx.parsed.x)}` } },
            },
            scales: {
              x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => fmtK(v) } },
              y: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 } } },
            },
          },
        }));
      }

      // 3. Line — projected 12-month revenue
      const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
      const base = totalCollected;
      const growth = 1.02; // 2% MoM growth assumption
      const projected = months.map((_, i) => Math.round(base * Math.pow(growth, i)));
      const conservative = projected.map((v) => Math.round(v * 0.85));
      if (projectionLineRef.current) {
        chartsRef.current.push(new window.Chart(projectionLineRef.current, {
          type: "line",
          data: {
            labels: months,
            datasets: [
              {
                label: "Projected",
                data: projected,
                borderColor: "#378ADD",
                backgroundColor: "rgba(55,138,221,0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "#378ADD",
              },
              {
                label: "Conservative",
                data: conservative,
                borderColor: "#EF9F27",
                backgroundColor: "rgba(239,159,39,0.06)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: "#EF9F27",
                borderDash: [5, 4],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtInr(ctx.parsed.y)}` } },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 } } },
              y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => fmtK(v) } },
            },
          },
        }));
      }
    });
    return () => { chartsRef.current.forEach((c) => c?.destroy()); chartsRef.current = []; };
  }, [allRows]);

  // ── Column sort handler ───────────────────────────────────────────────────────
  function handleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
  }
  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // ─── filterChip style helper (outside S to avoid function-in-CSSProperties TS error) ───
  function filterChipStyle(active: boolean): CSSProperties {
    return {
      padding: "6px 14px",
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 20,
      border: `0.5px solid ${active ? "#111" : "rgba(0,0,0,0.18)"}`,
      cursor: "pointer",
      transition: "all 0.15s",
      background: active ? "#111" : "rgba(255,255,255,0.8)",
      color: active ? "#fff" : "#444",
    };
  }

  // ─── Styles ───────────────────────────────────────────────────────────────────
  const S: Record<string, CSSProperties> = {
    root: {
      fontFamily: "'DM Sans', sans-serif",
      minHeight: "100vh",
      background: `
        linear-gradient(135deg, rgba(240,248,255,0.95) 0%, rgba(232,244,235,0.9) 50%, rgba(255,248,235,0.92) 100%),
        url("https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1600&q=80")
      `,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      color: "#111",
    },
    inner: { maxWidth: 1120, margin: "0 auto", padding: "28px 24px 48px" },
    topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 12 },
    eyebrow: { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", marginBottom: 4 },
    heroName: { fontFamily: "'DM Serif Display', serif", fontSize: 28, lineHeight: 1.2, color: "#111" },
    logoutBtn: { fontSize: 13, fontWeight: 500, background: "rgba(255,255,255,0.8)", border: "0.5px solid rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 18px", cursor: "pointer", color: "#444", backdropFilter: "blur(8px)" },
    metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12, marginBottom: 28 },
    sectionTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "#111", marginBottom: 14 },
    chartGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
    chartCard: { background: "rgba(255,255,255,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" },
    chartCardFull: { background: "rgba(255,255,255,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "20px", boxShadow: "0 2px 16px rgba(0,0,0,0.06)", marginBottom: 24 },
    chartLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#888", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" },
    legend: { display: "flex", gap: 14, flexWrap: "wrap" as const, fontSize: 12, color: "#666" },
    filterBar: { display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 16, alignItems: "center" },
    input: { padding: "8px 12px", fontSize: 13, border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 10, background: "rgba(255,255,255,0.85)", color: "#111", outline: "none", minWidth: 180 },
    select: { padding: "8px 12px", fontSize: 13, border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 10, background: "rgba(255,255,255,0.85)", color: "#111", outline: "none", cursor: "pointer" },
    tableWrap: { overflowX: "auto", borderRadius: 14, border: "0.5px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.88)", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 1050 },
    th: { textAlign: "left", padding: "13px 14px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#666", background: "rgba(245,245,243,0.9)", borderBottom: "0.5px solid rgba(0,0,0,0.1)", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" },
    td: { padding: "12px 14px", fontSize: 13, borderBottom: "0.5px solid rgba(0,0,0,0.06)", verticalAlign: "middle" },
    emptyRow: { padding: "32px", textAlign: "center", color: "#999", fontSize: 14 },
    insightCard: {
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      border: "0.5px solid rgba(0,0,0,0.08)",
      borderRadius: 16,
      padding: "18px 20px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column" as const,
      gap: 6,
    },
  };

  return (
    <div style={S.root}>
      <div style={S.inner}>

        {/* ── Top bar ── */}
        <div style={S.topbar}>
          <div>
            <div style={S.eyebrow}>Analyst Dashboard</div>
            <div style={S.heroName}>
              Hello, <em style={{ fontStyle: "italic", color: "#1D9E75" }}>{user.username}.</em>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Pill value={user.role} variant="violet" />
              <span style={{ fontSize: 12, color: "#888" }}>
                {allRows.length} tenant{allRows.length !== 1 ? "s" : ""} · {collectionRate}% collection rate
              </span>
            </div>
          </div>
          <button style={S.logoutBtn} onClick={onLogout}>Logout</button>
        </div>

        {error && <p style={{ color: "#A32D2D", marginBottom: 16, fontSize: 14 }}>{error}</p>}

        {/* ── Metric Cards ── */}
        <div style={S.metricsGrid}>
          <MetricCard
            label="Total Collected"
            value={fmtInr(totalCollected)}
            sub="This cycle"
            accent="#1D9E75"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.6"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          />
          <MetricCard
            label="Outstanding"
            value={fmtInr(totalOutstanding)}
            sub="Pending collection"
            accent="#EF9F27"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          />
          <MetricCard
            label="Projected Annual"
            value={fmtInr(projectedAnnual)}
            sub="At current rate × 12"
            accent="#378ADD"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="1.6"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>}
          />
          <MetricCard
            label="Est. Net Profit"
            value={fmtInr(estimatedProfit)}
            sub="After ~30% expenses"
            accent="#5B3FBF"
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B3FBF" strokeWidth="1.6"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
          />
          <MetricCard
            label="Collection Rate"
            value={`${collectionRate}%`}
            sub={`${paidCount} of ${allRows.length} paid`}
            accent="#1D9E75"
          />
          <MetricCard
            label="Overdue"
            value={String(overdueCount)}
            sub={overdueCount > 0 ? "Needs attention" : "All clear"}
            accent="#E24B4A"
          />
        </div>

        {/* ── Charts row ── */}
        <div style={S.chartGrid}>
          {/* Donut — tenant status */}
          <div style={S.chartCard}>
            <div style={S.chartLabel}>
              <span>Tenant payment status</span>
              <div style={S.legend}>
                {[["#1D9E75","Paid"],["#EF9F27","Unpaid"],["#E24B4A","Overdue"]].map(([c, l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", width: 150, height: 150, flexShrink: 0 }}>
                <canvas ref={statusPieRef} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Paid", value: paidCount, color: "#1D9E75", bg: "#EAF3DE" },
                  { label: "Unpaid", value: unpaidCount, color: "#854F0B", bg: "#FAEEDA" },
                  { label: "Overdue", value: overdueCount, color: "#A32D2D", bg: "#FCEBEB" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#666", minWidth: 64 }}>{label}</span>
                    <span style={{ fontSize: 18, fontFamily: "'DM Serif Display', serif", color }}>{value}</span>
                    <span style={{ fontSize: 11, color, background: bg, padding: "1px 8px", borderRadius: 10, fontWeight: 600 }}>
                      {allRows.length > 0 ? Math.round((value / allRows.length) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar — collected vs outstanding by property */}
          <div style={S.chartCard}>
            <div style={S.chartLabel}>
              <span>Collected vs outstanding by property</span>
              <div style={S.legend}>
                {[["#1D9E75","Collected"],["#EF9F27","Outstanding"]].map(([c, l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ position: "relative", height: 180 }}>
              <canvas ref={collectionBarRef} />
            </div>
          </div>
        </div>

        {/* ── 12-month projection ── */}
        <div style={S.chartCardFull}>
          <div style={S.chartLabel}>
            <span>12-month revenue projection</span>
            <div style={S.legend}>
              {[["#378ADD","Projected (2% MoM growth)"],["#EF9F27","Conservative (−15%)"]].map(([c, l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ position: "relative", height: 200 }}>
            <canvas ref={projectionLineRef} />
          </div>
        </div>

        {/* ── Insight pills ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12, marginBottom: 28 }}>
          {[
            {
              label: "Avg Rent Collected",
              value: fmtInr(allRows.length > 0 ? Math.round(totalCollected / allRows.length) : 0),
              hint: "Per tenant this cycle",
              color: "#185FA5",
            },
            {
              label: "Avg Outstanding",
              value: fmtInr(allRows.length > 0 ? Math.round(totalOutstanding / allRows.length) : 0),
              hint: "Per tenant",
              color: "#854F0B",
            },
            {
              label: "Properties Managed",
              value: String(new Set(allRows.map((r) => r.propertyName)).size),
              hint: "Unique properties",
              color: "#0F6E56",
            },
            {
              label: "Total Tenants",
              value: String(allRows.length),
              hint: "Active viewer accounts",
              color: "#5B3FBF",
            },
          ].map(({ label, value, hint, color }) => (
            <div key={label} style={S.insightCard}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999" }}>{label}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color }}>{value}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{hint}</div>
            </div>
          ))}
        </div>

        {/* ── Tenant Table ── */}
        <div style={S.sectionTitle}>Tenant Overview</div>

        {/* Filter bar */}
        <div style={S.filterBar}>
          <input
            style={S.input}
            placeholder="Search name, email, property…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select style={S.select} value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}>
            {properties.map((p) => (
              <option key={p} value={p}>{p === "all" ? "All Properties" : p}</option>
            ))}
          </select>
          {(["all", "paid", "unpaid", "overdue"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              style={filterChipStyle(statusFilter === s)}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && (
                <span style={{ marginLeft: 5, opacity: 0.7 }}>
                  ({s === "paid" ? paidCount : s === "unpaid" ? unpaidCount : overdueCount})
                </span>
              )}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
            {filteredRows.length} result{filteredRows.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {([
                  ["Tenant", "username"],
                  ["Email", null],
                  ["Status", null],
                  ["Property", null],
                  ["Unit", null],
                  ["Due Date", "dueDate"],
                  ["Payment Status", null],
                  ["Paid", "amountPaid"],
                  ["Outstanding", "outstandingBalance"],
                  ["Method", null],
                ] as [string, typeof sortBy | null][]).map(([label, col]) => (
                  <th
                    key={label}
                    style={{ ...S.th, ...(col ? {} : { cursor: "default" }) }}
                    onClick={() => col && handleSort(col)}
                  >
                    {label} {col && <SortIcon col={col} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, i) => (
                  <tr
                    key={`${row.userId}-${row.propertyName}-${i}`}
                    style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)" }}
                  >
                    <td style={S.td}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{row.username}</div>
                    </td>
                    <td style={{ ...S.td, color: "#666" }}>{row.email}</td>
                    <td style={S.td}><Pill value={row.status ?? "—"} variant="gray" /></td>
                    <td style={S.td}>{row.propertyName ?? "—"}</td>
                    <td style={S.td}>
                      {row.unitNumber ?? "—"}{row.floor ? `, ${row.floor}` : ""}
                    </td>
                    <td style={{ ...S.td, color: "#666" }}>{row.dueDate ?? "—"}</td>
                    <td style={S.td}>
                      <Pill
                        value={row.paymentStatus ?? "—"}
                        variant={statusVariant(row.paymentStatus)}
                      />
                    </td>
                    <td style={{ ...S.td, fontWeight: 500, color: "#0F6E56" }}>
                      {row.amountPaid ? fmtInr(Number(row.amountPaid)) : "—"}
                    </td>
                    <td style={{ ...S.td, fontWeight: 500, color: Number(row.outstandingBalance) > 0 ? "#854F0B" : "#111" }}>
                      {row.outstandingBalance ? fmtInr(Number(row.outstandingBalance)) : "—"}
                    </td>
                    <td style={S.td}>{row.paymentMethod ?? "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={S.emptyRow}>No tenants match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

       

      </div>
    </div>
  );
}