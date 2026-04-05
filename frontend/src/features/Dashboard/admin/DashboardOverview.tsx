import { useEffect, useRef, useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { ApiUser, TenantDashboardRow } from "../../../api";
import {
  updateProperty,
  updatePayment,
  deleteProperty,
  deletePayment,
} from "../../../api";

type User = {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

type Props = {
  token: string;
  user: User;
  summary: any;
  error: string;
  usersError: string;
  users?: ApiUser[];
  tenantRows?: TenantDashboardRow[];
  records?: any[];
  onRefreshTenants: () => Promise<void>;
};

declare global {
  interface Window { Chart: any; }
}

const FONTS_URL = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap";
const CHARTJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}
function loadFont(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}

const font = "'DM Sans', sans-serif";

function fmtInr(v: number) { return "₹" + v.toLocaleString("en-IN"); }
function fmtK(v: number) {
  return v >= 1_00_000 ? "₹" + (v / 1_00_000).toFixed(1) + "L" : "₹" + (v / 1000).toFixed(0) + "k";
}

// ── Shared UI atoms ────────────────────────────────────────────────────────────

function Pill({ value, variant = "blue" }: { value: string; variant?: "blue"|"green"|"amber"|"red"|"gray"|"teal"|"violet"|"rose" }) {
  const map: Record<string, { bg: string; color: string }> = {
    blue:   { bg: "#E6F1FB", color: "#185FA5" },
    green:  { bg: "#EAF3DE", color: "#3B6D11" },
    amber:  { bg: "#FAEEDA", color: "#854F0B" },
    red:    { bg: "#FCEBEB", color: "#A32D2D" },
    gray:   { bg: "#F1EFE8", color: "#5F5E5A" },
    teal:   { bg: "#E1F5EE", color: "#0F6E56" },
    violet: { bg: "#EDE9FB", color: "#5B3FBF" },
    rose:   { bg: "#FDE8F0", color: "#A0284A" },
  };
  const { bg, color } = map[variant] ?? map.gray;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: bg, color, whiteSpace: "nowrap", fontFamily: font }}>
      {value || "—"}
    </span>
  );
}

function MetricCard({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "14px 16px", position: "relative", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "14px 14px 0 0" }} />}
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, lineHeight: 1, color: "#111", marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Drawer: slide-in edit panel (replaces inline row expansion) ───────────────

type DrawerMode = "property" | "payment" | null;

