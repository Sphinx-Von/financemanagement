import type React from "react";

export const layoutStyle: React.CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
  background: "#f3f4f6",
};

export const sidebarStyle: React.CSSProperties = {
  width: 260,
  background: "#111827",
  color: "#fff",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

export const mainContentStyle: React.CSSProperties = {
  flex: 1,
  padding: 24,
};

export const panelStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  minHeight: "calc(100vh - 48px)",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

export const formContainerStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  maxWidth: 420,
  marginTop: 12,
  padding: 16,
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  outline: "none",
};

export const smallInputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  outline: "none",
};

export const thStyle: React.CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: 8,
};

export const tdStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: 8,
  verticalAlign: "top",
};

export const buttonPrimaryStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
};

export const buttonSecondaryStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: 8,
  background: "#fff",
  color: "#111",
  cursor: "pointer",
};

export const buttonDangerStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "#fff",
  cursor: "pointer",
};

export const getSidebarItemStyle = (active: boolean): React.CSSProperties => ({
  width: "100%",
  textAlign: "left",
  padding: "12px 14px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  background: active ? "#1f2937" : "transparent",
  color: "#fff",
  fontSize: 14,
  fontWeight: active ? 700 : 500,
});