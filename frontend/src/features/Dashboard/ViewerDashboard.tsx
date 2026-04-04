import { useEffect, useRef, useState } from "react";

type User = {
  id: number;
  username: string;
  email: string;
  role: "viewer" | "analyst" | "admin";
};

type PropertyData = {
  propertyName: string;
  fullAddress: string;
  unitNumber: string;
  floor: string;
  propertyType: string;
  furnishingStatus: string;
  amenities: string;
};

type PaymentData = {
  dueDate: string;
  paymentDate: string;
  amountPaid: string;
  paymentMethod: string;
  transactionId: string;
  lateFees: string;
  outstandingBalance: string;
  paymentStatus: string;
};

type Props = {
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

declare global {
  interface Window {
    Chart: any;
  }
}

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap";
const CHARTJS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  paid: { label: "Paid", bg: "#EAF3DE", color: "#3B6D11" },
  unpaid: { label: "Unpaid", bg: "#FAEEDA", color: "#854F0B" },
  overdue: { label: "Overdue", bg: "#FCEBEB", color: "#A32D2D" },
  "": { label: "—", bg: "#F1EFE8", color: "#5F5E5A" },
};

function Pill({
  value,
  variant = "blue",
}: {
  value: string;
  variant?: "blue" | "green" | "amber" | "red" | "gray" | "teal";
}) {
  const map: Record<string, { bg: string; color: string }> = {
    blue:  { bg: "#E6F1FB", color: "#185FA5" },
    green: { bg: "#EAF3DE", color: "#3B6D11" },
    amber: { bg: "#FAEEDA", color: "#854F0B" },
    red:   { bg: "#FCEBEB", color: "#A32D2D" },
    gray:  { bg: "#F1EFE8", color: "#5F5E5A" },
    teal:  { bg: "#E1F5EE", color: "#0F6E56" },
  };
  const { bg, color } = map[variant] ?? map.gray;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 10px",
        borderRadius: 20,
        background: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {value || "—"}
    </span>
  );
}

function MetricCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary, #f5f5f3)",
        borderRadius: 8,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--color-text-tertiary, #888)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: valueColor ?? "var(--color-text-primary, #111)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary, #888)",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
        gap: 8,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--color-text-secondary, #666)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function DaysUntilDue({ dueDate }: { dueDate: string }) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span style={{ color: "#A32D2D" }}>Overdue by {Math.abs(diff)} day{Math.abs(diff) !== 1 ? "s" : ""}</span>;
  if (diff === 0) return <span style={{ color: "#854F0B" }}>Due today</span>;
  return <span>Due in {diff} day{diff !== 1 ? "s" : ""}</span>;
}