function EditDrawer({
  open, mode, row, saving,
  // property fields
  editPropertyName, setEditPropertyName,
  editFullAddress, setEditFullAddress,
  editUnitNumber, setEditUnitNumber,
  editFloor, setEditFloor,
  editPropertyType, setEditPropertyType,
  editFurnishingStatus, setEditFurnishingStatus,
  editAmenities, setEditAmenities,
  // payment fields
  editDueDate, setEditDueDate,
  editPaymentDate, setEditPaymentDate,
  editAmountPaid, setEditAmountPaid,
  editPaymentMethod, setEditPaymentMethod,
  editTransactionId, setEditTransactionId,
  editLateFees, setEditLateFees,
  editOutstandingBalance, setEditOutstandingBalance,
  editPaymentStatus, setEditPaymentStatus,
  onSave, onCancel,
}: any) {
  const inp: CSSProperties = {
    padding: "8px 10px", fontSize: 13, fontFamily: font,
    border: "0.5px solid rgba(0,0,0,0.18)", borderRadius: 8,
    background: "#fff", color: "#111", width: "100%", boxSizing: "border-box", outline: "none",
  };
  const field = (label: string, el: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#999", fontFamily: font }}>{label}</label>
      {el}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {open && <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.18)" }} />}

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 360, background: "#fff",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        fontFamily: font,
      }}>
        {/* Drawer header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "0.5px solid rgba(0,0,0,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafaf9" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: 3 }}>
              {mode === "property" ? "Property" : "Payment"}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#111" }}>
              Edit {mode === "property" ? "Property Details" : "Payment Record"}
            </div>
          </div>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.15)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#666" }}>×</button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "property" && <>
            {field("Property Name", <input value={editPropertyName} onChange={e => setEditPropertyName(e.target.value)} style={inp} placeholder="e.g. Sunrise Apartments" />)}
            {field("Full Address",  <input value={editFullAddress}  onChange={e => setEditFullAddress(e.target.value)}  style={inp} placeholder="Street, City, PIN" />)}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {field("Unit No.",  <input value={editUnitNumber} onChange={e => setEditUnitNumber(e.target.value)} style={inp} placeholder="4B" />)}
              {field("Floor",    <input value={editFloor}      onChange={e => setEditFloor(e.target.value)}      style={inp} placeholder="3rd" />)}
            </div>
            {field("Property Type", (
              <select value={editPropertyType} onChange={e => setEditPropertyType(e.target.value as any)} style={inp}>
                <option value="apartment">Apartment</option>
                <option value="pg">PG</option>
                <option value="villa">Villa</option>
                <option value="other">Other</option>
              </select>
            ))}
            {field("Furnishing", (
              <select value={editFurnishingStatus} onChange={e => setEditFurnishingStatus(e.target.value as any)} style={inp}>
                <option value="furnished">Furnished</option>
                <option value="semi_furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            ))}
            {field("Amenities", <input value={editAmenities} onChange={e => setEditAmenities(e.target.value)} style={inp} placeholder="WiFi, AC, Parking (comma separated)" />)}
          </>}

          {mode === "payment" && <>
            {field("Payment Status", (
              <select value={editPaymentStatus} onChange={e => setEditPaymentStatus(e.target.value as any)} style={inp}>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="overdue">Overdue</option>
              </select>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {field("Due Date",     <input type="date" value={editDueDate}     onChange={e => setEditDueDate(e.target.value)}     style={inp} />)}
              {field("Payment Date", <input type="date" value={editPaymentDate} onChange={e => setEditPaymentDate(e.target.value)} style={inp} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {field("Amount Paid",  <input type="number" value={editAmountPaid}          onChange={e => setEditAmountPaid(e.target.value)}          style={inp} placeholder="0" />)}
              {field("Late Fees",    <input type="number" value={editLateFees}            onChange={e => setEditLateFees(e.target.value)}            style={inp} placeholder="0" />)}
            </div>
            {field("Outstanding",  <input type="number" value={editOutstandingBalance} onChange={e => setEditOutstandingBalance(e.target.value)} style={inp} placeholder="0" />)}
            {field("Payment Method", (
              <select value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value as any)} style={inp}>
                <option value="">Select…</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            ))}
            {field("Transaction ID", <input value={editTransactionId} onChange={e => setEditTransactionId(e.target.value)} style={inp} placeholder="UTR / Ref no." />)}
          </>}
        </div>

        {/* Drawer footer */}
        <div style={{ padding: "16px 22px", borderTop: "0.5px solid rgba(0,0,0,0.08)", display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.18)", background: "#fff", color: "#555", fontFamily: font, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: "#111", color: "#fff", fontFamily: font, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {saving ? "Saving…" : `Save ${mode === "property" ? "Property" : "Payment"}`}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Compact icon buttons ──────────────────────────────────────────────────────

function IconBtn({ title, onClick, disabled, variant }: { title: string; onClick: () => void; disabled?: boolean; variant: "default" | "danger" | "amber" }) {
  const colors = {
    default: { bg: "#fff",    color: "#555",    border: "rgba(0,0,0,0.15)" },
    danger:  { bg: "#FCEBEB", color: "#A32D2D", border: "rgba(162,45,45,0.2)" },
    amber:   { bg: "#FEF3C7", color: "#92400E", border: "rgba(146,64,14,0.2)" },
  };
  const c = colors[variant];
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "4px 9px", borderRadius: 6, border: `0.5px solid ${c.border}`,
        background: c.bg, color: c.color,
        fontSize: 11, fontWeight: 500, fontFamily: font,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        whiteSpace: "nowrap",
        transition: "opacity 0.15s",
      }}
    >
      {title}
    </button>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────

type FilterStatus = "all" | "paid" | "unpaid" | "overdue";

