import React from "react";

export default function MaterialsDashboardPage() {
  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.eyebrow}>Inspeção de Materiais</div>
        <h1 style={styles.title}></h1>
        <p style={styles.subtitle}>
          
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 16 },
  hero: { background: "#FFFFFF", border: "1px solid #D9E2F1", borderRadius: 24, padding: 28, display: "grid", gap: 10, maxWidth: 780 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#175CD3" },
  title: { margin: 0, fontSize: 32, lineHeight: 1.08, color: "#0F172A" },
  subtitle: { margin: 0, fontSize: 15, lineHeight: 1.7, color: "#475467", maxWidth: 680 },
};
