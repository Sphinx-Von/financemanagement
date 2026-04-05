import type { CSSProperties } from "react";
import { useState } from "react";
import type { RecordType } from "../../../api";

type Props = {
  recordAmount: string;
  recordType: RecordType;
  recordCategory: string;
  recordDate: string;
  recordNotes: string;
  recordError: string;
  recordSubmitting: boolean;
  setRecordAmount: (value: string) => void;
  setRecordType: (value: RecordType) => void;
  setRecordCategory: (value: string) => void;
  setRecordDate: (value: string) => void;
  setRecordNotes: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

// ── Design tokens — mirrors UserManagementSection ─────────────────────────────

const font = "'DM Sans', sans-serif";

const FLOW = {
  in: {
    accent:      "#0F6E56",
    accentLight: "#1D9E75",
    bg:          "#E1F5EE",
    bgCard:      "#F2FBF7",
    border:      "rgba(15,110,86,0.2)",
    glow:        "rgba(29,158,117,0.12)",
    label:       "IN",
    sublabel:    "Income",
    icon:        "↓",
    pillBg:      "#E1F5EE",
    pillColor:   "#0F6E56",
    btnBg:       "#1D9E75",
    btnBorder:   "#1D9E75",
    headerGrad:  "linear-gradient(135deg, #0a4a38 0%, #0F6E56 100%)",
    amountColor: "#0F6E56",
  },
  out: {
    accent:      "#92400E",
    accentLight: "#B45309",
    bg:          "#FEF3C7",
    bgCard:      "#FFFBF0",
    border:      "rgba(146,64,14,0.2)",
    glow:        "rgba(180,83,9,0.10)",
    label:       "OUT",
    sublabel:    "Expense",
    icon:        "↑",
    pillBg:      "#FEF3C7",
    pillColor:   "#92400E",
    btnBg:       "#B45309",
    btnBorder:   "#B45309",
    headerGrad:  "linear-gradient(135deg, #5c2a06 0%, #92400E 100%)",
    amountColor: "#B45309",
  },
};

const CATEGORIES: Record<RecordType, string[]> = {
  income:  ["Rent Payment", "Security Deposit", "Late Fee", "Parking Fee", "Pet Fee", "Other Income"],
  expense: ["Maintenance", "Utilities", "Insurance", "Property Tax", "Management Fee", "Repairs", "Cleaning", "Other Expense"],
};

// ── Focus-aware input ─────────────────────────────────────────────────────────

function FocusInput({
  accent, border, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { accent: string; border: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        padding: "8px 11px", fontSize: 13, fontFamily: font,
        border: focused ? `0.5px solid ${accent}` : `0.5px solid rgba(0,0,0,0.18)`,
        borderRadius: 7, outline: "none",
        background: "#fff", color: "#111",
        width: "100%", boxSizing: "border-box",
        boxShadow: focused ? `0 0 0 3px ${border}` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function FocusSelect({
  accent, border, children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { accent: string; border: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        padding: "8px 11px", fontSize: 13, fontFamily: font,
        border: focused ? `0.5px solid ${accent}` : `0.5px solid rgba(0,0,0,0.18)`,
        borderRadius: 7, outline: "none",
        background: "#fff", color: "#111",
        width: "100%", boxSizing: "border-box",
        cursor: "pointer",
        boxShadow: focused ? `0 0 0 3px ${border}` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    >
      {children}
    </select>
  );
}

function FocusTextarea({
  accent, border, ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { accent: string; border: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        padding: "8px 11px", fontSize: 13, fontFamily: font,
        border: focused ? `0.5px solid ${accent}` : `0.5px solid rgba(0,0,0,0.18)`,
        borderRadius: 7, outline: "none",
        background: "#fff", color: "#111",
        width: "100%", boxSizing: "border-box",
        resize: "vertical", minHeight: 80,
        boxShadow: focused ? `0 0 0 3px ${border}` : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateRecordSection({
  recordAmount, recordType, recordCategory, recordDate, recordNotes,
  recordError, recordSubmitting,
  setRecordAmount, setRecordType, setRecordCategory, setRecordDate,
  setRecordNotes, onSubmit,
}: Props) {
  const flow = FLOW[recordType === "income" ? "in" : "out"];
  const isIn = recordType === "income";

  const handleToggle = (type: RecordType) => {
    setRecordType(type);
    setRecordCategory(""); // reset category on toggle
  };

  return (
    <div style={{ fontFamily: font, position: "relative", minHeight: "100%" }}>

      {/* Page background — same Unsplash photo + tinted overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(to bottom, rgba(245,245,243,0.85) 0%, rgba(245,245,243,0.95) 60%, rgba(245,245,243,1) 100%),
          url("https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=80&auto=format&fit=crop")
        `,
        backgroundSize: "cover", backgroundPosition: "center top",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, paddingBottom: 40 }}>

        {/* Section header — same eyebrow + DM Serif Display pattern */}
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
            Cash Flow Log
          </h2>
        </div>

        {/* ── Big IN / OUT toggle ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 10, marginBottom: 20,
        }}>
          {(["income", "expense"] as RecordType[]).map((type) => {
            const f = FLOW[type === "income" ? "in" : "out"];
            const active = recordType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleToggle(type)}
                style={{
                  padding: "20px 16px",
                  borderRadius: 10,
                  border: active ? `1.5px solid ${f.accent}` : "0.5px solid rgba(0,0,0,0.12)",
                  background: active ? f.bg : "var(--color-background-secondary, #f5f5f3)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: active ? `0 0 0 4px ${f.glow}` : "none",
                  textAlign: "left",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Big directional arrow — the visual anchor */}
                <div style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 48, lineHeight: 1,
                  color: active ? f.accent : "rgba(0,0,0,0.08)",
                  fontWeight: 700,
                  transition: "color 0.2s",
                  userSelect: "none",
                }}>
                  {f.icon}
                </div>

                <div style={{
                  fontSize: 28, fontWeight: 700, fontFamily: "'DM Serif Display', serif",
                  color: active ? f.accent : "var(--color-text-tertiary, #aaa)",
                  lineHeight: 1, marginBottom: 4,
                  transition: "color 0.2s",
                }}>
                  {f.label}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: active ? f.accentLight : "var(--color-text-tertiary, #bbb)",
                  transition: "color 0.2s",
                }}>
                  {f.sublabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Amount hero card ── */}
        <div style={{
          borderRadius: 10,
          background: flow.bg,
          border: `0.5px solid ${flow.border}`,
          padding: "18px 18px 14px",
          marginBottom: 16,
          transition: "all 0.25s",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 500, letterSpacing: "0.07em",
            textTransform: "uppercase", color: flow.accent, marginBottom: 8,
          }}>
            {isIn ? "↓ Amount Received" : "↑ Amount Paid Out"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 26, fontWeight: 700,
              fontFamily: "'DM Serif Display', serif",
              color: flow.amountColor,
              lineHeight: 1,
            }}>
              {isIn ? "+" : "−"}
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={recordAmount}
              onChange={(e) => setRecordAmount(e.target.value)}
              required
              min="0"
              step="0.01"
              style={{
                flex: 1,
                fontSize: 26, fontWeight: 700,
                fontFamily: "'DM Serif Display', serif",
                color: flow.amountColor,
                border: "none", outline: "none",
                background: "transparent",
                padding: 0,
              }}
            />
            <span style={{
              fontSize: 13, fontWeight: 500,
              color: flow.accent, opacity: 0.7,
            }}>
              INR
            </span>
          </div>
        </div>

        {/* ── Detail form card ── */}
        <div style={{
          background: "var(--color-background-primary, #fff)",
          border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
          borderRadius: 12, overflow: "hidden",
        }}>
          {/* Card header */}
          <div style={{
            padding: "10px 14px",
            borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
            background: "var(--color-background-secondary, #f9f9f7)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span style={{
              fontSize: 11, fontWeight: 500, letterSpacing: "0.07em",
              textTransform: "uppercase", color: "var(--color-text-tertiary, #888)",
            }}>
              Entry details
            </span>
          </div>

          <form onSubmit={onSubmit} style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{
                fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--color-text-tertiary, #888)",
              }}>
                Category
              </label>
              <FocusSelect
                value={recordCategory}
                onChange={(e) => setRecordCategory(e.target.value)}
                accent={flow.accent}
                border={flow.glow}
                required
              >
                <option value="">Select a category…</option>
                {CATEGORIES[recordType].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </FocusSelect>
            </div>

            {/* Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{
                fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--color-text-tertiary, #888)",
              }}>
                Date
              </label>
              <FocusInput
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                accent={flow.accent}
                border={flow.glow}
                required
              />
            </div>

            {/* Notes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{
                fontSize: 11, fontWeight: 500, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--color-text-tertiary, #888)",
              }}>
                Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </label>
              <FocusTextarea
                placeholder="e.g. Unit 4B — May rent, paid on time"
                value={recordNotes}
                onChange={(e) => setRecordNotes(e.target.value)}
                accent={flow.accent}
                border={flow.glow}
              />
            </div>

            {/* Divider */}
            <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "2px 0" }} />

            {/* Error */}
            {recordError && (
              <div style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                padding: "9px 14px", borderRadius: 8, fontSize: 13,
                background: "#FCEBEB", border: "0.5px solid rgba(162,45,45,0.2)", color: "#A32D2D",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {recordError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {/* Live summary badge */}
              {recordAmount && recordCategory && (
                <span style={{
                  fontSize: 12, fontFamily: font,
                  padding: "4px 10px", borderRadius: 20,
                  background: flow.bg, color: flow.accent,
                  border: `0.5px solid ${flow.border}`,
                  fontWeight: 500,
                }}>
                  {isIn ? "+" : "−"} ₹{Number(recordAmount).toLocaleString("en-IN")} · {recordCategory}
                </span>
              )}
              {(!recordAmount || !recordCategory) && (
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary, #aaa)", fontFamily: font }}>
                  Fill details above to log entry
                </span>
              )}

              <button
                type="submit"
                disabled={recordSubmitting}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 500, fontFamily: font,
                  padding: "7px 16px", borderRadius: 7,
                  cursor: recordSubmitting ? "not-allowed" : "pointer",
                  border: `0.5px solid ${flow.btnBorder}`,
                  background: flow.btnBg, color: "#fff",
                  opacity: recordSubmitting ? 0.5 : 1,
                  transition: "opacity 0.15s, background 0.25s",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                }}
              >
                {recordSubmitting ? (
                  <><Spinner color="#fff" /> Logging…</>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Log {flow.label}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer hint */}
        <div style={{
          fontSize: 12, color: "var(--color-text-tertiary, #aaa)",
          marginTop: 10, textAlign: "right", fontFamily: font,
        }}>
          Entry will appear in Records after logging
        </div>
      </div>
    </div>
  );
}