function statusVariant(s: string | null | undefined): "green" | "amber" | "red" | "gray" {
  if (s === "paid")    return "green";
  if (s === "unpaid")  return "amber";
  if (s === "overdue") return "red";
  return "gray";
}
function roleVariant(r: string): "violet" | "blue" | "rose" {
  if (r === "admin")   return "rose";
  if (r === "analyst") return "violet";
  return "blue";
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DashboardOverview({
  token, user, summary, error, usersError,
  users = [], tenantRows = [], records = [],
  onRefreshTenants,
}: Props) {
  useEffect(() => { loadFont(FONTS_URL); }, []);

  // ── Filters / tabs ──────────────────────────────────────────────────────────
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState<FilterStatus>("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [sortBy,         setSortBy]         = useState<"username"|"amountPaid"|"outstandingBalance"|"dueDate">("username");
  const [sortDir,        setSortDir]        = useState<"asc"|"desc">("asc");
  const [activeTab,      setActiveTab]      = useState<"tenants"|"users"|"records">("tenants");

  // ── Drawer state ────────────────────────────────────────────────────────────
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [drawerMode,    setDrawerMode]    = useState<DrawerMode>(null);
  const [drawerRow,     setDrawerRow]     = useState<TenantDashboardRow | null>(null);
  const [savingTenant,  setSavingTenant]  = useState(false);

  // property edit fields
  const [editPropertyName,     setEditPropertyName]     = useState("");
  const [editFullAddress,      setEditFullAddress]      = useState("");
  const [editUnitNumber,       setEditUnitNumber]       = useState("");
  const [editFloor,            setEditFloor]            = useState("");
  const [editPropertyType,     setEditPropertyType]     = useState<"apartment"|"pg"|"villa"|"other">("apartment");
  const [editFurnishingStatus, setEditFurnishingStatus] = useState<"furnished"|"semi_furnished"|"unfurnished">("unfurnished");
  const [editAmenities,        setEditAmenities]        = useState("");

  // payment edit fields
  const [editDueDate,            setEditDueDate]            = useState("");
  const [editPaymentDate,        setEditPaymentDate]        = useState("");
  const [editAmountPaid,         setEditAmountPaid]         = useState("");
  const [editPaymentMethod,      setEditPaymentMethod]      = useState<"upi"|"bank_transfer"|"cash"|"card"|"other"|"">("");
  const [editTransactionId,      setEditTransactionId]      = useState("");
  const [editLateFees,           setEditLateFees]           = useState("");
  const [editOutstandingBalance, setEditOutstandingBalance] = useState("");
  const [editPaymentStatus,      setEditPaymentStatus]      = useState<"paid"|"unpaid"|"overdue">("unpaid");

  // ── Derived data ────────────────────────────────────────────────────────────
  const allRows = tenantRows.filter(r => r.role === "viewer");

  const properties = useMemo(() => {
    const set = new Set(allRows.map(r => r.propertyName ?? "—"));
    return ["all", ...Array.from(set)];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (statusFilter !== "all")    rows = rows.filter(r => r.paymentStatus === statusFilter);
    if (propertyFilter !== "all")  rows = rows.filter(r => (r.propertyName ?? "—") === propertyFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.username?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.propertyName?.toLowerCase().includes(q) ||
        r.fullAddress?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let av: any = (a as any)[sortBy] ?? "";
      let bv: any = (b as any)[sortBy] ?? "";
      if (sortBy === "amountPaid" || sortBy === "outstandingBalance") { av = Number(av); bv = Number(bv); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [allRows, statusFilter, propertyFilter, search, sortBy, sortDir]);

  const totalCollected   = allRows.reduce((s, r) => s + Number(r.amountPaid ?? 0), 0);
  const totalOutstanding = allRows.reduce((s, r) => s + Number(r.outstandingBalance ?? 0), 0);
  const paidCount        = allRows.filter(r => r.paymentStatus === "paid").length;
  const overdueCount     = allRows.filter(r => r.paymentStatus === "overdue").length;
  const unpaidCount      = allRows.filter(r => r.paymentStatus === "unpaid").length;
  const collectionRate   = allRows.length > 0 ? Math.round((paidCount / allRows.length) * 100) : 0;
  const projectedAnnual  = totalCollected * 12;
  const estimatedProfit  = Math.round(projectedAnnual * 0.7);

  const totalIncome   = summary?.totalIncome   ? Number(summary.totalIncome)   : 0;
  const totalExpenses = summary?.totalExpenses ? Number(summary.totalExpenses) : 0;
  const netBalance    = summary?.netBalance    ? Number(summary.netBalance)    : 0;

  const totalUsers  = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const adminCount  = users.filter(u => u.role === "admin").length;
  const analystCount= users.filter(u => u.role === "analyst").length;
  const viewerCount = users.filter(u => u.role === "viewer").length;

  // ── Charts ──────────────────────────────────────────────────────────────────
  const statusPieRef      = useRef<HTMLCanvasElement>(null);
  const collectionBarRef  = useRef<HTMLCanvasElement>(null);
  const projectionLineRef = useRef<HTMLCanvasElement>(null);
  const userRoleRef       = useRef<HTMLCanvasElement>(null);
  const incomeExpenseRef  = useRef<HTMLCanvasElement>(null);
  const chartsRef         = useRef<any[]>([]);

  useEffect(() => {
    loadScript(CHARTJS_URL).then(() => {
      chartsRef.current.forEach(c => c?.destroy());
      chartsRef.current = [];
      const tickColor = "rgba(0,0,0,0.4)";
      const gridColor = "rgba(0,0,0,0.06)";

      if (statusPieRef.current) chartsRef.current.push(new window.Chart(statusPieRef.current, {
        type: "doughnut",
        data: { labels: ["Paid","Unpaid","Overdue"], datasets: [{ data: [paidCount,unpaidCount,overdueCount], backgroundColor: ["#1D9E75","#EF9F27","#E24B4A"], borderWidth: 0, hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed} tenants` } } } },
      }));

      const propMap: Record<string, { collected: number; outstanding: number }> = {};
      allRows.forEach(r => {
        const k = r.propertyName ?? "Unknown";
        if (!propMap[k]) propMap[k] = { collected: 0, outstanding: 0 };
        propMap[k].collected   += Number(r.amountPaid ?? 0);
        propMap[k].outstanding += Number(r.outstandingBalance ?? 0);
      });
      const propLabels = Object.keys(propMap).slice(0, 6);

      if (collectionBarRef.current) chartsRef.current.push(new window.Chart(collectionBarRef.current, {
        type: "bar",
        data: { labels: propLabels.length ? propLabels : ["No Data"], datasets: [
          { label: "Collected",    data: propLabels.map(k => propMap[k].collected),    backgroundColor: "#1D9E75", borderRadius: 5, borderSkipped: false, stack: "s" },
          { label: "Outstanding",  data: propLabels.map(k => propMap[k].outstanding),  backgroundColor: "#EF9F27", borderRadius: 5, borderSkipped: false, stack: "s" },
        ]},
        options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtInr(ctx.parsed.x)}` } } }, scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => fmtK(v) } },
          y: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 } } },
        }},
      }));

      const months = ["May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr"];
      const base = totalCollected;
      const projected    = months.map((_, i) => Math.round(base * Math.pow(1.02, i)));
      const conservative = projected.map(v => Math.round(v * 0.85));

      if (projectionLineRef.current) chartsRef.current.push(new window.Chart(projectionLineRef.current, {
        type: "line",
        data: { labels: months, datasets: [
          { label: "Projected",    data: projected,    borderColor: "#378ADD", backgroundColor: "rgba(55,138,221,0.08)", borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: "#378ADD" },
          { label: "Conservative", data: conservative, borderColor: "#EF9F27", backgroundColor: "rgba(239,159,39,0.05)", borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: "#EF9F27", borderDash: [5,4] },
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtInr(ctx.parsed.y)}` } } }, scales: {
          x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 } } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => fmtK(v) } },
        }},
      }));

      if (userRoleRef.current) chartsRef.current.push(new window.Chart(userRoleRef.current, {
        type: "doughnut",
        data: { labels: ["Admin","Analyst","Viewer"], datasets: [{ data: [adminCount,analystCount,viewerCount], backgroundColor: ["#A0284A","#5B3FBF","#185FA5"], borderWidth: 0, hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false } } },
      }));

      if (incomeExpenseRef.current) chartsRef.current.push(new window.Chart(incomeExpenseRef.current, {
        type: "bar",
        data: { labels: ["Income","Expenses","Net"], datasets: [{ data: [totalIncome,totalExpenses,netBalance], backgroundColor: ["#1D9E75","#E24B4A", netBalance >= 0 ? "#378ADD" : "#EF9F27"], borderRadius: 6, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => fmtInr(ctx.parsed.y) } } }, scales: {
          x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 13 } } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => fmtK(v) } },
        }},
      }));
    });
    return () => { chartsRef.current.forEach(c => c?.destroy()); chartsRef.current = []; };
  }, [allRows, users, summary]);

  // ── Sort helper ─────────────────────────────────────────────────────────────
  function handleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }
  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <span style={{ opacity: 0.25 }}>↕</span>;
    return <span style={{ color: "#1D9E75" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // ── Drawer helpers ──────────────────────────────────────────────────────────
  function openPropertyDrawer(row: TenantDashboardRow) {
    setDrawerRow(row);
    setDrawerMode("property");
    setEditPropertyName(row.propertyName ?? "");
    setEditFullAddress(row.fullAddress ?? "");
    setEditUnitNumber(row.unitNumber ?? "");
    setEditFloor(row.floor ?? "");
    setEditPropertyType((row.propertyType as any) ?? "apartment");
    setEditFurnishingStatus((row.furnishingStatus as any) ?? "unfurnished");
    setEditAmenities((row.amenities ?? []).join(", "));
    setDrawerOpen(true);
  }

  function openPaymentDrawer(row: TenantDashboardRow) {
    setDrawerRow(row);
    setDrawerMode("payment");
    setEditDueDate(row.dueDate ?? "");
    setEditPaymentDate(row.paymentDate ?? "");
    setEditAmountPaid(row.amountPaid ? String(row.amountPaid) : "0");
    setEditPaymentMethod((row.paymentMethod as any) ?? "");
    setEditTransactionId(row.transactionId ?? "");
    setEditLateFees(row.lateFees ? String(row.lateFees) : "0");
    setEditOutstandingBalance(row.outstandingBalance ? String(row.outstandingBalance) : "0");
    setEditPaymentStatus((row.paymentStatus as any) ?? "unpaid");
    setDrawerOpen(true);
  }

  function cancelDrawer() {
    setDrawerOpen(false);
    setDrawerMode(null);
    setDrawerRow(null);
    setSavingTenant(false);
  }

  async function handleDrawerSave() {
    if (!drawerRow) return;
    try {
      setSavingTenant(true);
      if (drawerMode === "property") {
        if (!drawerRow.propertyId) { alert("Property ID not found."); return; }
        await updateProperty(token, drawerRow.propertyId, {
          propertyName: editPropertyName, fullAddress: editFullAddress,
          unitNumber: editUnitNumber, floor: editFloor,
          propertyType: editPropertyType, furnishingStatus: editFurnishingStatus,
          amenities: editAmenities.split(",").map(s => s.trim()).filter(Boolean),
        });
      } else {
        if (!drawerRow.paymentId) { alert("Payment ID not found."); return; }
        await updatePayment(token, drawerRow.paymentId, {
          dueDate: editDueDate, paymentDate: editPaymentDate || null,
          amountPaid: Number(editAmountPaid || 0), paymentMethod: editPaymentMethod || null,
          transactionId: editTransactionId || null, lateFees: Number(editLateFees || 0),
          outstandingBalance: Number(editOutstandingBalance || 0), paymentStatus: editPaymentStatus,
        });
      }
      await onRefreshTenants();
      cancelDrawer();
    } catch (e: any) {
      alert(e.message ?? "Failed to save");
      setSavingTenant(false);
    }
  }

  async function handleDeletePropertyRow(row: TenantDashboardRow) {
    if (!row.propertyId) { alert("Property ID not found."); return; }
    if (!window.confirm("Delete this property?")) return;
    try { await deleteProperty(token, row.propertyId); await onRefreshTenants(); }
    catch (e: any) { alert(e.message ?? "Failed to delete property"); }
  }

  async function handleDeletePaymentRow(row: TenantDashboardRow) {
    if (!row.paymentId) { alert("Payment ID not found."); return; }
    if (!window.confirm("Delete this payment?")) return;
    try { await deletePayment(token, row.paymentId); await onRefreshTenants(); }
    catch (e: any) { alert(e.message ?? "Failed to delete payment"); }
  }

  // ── Shared style atoms ──────────────────────────────────────────────────────
  const card: CSSProperties = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" };
  const chartLabel: CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#aaa", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" };
  const legend: CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "#777" };
  const sectionTitle: CSSProperties = { fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#111", marginBottom: 14, marginTop: 28 };

  function tabStyle(active: boolean): CSSProperties {
    return { padding: "7px 16px", fontSize: 13, fontWeight: 600, borderRadius: 9, border: "none", cursor: "pointer", transition: "all 0.15s", background: active ? "#111" : "transparent", color: active ? "#fff" : "#777", fontFamily: font };
  }
  function chipStyle(active: boolean, activeColor = "#111", activeBg = "#111"): CSSProperties {
    return { padding: "5px 12px", fontSize: 12, fontWeight: 600, borderRadius: 20, border: `0.5px solid ${active ? activeColor : "rgba(0,0,0,0.15)"}`, cursor: "pointer", transition: "all 0.15s", background: active ? activeBg : "#fff", color: active ? "#fff" : "#555", fontFamily: font };
  }

  // table th
  const th: CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#999", background: "#fafaf9", borderBottom: "0.5px solid rgba(0,0,0,0.08)", whiteSpace: "nowrap" };
  const td = (i: number): CSSProperties => ({ padding: "10px 12px", fontSize: 13, borderBottom: "0.5px solid rgba(0,0,0,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.012)", verticalAlign: "middle" });

  return (
    <div style={{ fontFamily: font, color: "#111" }}>

      {/* ── Hero banner ── */}
      <div style={{ background: "linear-gradient(120deg, #0f1f14 0%, #1a3a24 60%, #0d2030 100%)", borderRadius: 16, padding: "22px 26px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.14)" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 5 }}>Admin Dashboard</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "#fff", lineHeight: 1.2 }}>
            Hello, <em style={{ fontStyle: "italic", color: "#4FD1A5" }}>{user.username}.</em>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7 }}>
            <Pill value="admin" variant="rose" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              {totalUsers} users · {allRows.length} tenants · {collectionRate}% collection rate
            </span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Net Balance",    value: fmtInr(netBalance), color: netBalance >= 0 ? "#4FD1A5" : "#F87171" },
            { label: "Collection Rate",value: `${collectionRate}%`, color: "#93C5FD" },
            { label: "Active Users",   value: String(activeUsers),  color: "#C4B5FD" },
            { label: "Overdue",        value: String(overdueCount), color: overdueCount > 0 ? "#FCA5A5" : "#4FD1A5" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 19, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {(error || usersError) && <p style={{ color: "#A32D2D", marginBottom: 16, fontSize: 13 }}>{error || usersError}</p>}

      {/* ── Metric strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard label="Total Collected"   value={fmtInr(totalCollected)}   sub="This cycle"          accent="#1D9E75" />
        <MetricCard label="Outstanding"        value={fmtInr(totalOutstanding)} sub="Pending collection"  accent="#EF9F27" />
        <MetricCard label="Total Income"       value={fmtInr(totalIncome)}      sub="All records"         accent="#378ADD" />
        <MetricCard label="Total Expenses"     value={fmtInr(totalExpenses)}    sub="All records"         accent="#E24B4A" />
        <MetricCard label="Net Balance"        value={fmtInr(netBalance)}       sub="Income − Expenses"   accent={netBalance >= 0 ? "#1D9E75" : "#E24B4A"} />
        <MetricCard label="Projected Annual"   value={fmtInr(projectedAnnual)}  sub="At current rate ×12" accent="#5B3FBF" />
        <MetricCard label="Est. Net Profit"    value={fmtInr(estimatedProfit)}  sub="After ~30% expenses" accent="#0F6E56" />
        <MetricCard label="Total Users"        value={String(totalUsers)}       sub={`${activeUsers} active`} accent="#185FA5" />
      </div>

      {/* ── Charts row 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={card}>
          <div style={chartLabel}>
            <span>Tenant payment status</span>
            <div style={legend}>{[["#1D9E75","Paid"],["#EF9F27","Unpaid"],["#E24B4A","Overdue"]].map(([c,l]) => <span key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />{l}</span>)}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}><canvas ref={statusPieRef} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {[{ label:"Paid",value:paidCount,color:"#1D9E75",bg:"#EAF3DE"},{ label:"Unpaid",value:unpaidCount,color:"#854F0B",bg:"#FAEEDA"},{ label:"Overdue",value:overdueCount,color:"#A32D2D",bg:"#FCEBEB"}].map(({label,value,color,bg}) => (
                <div key={label} style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:12,color:"#777",minWidth:52 }}>{label}</span>
                  <span style={{ fontFamily:"'DM Serif Display',serif",fontSize:18,color }}>{value}</span>
                  <span style={{ fontSize:10,color,background:bg,padding:"1px 7px",borderRadius:10,fontWeight:600 }}>{allRows.length>0?Math.round((value/allRows.length)*100):0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={card}>
          <div style={chartLabel}><span>Collected vs outstanding by property</span><div style={legend}>{[["#1D9E75","Collected"],["#EF9F27","Outstanding"]].map(([c,l])=><span key={l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/>{l}</span>)}</div></div>
          <div style={{ position:"relative",height:160 }}><canvas ref={collectionBarRef}/></div>
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14 }}>
        <div style={card}>
          <div style={chartLabel}><span>12-month revenue projection</span><div style={legend}>{[["#378ADD","Projected (2% MoM)"],["#EF9F27","Conservative (−15%)"]].map(([c,l])=><span key={l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/>{l}</span>)}</div></div>
          <div style={{ position:"relative",height:180 }}><canvas ref={projectionLineRef}/></div>
        </div>
        <div style={card}>
          <div style={chartLabel}><span>Income vs expenses</span></div>
          <div style={{ position:"relative",height:180 }}><canvas ref={incomeExpenseRef}/></div>
        </div>
      </div>

      {/* ── Charts row 3 ── */}
      <div style={{ display:"grid",gridTemplateColumns:"1fr 2fr",gap:14,marginBottom:14 }}>
        <div style={card}>
          <div style={chartLabel}><span>User role breakdown</span><div style={legend}>{[["#A0284A","Admin"],["#5B3FBF","Analyst"],["#185FA5","Viewer"]].map(([c,l])=><span key={l} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/>{l}</span>)}</div></div>
          <div style={{ display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
            <div style={{ position:"relative",width:110,height:110,flexShrink:0 }}><canvas ref={userRoleRef}/></div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[{label:"Admin",value:adminCount,color:"#A0284A"},{label:"Analyst",value:analystCount,color:"#5B3FBF"},{label:"Viewer",value:viewerCount,color:"#185FA5"}].map(({label,value,color})=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"#777",minWidth:50}}>{label}</span><span style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color}}>{value}</span></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[
            { label:"Avg Rent Collected",  value:fmtInr(allRows.length>0?Math.round(totalCollected/allRows.length):0),   hint:"Per tenant this cycle", color:"#185FA5" },
            { label:"Avg Outstanding",     value:fmtInr(allRows.length>0?Math.round(totalOutstanding/allRows.length):0), hint:"Per tenant",            color:"#854F0B" },
            { label:"Properties Managed",  value:String(new Set(allRows.map(r=>r.propertyName)).size),                   hint:"Unique properties",     color:"#0F6E56" },
            { label:"Active Tenants",      value:String(allRows.length),                                                  hint:"Viewer accounts",       color:"#5B3FBF" },
          ].map(({label,value,hint,color})=>(
            <div key={label} style={{...card,display:"flex",flexDirection:"column",gap:4}}>
              <div style={{fontSize:9,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",color:"#bbb"}}>{label}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color}}>{value}</div>
              <div style={{fontSize:11,color:"#bbb"}}>{hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Explorer ── */}
      <div style={sectionTitle}>Data Explorer</div>

      <div style={{ display:"flex",gap:4,marginBottom:14,background:"#f5f5f3",borderRadius:12,padding:4,width:"fit-content" }}>
        {(["tenants","users","records"] as const).map(t=>(
          <button key={t} style={tabStyle(activeTab===t)} onClick={()=>setActiveTab(t)}>
            {t==="tenants"?`Tenants (${allRows.length})`:t==="users"?`Users (${users.length})`:`Records (${records.length})`}
          </button>
        ))}
      </div>

      {/* ── Tenants tab ── */}
      {activeTab === "tenants" && (
        <>
          {/* Filter bar */}
          <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center" }}>
            <div style={{ position:"relative",flex:"1 1 180px",maxWidth:240 }}>
              <svg style={{ position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ padding:"7px 10px 7px 28px",fontSize:13,border:"0.5px solid rgba(0,0,0,0.18)",borderRadius:8,background:"#fff",color:"#111",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:font }} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} />
            </div>

            <select value={propertyFilter} onChange={e=>setPropertyFilter(e.target.value)} style={{ padding:"7px 10px",fontSize:13,border:"0.5px solid rgba(0,0,0,0.18)",borderRadius:8,background:"#fff",color:"#111",outline:"none",cursor:"pointer",fontFamily:font }}>
              {properties.map(p=><option key={p} value={p}>{p==="all"?"All Properties":p}</option>)}
            </select>

            <div style={{ display:"flex",gap:6 }}>
              {(["all","paid","unpaid","overdue"] as FilterStatus[]).map(s=>(
                <button key={s} style={chipStyle(statusFilter===s)} onClick={()=>setStatusFilter(s)}>
                  {s==="all"?"All":s.charAt(0).toUpperCase()+s.slice(1)}
                  {s!=="all" && <span style={{marginLeft:4,opacity:0.65}}>({s==="paid"?paidCount:s==="unpaid"?unpaidCount:overdueCount})</span>}
                </button>
              ))}
            </div>

            <span style={{ marginLeft:"auto",fontSize:12,color:"#aaa",fontFamily:font }}>{filteredRows.length} result{filteredRows.length!==1?"s":""}</span>
          </div>

          {/* Table — constrained, no x-scroll */}
          <div style={{ border:"0.5px solid rgba(0,0,0,0.09)",borderRadius:12,background:"#fff",boxShadow:"0 1px 8px rgba(0,0,0,0.04)",overflow:"hidden" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",tableLayout:"fixed" }}>
              <colgroup>
                <col style={{ width:"14%" }} />  {/* Tenant */}
                <col style={{ width:"16%" }} />  {/* Property */}
                <col style={{ width:"8%" }}  />  {/* Unit */}
                <col style={{ width:"9%" }}  />  {/* Due Date */}
                <col style={{ width:"9%" }}  />  {/* Status */}
                <col style={{ width:"11%" }} />  {/* Paid */}
                <col style={{ width:"11%" }} />  {/* Outstanding */}
                <col style={{ width:"9%" }}  />  {/* Method */}
                <col style={{ width:"13%" }} />  {/* Actions */}
              </colgroup>
              <thead>
                <tr>
                  {([["Tenant","username"],["Property",null],["Unit",null],["Due","dueDate"],["Status",null],["Paid","amountPaid"],["Balance","outstandingBalance"],["Method",null],["Actions",null]] as [string,typeof sortBy|null][]).map(([label,col])=>(
                    <th key={label} onClick={()=>col&&handleSort(col)} style={{ ...th, cursor:col?"pointer":"default", userSelect:"none" }}>
                      {label} {col&&<SortIcon col={col}/>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? filteredRows.map((row, i) => (
                  <tr key={`${row.userId}-${row.propertyId}-${row.paymentId}-${i}`}>
                    <td style={{ ...td(i), fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{row.username}</div>
                      <div style={{ fontSize:11,color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{row.email}</div>
                    </td>
                    <td style={{ ...td(i), overflow:"hidden" }}>
                      <div style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13 }}>{row.propertyName??"—"}</div>
                      <div style={{ fontSize:11,color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{row.fullAddress??""}</div>
                    </td>
                    <td style={{ ...td(i), fontSize:12, color:"#666" }}>
                      {row.unitNumber??"—"}{row.floor?`, ${row.floor}`:""}
                    </td>
                    <td style={{ ...td(i), fontSize:12, color:"#666", whiteSpace:"nowrap" }}>
                      {row.dueDate??"—"}
                    </td>
                    <td style={td(i)}>
                      <Pill value={row.paymentStatus??"—"} variant={statusVariant(row.paymentStatus)} />
                    </td>
                    <td style={{ ...td(i), fontWeight:500, color:"#0F6E56", whiteSpace:"nowrap" }}>
                      {row.amountPaid?fmtInr(Number(row.amountPaid)):"—"}
                    </td>
                    <td style={{ ...td(i), fontWeight:500, color:Number(row.outstandingBalance)>0?"#854F0B":"#111", whiteSpace:"nowrap" }}>
                      {row.outstandingBalance?fmtInr(Number(row.outstandingBalance)):"—"}
                    </td>
                    <td style={{ ...td(i), fontSize:12, color:"#666" }}>
                      {row.paymentMethod??"—"}
                    </td>
                    {/* ── Compact action cell ── */}
                    <td style={td(i)}>
                      <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                        <IconBtn title="Edit Property" onClick={()=>openPropertyDrawer(row)} disabled={!row.propertyId} variant="default" />
                        <IconBtn title="Edit Payment"  onClick={()=>openPaymentDrawer(row)}  disabled={!row.paymentId}  variant="default" />
                        <IconBtn title="Del Property"  onClick={()=>handleDeletePropertyRow(row)} disabled={!row.propertyId} variant="danger" />
                        <IconBtn title="Del Payment"   onClick={()=>handleDeletePaymentRow(row)}  disabled={!row.paymentId}  variant="amber" />
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} style={{ padding:"32px",textAlign:"center",color:"#bbb",fontSize:14 }}>No tenants match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Users tab ── */}
      {activeTab === "users" && (
        <div style={{ border:"0.5px solid rgba(0,0,0,0.09)",borderRadius:12,background:"#fff",boxShadow:"0 1px 8px rgba(0,0,0,0.04)",overflow:"hidden" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",tableLayout:"fixed" }}>
            <colgroup>
              <col style={{width:"6%"}} />
              <col style={{width:"20%"}} />
              <col style={{width:"34%"}} />
              <col style={{width:"14%"}} />
              <col style={{width:"13%"}} />
              <col style={{width:"13%"}} />
            </colgroup>
            <thead>
              <tr>{["ID","Username","Email","Role","Status","Created"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((u,i)=>(
                <tr key={u.id}>
                  <td style={{ ...td(i),fontSize:12,color:"#bbb" }}>#{u.id}</td>
                  <td style={{ ...td(i),fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.username}</td>
                  <td style={{ ...td(i),color:"#777",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.email}</td>
                  <td style={td(i)}><Pill value={u.role} variant={roleVariant(u.role)} /></td>
                  <td style={td(i)}><Pill value={u.status} variant={u.status==="active"?"green":"gray"} /></td>
                  <td style={{ ...td(i),fontSize:12,color:"#bbb" }}>{u.createdAt?new Date(u.createdAt).toLocaleDateString("en-IN"):"—"}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ padding:"32px",textAlign:"center",color:"#bbb",fontSize:14 }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Records tab ── */}
      {activeTab === "records" && (
        <div style={{ border:"0.5px solid rgba(0,0,0,0.09)",borderRadius:12,background:"#fff",boxShadow:"0 1px 8px rgba(0,0,0,0.04)",overflow:"hidden" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",tableLayout:"fixed" }}>
            <colgroup>
              <col style={{width:"7%"}} />
              <col style={{width:"13%"}} />
              <col style={{width:"12%"}} />
              <col style={{width:"22%"}} />
              <col style={{width:"16%"}} />
              <col style={{width:"30%"}} />
            </colgroup>
            <thead>
              <tr>{["ID","Date","Type","Category","Amount","Notes"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map((r:any,i:number)=>(
                <tr key={r.id??i}>
                  <td style={{ ...td(i),fontSize:12,color:"#bbb" }}>#{r.id}</td>
                  <td style={{ ...td(i),color:"#777",whiteSpace:"nowrap" }}>{r.date??"—"}</td>
                  <td style={td(i)}><Pill value={r.type} variant={r.type==="income"?"teal":"red"} /></td>
                  <td style={{ ...td(i),overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.category??"—"}</td>
                  <td style={{ ...td(i),fontWeight:500,color:r.type==="income"?"#0F6E56":"#A32D2D",whiteSpace:"nowrap" }}>{fmtInr(Number(r.amount??0))}</td>
                  <td style={{ ...td(i),color:"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.notes??"—"}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ padding:"32px",textAlign:"center",color:"#bbb",fontSize:14 }}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Slide-out edit drawer ── */}
      <EditDrawer
        open={drawerOpen} mode={drawerMode} row={drawerRow} saving={savingTenant}
        editPropertyName={editPropertyName} setEditPropertyName={setEditPropertyName}
        editFullAddress={editFullAddress}   setEditFullAddress={setEditFullAddress}
        editUnitNumber={editUnitNumber}     setEditUnitNumber={setEditUnitNumber}
        editFloor={editFloor}               setEditFloor={setEditFloor}
        editPropertyType={editPropertyType} setEditPropertyType={setEditPropertyType}
        editFurnishingStatus={editFurnishingStatus} setEditFurnishingStatus={setEditFurnishingStatus}
        editAmenities={editAmenities}       setEditAmenities={setEditAmenities}
        editDueDate={editDueDate}           setEditDueDate={setEditDueDate}
        editPaymentDate={editPaymentDate}   setEditPaymentDate={setEditPaymentDate}
        editAmountPaid={editAmountPaid}     setEditAmountPaid={setEditAmountPaid}
        editPaymentMethod={editPaymentMethod} setEditPaymentMethod={setEditPaymentMethod}
        editTransactionId={editTransactionId} setEditTransactionId={setEditTransactionId}
        editLateFees={editLateFees}         setEditLateFees={setEditLateFees}
        editOutstandingBalance={editOutstandingBalance} setEditOutstandingBalance={setEditOutstandingBalance}
        editPaymentStatus={editPaymentStatus} setEditPaymentStatus={setEditPaymentStatus}
        onSave={handleDrawerSave} onCancel={cancelDrawer}
      />
    </div>
  );
}