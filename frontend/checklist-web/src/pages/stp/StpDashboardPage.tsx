import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { StpAreaChecklistTemplateSummaryDto, StpAreaChecklistListItemDto } from "../../types";

export default function StpDashboardPage() {
  const [templates, setTemplates] = useState<StpAreaChecklistTemplateSummaryDto[]>([]);
  const [recentes, setRecentes] = useState<StpAreaChecklistListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [loadedTemplates, loadedChecklists] = await Promise.all([
          api.get<StpAreaChecklistTemplateSummaryDto[]>("/api/stp/templates"),
          api.get<StpAreaChecklistListItemDto[]>("/api/stp/checklists"),
        ]);

        if (!active) return;
        setTemplates(loadedTemplates);
        setRecentes(loadedChecklists.slice(0, 5));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar o modulo STP.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.eyebrow}>STP</div>
        <h1 style={styles.title}>Inspeção de Área</h1>
        <p style={styles.subtitle}>
        </p>
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <div style={styles.metricsGrid}>
        <MetricCard label="Templates ativos" value={templates.length} tone="#0F766E" />
        <MetricCard label="Inspeções recentes" value={recentes.length} tone="#0A6AD7" />
      </div>

      <div style={styles.actionGrid}>
        <Link to="/stp/checklists/nova" style={styles.primaryCard}>
          <div style={styles.actionTitle}>Nova inspeção</div>
          <div style={styles.actionCopy}></div>
        </Link>

        <Link to="/stp/checklists" style={styles.secondaryCard}>
          <div style={styles.actionTitle}>Histórico de inspeções</div>
          <div style={styles.actionCopy}></div>
        </Link>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>Ultimas inspeções</div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Carregando dashboard STP...</div>
        ) : recentes.length === 0 ? (
          <div style={styles.emptyState}>Nehuma inspeção registrada.</div>
        ) : (
          <div style={styles.list}>
            {recentes.map((item) => (
              <Link key={item.id} to={`/stp/checklists/${item.id}`} style={styles.rowLink}>
                <div style={styles.rowMain}>
                  <div style={styles.rowTitle}>{item.templateNome}</div>
                  <div style={styles.rowMeta}>
                    {new Date(item.dataRealizacao).toLocaleString("pt-BR")} · {item.inspetorNomeCompleto}
                  </div>
                </div>
                <div style={styles.rowRight}>
                  <div style={styles.rowBadge}>{item.totalX} X</div>
                  <div style={styles.rowMeta}>{item.responsavelPresenteNome}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={{ ...styles.metricValue, color: tone }}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 22 },
  header: { display: "grid", gap: 10 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0F766E" },
  title: { margin: 0, fontSize: 34, lineHeight: 1.08, color: "#052E2B" },
  subtitle: { margin: 0, fontSize: 16, lineHeight: 1.65, color: "#365314", maxWidth: 760 },
  errorBox: { border: "1px solid #F04438", background: "#FEF3F2", color: "#B42318", borderRadius: 14, padding: "12px 14px", fontSize: 14 },
  metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 },
  metricCard: { background: "#FFFFFF", border: "1px solid #D0D5DD", borderRadius: 20, padding: 18, display: "grid", gap: 8 },
  metricValue: { fontSize: 30, fontWeight: 800 },
  metricLabel: { fontSize: 13, color: "#667085", fontWeight: 700 },
  actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  primaryCard: { textDecoration: "none", background: "#0F766E", color: "#FFFFFF", borderRadius: 24, padding: 22, display: "grid", gap: 12 },
  secondaryCard: { textDecoration: "none", background: "#FFFFFF", color: "#101828", border: "1px solid #D0D5DD", borderRadius: 24, padding: 22, display: "grid", gap: 12 },
  actionTitle: { fontSize: 22, fontWeight: 800 },
  actionCopy: { fontSize: 14, lineHeight: 1.6, opacity: 0.92 },
  section: { background: "#FFFFFF", border: "1px solid #D0D5DD", borderRadius: 24, overflow: "hidden" },
  sectionHeader: { padding: "18px 20px", borderBottom: "1px solid #EAECF0" },
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#101828" },
  emptyState: { padding: 24, color: "#667085", fontSize: 14 },
  list: { display: "grid" },
  rowLink: { textDecoration: "none", padding: "16px 20px", display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid #F2F4F7", color: "inherit" },
  rowMain: { display: "grid", gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: 700, color: "#101828" },
  rowMeta: { fontSize: 13, color: "#667085" },
  rowRight: { display: "grid", gap: 4, justifyItems: "end" },
  rowBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 58, height: 28, borderRadius: 999, background: "#FEF3F2", color: "#B42318", fontSize: 12, fontWeight: 800, padding: "0 10px" },
};