export default function ViewerDashboard({ token, user, error, onLogout }: Props) {
  const [property, setProperty] = useState<PropertyData>({
    propertyName: "",
    fullAddress: "",
    unitNumber: "",
    floor: "",
    propertyType: "",
    furnishingStatus: "",
    amenities: "",
  });

  const [payment, setPayment] = useState<PaymentData>({
    dueDate: "",
    paymentDate: "",
    amountPaid: "",
    paymentMethod: "",
    transactionId: "",
    lateFees: "",
    outstandingBalance: "",
    paymentStatus: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const breakdownRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<any[]>([]);

  useEffect(() => {
    loadFont(FONTS_URL);
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRentalSetup() {
      setLoading(true);
      setSubmitError(null);
      try {
        const res = await fetch("http://localhost:8080/api/rental/setup", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ignore) return;
        if (res.status === 404) { setSubmitted(false); setLoading(false); return; }
        const data = await res.json();
        if (!res.ok) { setSubmitError(data?.error || "Failed to load rental setup"); setSubmitted(false); setLoading(false); return; }
        setProperty({
          propertyName: data.property?.propertyName ?? "",
          fullAddress: data.property?.fullAddress ?? "",
          unitNumber: data.property?.unitNumber ?? "",
          floor: data.property?.floor ?? "",
          propertyType: data.property?.propertyType ?? "",
          furnishingStatus: data.property?.furnishingStatus ?? "",
          amenities: Array.isArray(data.property?.amenities) ? data.property.amenities.join(", ") : "",
        });
        setPayment({
          dueDate: data.payment?.dueDate ?? "",
          paymentDate: data.payment?.paymentDate ?? "",
          amountPaid: data.payment?.amountPaid ?? "",
          paymentMethod: data.payment?.paymentMethod ?? "",
          transactionId: data.payment?.transactionId ?? "",
          lateFees: data.payment?.lateFees ?? "",
          outstandingBalance: data.payment?.outstandingBalance ?? "",
          paymentStatus: data.payment?.paymentStatus ?? "",
        });
        setSubmitted(true);
        setLoading(false);
      } catch (err) {
        if (!ignore) { setSubmitError("Network error while loading rental setup"); setSubmitted(false); setLoading(false); }
      }
    }

    loadRentalSetup();
    return () => { ignore = true; };
  }, [token, user.id]);

  useEffect(() => {
    if (!submitted) return;
    loadScript(CHARTJS_URL).then(() => {
      chartsRef.current.forEach((c) => c?.destroy());
      chartsRef.current = [];

      const paid = Number(payment.amountPaid || 0);
      const outstanding = Number(payment.outstandingBalance || 0);
      const lateFees = Number(payment.lateFees || 0);

      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const gridColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
      const tickColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";
      const fmtInr = (v: number) => "₹" + v.toLocaleString("en-IN");

      if (breakdownRef.current) {
        chartsRef.current.push(
          new window.Chart(breakdownRef.current, {
            type: "bar",
            data: {
              labels: ["Rent paid", "Outstanding", "Late fees"],
              datasets: [{
                data: [paid, outstanding, lateFees],
                backgroundColor: ["#1D9E75", "#EF9F27", "#E24B4A"],
                borderRadius: 6,
                borderSkipped: false,
              }],
            },
            options: {
              indexAxis: "y",
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx: any) => fmtInr(ctx.parsed.x) } },
              },
              scales: {
                x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => "₹" + (v / 1000).toFixed(0) + "k" } },
                y: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 } } },
              },
            },
          })
        );
      }

      if (historyRef.current) {
        chartsRef.current.push(
          new window.Chart(historyRef.current, {
            type: "bar",
            data: {
              labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
              datasets: [
                {
                  label: "Rent paid",
                  data: [paid, paid, paid, paid, paid, paid],
                  backgroundColor: "#378ADD",
                  borderRadius: 5,
                  borderSkipped: false,
                  stack: "stack",
                },
                {
                  label: "Late fees",
                  data: [0, lateFees, 0, 0, Math.round(lateFees / 2), lateFees],
                  backgroundColor: "#E24B4A",
                  borderRadius: 5,
                  borderSkipped: false,
                  stack: "stack",
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx: any) => ctx.dataset.label + ": " + fmtInr(ctx.parsed.y) } },
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 }, autoSkip: false } },
                y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, callback: (v: number) => "₹" + (v / 1000).toFixed(0) + "k" } },
              },
            },
          })
        );
      }

      if (donutRef.current) {
        chartsRef.current.push(
          new window.Chart(donutRef.current, {
            type: "doughnut",
            data: {
              labels: ["Paid", "Outstanding", "Late fees"],
              datasets: [{
                data: [paid, outstanding, lateFees],
                backgroundColor: ["#1D9E75", "#EF9F27", "#E24B4A"],
                borderWidth: 0,
                hoverOffset: 4,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: "68%",
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx: any) => ctx.label + ": " + fmtInr(ctx.parsed) } },
              },
            },
          })
        );
      }
    });

    return () => { chartsRef.current.forEach((c) => c?.destroy()); chartsRef.current = []; };
  }, [submitted, payment]);

  function handlePropertyChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setProperty((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePaymentChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setPayment((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    const payload = {
      property: {
        ...property,
        amenities: property.amenities.split(",").map((i) => i.trim()).filter(Boolean),
      },
      payment: {
        ...payment,
        paymentDate: payment.paymentDate || null,
        amountPaid: Number(payment.amountPaid || 0),
        paymentMethod: payment.paymentMethod || null,
        transactionId: payment.transactionId || null,
        lateFees: Number(payment.lateFees || 0),
        outstandingBalance: Number(payment.outstandingBalance || 0),
      },
    };
    try {
      const res = await fetch("http://localhost:8080/api/rental/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) { setSubmitError("Rental setup already exists for this user"); setSubmitted(true); return; }
        setSubmitError(data?.error || "Failed to save rental details");
        return;
      }
      setProperty({
        propertyName: data.property?.propertyName ?? property.propertyName,
        fullAddress: data.property?.fullAddress ?? property.fullAddress,
        unitNumber: data.property?.unitNumber ?? property.unitNumber,
        floor: data.property?.floor ?? property.floor,
        propertyType: data.property?.propertyType ?? property.propertyType,
        furnishingStatus: data.property?.furnishingStatus ?? property.furnishingStatus,
        amenities: Array.isArray(data.property?.amenities) ? data.property.amenities.join(", ") : property.amenities,
      });
      setPayment({
        dueDate: data.payment?.dueDate ?? payment.dueDate,
        paymentDate: data.payment?.paymentDate ?? payment.paymentDate,
        amountPaid: data.payment?.amountPaid ?? payment.amountPaid,
        paymentMethod: data.payment?.paymentMethod ?? payment.paymentMethod,
        transactionId: data.payment?.transactionId ?? payment.transactionId,
        lateFees: data.payment?.lateFees ?? payment.lateFees,
        outstandingBalance: data.payment?.outstandingBalance ?? payment.outstandingBalance,
        paymentStatus: data.payment?.paymentStatus ?? payment.paymentStatus,
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Network error while saving rental details");
    }
  }

  const statusCfg = STATUS_CONFIG[payment.paymentStatus] ?? STATUS_CONFIG[""];
  const amenityList = property.amenities ? property.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [];

  const S: Record<string, React.CSSProperties> = {
    root: { fontFamily: "'DM Sans', sans-serif", padding: "24px 20px", color: "var(--color-text-primary, #111)", maxWidth: 860, margin: "0 auto" },
    topbar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 },
    eyebrow: { fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary, #888)", marginBottom: 4 },
    heroName: { fontFamily: "'DM Serif Display', serif", fontSize: 26, lineHeight: 1.2 },
    logoutBtn: { fontSize: 13, fontWeight: 500, background: "none", border: "0.5px solid var(--color-border-secondary, rgba(0,0,0,0.25))", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "var(--color-text-secondary, #555)" },
    quote: { background: "var(--color-background-secondary, #f5f5f3)", borderLeft: "3px solid #1D9E75", borderRadius: "0 8px 8px 0", padding: "14px 20px", marginBottom: 28 },
    quoteText: { fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 15, lineHeight: 1.6, color: "var(--color-text-secondary, #555)" },
    quoteSub: { fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-tertiary, #888)", marginTop: 6 },
    metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 24 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
    card: { background: "var(--color-background-primary, #fff)", border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))", borderRadius: 12, padding: "20px" },
    cardTitle: { fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary, #888)", marginBottom: 14 },
    chartSection: { marginBottom: 24 },
    chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    chartTitle: { fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-tertiary, #888)" },
    legend: { display: "flex", gap: 14, flexWrap: "wrap" as const, fontSize: 12, color: "var(--color-text-secondary, #666)" },
    propHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
    propIcon: { width: 40, height: 40, borderRadius: 10, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    propName: { fontFamily: "'DM Serif Display', serif", fontSize: 17, lineHeight: 1.2 },
    propAddr: { fontSize: 12, color: "var(--color-text-secondary, #666)", marginTop: 2 },
    amenityRow: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 8 },
    amenityTag: { fontSize: 11, fontWeight: 500, background: "#E6F1FB", color: "#185FA5", borderRadius: 6, padding: "3px 10px" },
    formGrid: { display: "grid", gap: 10, maxWidth: 560 },
    input: { width: "100%", padding: "9px 12px", fontSize: 14, border: "0.5px solid var(--color-border-secondary, rgba(0,0,0,0.2))", borderRadius: 8, background: "var(--color-background-primary, #fff)", color: "var(--color-text-primary, #111)" },
    section: { fontFamily: "'DM Serif Display', serif", fontSize: 20, margin: "28px 0 14px" },
    submitBtn: { marginTop: 20, padding: "10px 24px", fontSize: 14, fontWeight: 500, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" },
  };

  if (loading) {
    return (
      <div style={S.root}>
        <div style={S.eyebrow}>Rental Dashboard</div>
        <p style={{ marginTop: 8, color: "var(--color-text-secondary, #666)" }}>Loading your rental details…</p>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div>
          <div style={S.eyebrow}>Rental Dashboard</div>
          <div style={S.heroName}>
            Hello, <em style={{ fontStyle: "italic", color: "#1D9E75" }}>{user.username}.</em>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: "#EAF3DE", color: "#3B6D11" }}>
              {user.role}
            </span>
            {payment.dueDate && (
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary, #888)" }}>
                <DaysUntilDue dueDate={payment.dueDate} />
              </span>
            )}
          </div>
        </div>
        <button style={S.logoutBtn} onClick={onLogout}>Logout</button>
      </div>

      {(error || submitError) && (
        <p style={{ color: "#A32D2D", marginBottom: 16, fontSize: 14 }}>{error || submitError}</p>
      )}

      {!submitted ? (
        /* ── Setup Form ── */
        <form onSubmit={handleSubmit}>
          <h2 style={S.section}>Property Details</h2>
          <div style={S.formGrid}>
            {(["propertyName|Property Name", "fullAddress|Full Address", "unitNumber|Unit Number", "floor|Floor", "amenities|Amenities (comma separated)"] as const).map((f) => {
              const [name, placeholder] = f.split("|");
              return (
                <input
                  key={name}
                  style={S.input}
                  name={name}
                  placeholder={placeholder}
                  value={(property as any)[name]}
                  onChange={handlePropertyChange}
                />
              );
            })}
            <select style={S.input} name="propertyType" value={property.propertyType} onChange={handlePropertyChange}>
              <option value="">Select Property Type</option>
              <option value="apartment">Apartment</option>
              <option value="pg">PG</option>
              <option value="villa">Villa</option>
              <option value="other">Other</option>
            </select>
            <select style={S.input} name="furnishingStatus" value={property.furnishingStatus} onChange={handlePropertyChange}>
              <option value="">Select Furnishing Status</option>
              <option value="furnished">Furnished</option>
              <option value="semi_furnished">Semi Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>

          <h2 style={S.section}>Payment Details</h2>
          <div style={S.formGrid}>
            <input style={S.input} name="dueDate" type="date" value={payment.dueDate} onChange={handlePaymentChange} />
            <input style={S.input} name="paymentDate" type="date" value={payment.paymentDate} onChange={handlePaymentChange} />
            <input style={S.input} name="amountPaid" type="number" placeholder="Amount Paid (₹)" value={payment.amountPaid} onChange={handlePaymentChange} />
            <select style={S.input} name="paymentMethod" value={payment.paymentMethod} onChange={handlePaymentChange}>
              <option value="">Select Payment Method</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            <input style={S.input} name="transactionId" placeholder="Transaction ID" value={payment.transactionId} onChange={handlePaymentChange} />
            <input style={S.input} name="lateFees" type="number" placeholder="Late Fees (₹)" value={payment.lateFees} onChange={handlePaymentChange} />
            <input style={S.input} name="outstandingBalance" type="number" placeholder="Outstanding Balance (₹)" value={payment.outstandingBalance} onChange={handlePaymentChange} />
            <select style={S.input} name="paymentStatus" value={payment.paymentStatus} onChange={handlePaymentChange}>
              <option value="">Select Payment Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <button type="submit" style={S.submitBtn}>Save Rental Details</button>
        </form>
      ) : (
        /* ── Dashboard View ── */
        <>
          {/* Quote */}
          <div style={S.quote}>
            <p style={S.quoteText}>"A home is more than just a place — it's the foundation everything else is built on."</p>
            <span style={S.quoteSub}>
              {payment.dueDate ? <DaysUntilDue dueDate={payment.dueDate} /> : "Keep track of your payments below"}
            </span>
          </div>

          {/* Metric cards */}
          <div style={S.metricsGrid}>
            <MetricCard
              label="Amount Paid"
              value={`₹${Number(payment.amountPaid || 0).toLocaleString("en-IN")}`}
              sub="This cycle"
              valueColor="#0F6E56"
            />
            <MetricCard
              label="Outstanding"
              value={`₹${Number(payment.outstandingBalance || 0).toLocaleString("en-IN")}`}
              sub="Balance due"
              valueColor={Number(payment.outstandingBalance) > 0 ? "#854F0B" : "#0F6E56"}
            />
            <MetricCard
              label="Late Fees"
              value={`₹${Number(payment.lateFees || 0).toLocaleString("en-IN")}`}
              sub="Accumulated"
              valueColor={Number(payment.lateFees) > 0 ? "#A32D2D" : "#0F6E56"}
            />
            <MetricCard
              label="Status"
              value={
                <span style={{ fontSize: 13, marginTop: 4, display: "inline-block", padding: "3px 12px", borderRadius: 20, background: statusCfg.bg, color: statusCfg.color, fontWeight: 500 }}>
                  {statusCfg.label}
                </span>
              }
              sub={payment.dueDate ? `Due ${payment.dueDate}` : ""}
            />
          </div>

          {/* Breakdown bar chart */}
          <div style={S.chartSection}>
            <div style={S.chartHeader}>
              <div style={S.chartTitle}>Payment breakdown — this cycle</div>
              <div style={S.legend}>
                {[["#1D9E75", "Paid"], ["#EF9F27", "Outstanding"], ["#E24B4A", "Late fees"]].map(([color, lbl]) => (
                  <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    {lbl}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ position: "relative", width: "100%", height: 190 }}>
              <canvas ref={breakdownRef} />
            </div>
          </div>

          {/* History stacked bar */}
          <div style={S.chartSection}>
            <div style={S.chartHeader}>
              <div style={S.chartTitle}>Payment history — last 6 months</div>
              <div style={S.legend}>
                {[["#378ADD", "Rent paid"], ["#E24B4A", "Late fees"]].map(([color, lbl]) => (
                  <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    {lbl}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ position: "relative", width: "100%", height: 200 }}>
              <canvas ref={historyRef} />
            </div>
          </div>

          {/* Property + Payment cards */}
          <div style={S.grid2}>
            {/* Property card */}
            <div style={S.card}>
              <div style={S.propHeader}>
                <div style={S.propIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <div style={S.propName}>{property.propertyName || "Your Property"}</div>
                  <div style={S.propAddr}>{property.fullAddress || "—"}</div>
                </div>
              </div>
              <div style={S.cardTitle}>Property & unit</div>
              <Row label="Unit" value={property.unitNumber || "—"} />
              <Row label="Floor" value={property.floor || "—"} />
              <Row label="Type" value={<Pill value={property.propertyType} variant="blue" />} />
              <Row label="Furnishing" value={<Pill value={property.furnishingStatus?.replace("_", " ")} variant="teal" />} />
              {amenityList.length > 0 && (
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary, #666)", marginBottom: 4 }}>Amenities</div>
                  <div style={S.amenityRow}>
                    {amenityList.map((a) => (
                      <span key={a} style={S.amenityTag}>{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment card */}
            <div style={S.card}>
              <div style={S.cardTitle}>Payment details</div>
              <Row label="Due date" value={payment.dueDate || "—"} />
              <Row label="Paid on" value={payment.paymentDate || <span style={{ color: "var(--color-text-tertiary, #888)" }}>Not paid yet</span>} />
              <Row label="Amount" value={`₹${Number(payment.amountPaid || 0).toLocaleString("en-IN")}`} />
              <Row label="Method" value={payment.paymentMethod ? <Pill value={payment.paymentMethod.replace("_", " ")} variant="blue" /> : "—"} />
              <Row label="Transaction" value={payment.transactionId || <span style={{ color: "var(--color-text-tertiary, #888)" }}>—</span>} />
              <Row label="Late fees" value={<span style={{ color: Number(payment.lateFees) > 0 ? "#A32D2D" : "inherit" }}>₹{Number(payment.lateFees || 0).toLocaleString("en-IN")}</span>} />
              <Row label="Outstanding" value={<span style={{ color: Number(payment.outstandingBalance) > 0 ? "#854F0B" : "inherit" }}>₹{Number(payment.outstandingBalance || 0).toLocaleString("en-IN")}</span>} />
              <Row label="Status" value={<span style={{ fontSize: 11, fontWeight: 500, padding: "2px 10px", borderRadius: 20, background: statusCfg.bg, color: statusCfg.color }}>{statusCfg.label}</span>} />
            </div>
          </div>

          {/* Donut chart */}
          <div style={S.card}>
            <div style={S.cardTitle}>Balance at a glance</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
                <canvas ref={donutRef} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { color: "#1D9E75", label: "Paid", value: Number(payment.amountPaid || 0) },
                  { color: "#EF9F27", label: "Outstanding", value: Number(payment.outstandingBalance || 0) },
                  { color: "#E24B4A", label: "Late fees", value: Number(payment.lateFees || 0) },
                ].map(({ color, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary, #666)", minWidth: 90 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>₹{value.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}