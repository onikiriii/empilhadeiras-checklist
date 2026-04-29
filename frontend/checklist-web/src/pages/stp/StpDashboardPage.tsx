import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../../api";
import type { StpAreaChecklistListItemDto, StpAreaInspecaoDto } from "../../types";

export default function StpDashboardPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<StpAreaInspecaoDto[]>([]);
  const [recentes, setRecentes] = useState<StpAreaChecklistListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [loadedAreas, loadedChecklists] = await Promise.all([
          api.get<StpAreaInspecaoDto[]>("/api/stp/areas"),
          api.get<StpAreaChecklistListItemDto[]>("/api/stp/checklists"),
        ]);

        if (!active) return;
        setAreas(loadedAreas);
        setRecentes(loadedChecklists.slice(0, 5));
      } catch (err) {
        if (!active) return;
        setError(extractError(err, "Erro ao carregar o painel de areas STP."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const areasAtivas = areas.filter((area) => area.ativa);

  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Areas de inspecao</h1>
        <Link to="/stp/areas" style={styles.primaryButton}>
          Cadastrar area
        </Link>
      </header>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <div style={styles.grid}>
        <DashboardCard
          title="Areas ativas"
          count={areasAtivas.length}
          tone="primary"
          onClick={() => navigate("/stp/areas")}
        />
        <DashboardCard
          title="Inspecoes recentes"
          count={recentes.length}
          tone="success"
          onClick={() => navigate("/stp/checklists")}
        />
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Areas cadastradas</div>
            <div style={styles.sectionSubtitle}>Escolha uma area para abrir a tela de inspecao.</div>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Carregando areas...</div>
        ) : areasAtivas.length === 0 ? (
          <div style={styles.emptyState}>Nenhuma area ativa cadastrada.</div>
        ) : (
          <div style={styles.areasGrid}>
            {areasAtivas.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => navigate(`/stp/areas/${area.id}/nova-inspecao`)}
                style={styles.areaCard}
              >
                <div style={styles.areaCardTop}>
                  <span style={styles.areaName}>{area.nome}</span>
                  <span style={styles.areaArrow}>
                    <ArrowRightIcon />
                  </span>
                </div>
                <div style={styles.areaMetaLabel}>Responsavel</div>
                <div style={styles.areaMetaValue}>{area.responsavelSupervisorNomeCompleto}</div>
                <div style={styles.areaAction}>Iniciar nova inspecao</div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Ultimas inspecoes</div>
            <div style={styles.sectionSubtitle}>Historico recente do modulo STP.</div>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Carregando inspecoes...</div>
        ) : recentes.length === 0 ? (
          <div style={styles.emptyState}>Nenhuma inspecao registrada.</div>
        ) : (
          <div style={styles.recentesList}>
            {recentes.map((item) => (
              <Link key={item.id} to={`/stp/checklists/${item.id}`} style={styles.rowLink}>
                <div style={styles.rowMain}>
                  <div style={styles.rowTitle}>{item.areaInspecaoNome}</div>
                  <div style={styles.rowMeta}>
                    {new Date(item.dataRealizacao).toLocaleString("pt-BR")} · {item.inspetorNomeCompleto}
                  </div>
                </div>
                <div style={styles.rowRight}>
                  <div style={styles.rowBadge}>{item.totalX} N OK</div>
                  <div style={styles.rowMeta}>{item.responsavelAreaNomeCompleto}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function DashboardCard({
  title,
  count,
  tone,
  onClick,
}: {
  title: string;
  count: number;
  tone: "primary" | "success";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.metricCard,
        ...(tone === "primary" ? styles.cardPrimary : styles.cardSuccess),
      }}
    >
      <div style={styles.cardTopRow}>
        <span style={styles.cardTitle}>{title}</span>
        <span style={styles.cardArrow}>
          <ArrowRightIcon />
        </span>
      </div>
      <strong style={styles.cardCount}>{count}</strong>
    </button>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: "#0F172A" },
  primaryButton: { textDecoration: "none", background: "#067647", color: "#FFFFFF", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700 },
  errorBox: { border: "1px solid #F04438", background: "#FEF3F2", color: "#B42318", borderRadius: 14, padding: "12px 14px", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 },
  metricCard: { border: "1px solid transparent", borderRadius: 20, padding: 24, display: "grid", gap: 12, cursor: "pointer", textAlign: "left" },
  cardPrimary: { background: "#067647", color: "#FFFFFF" },
  cardSuccess: { background: "#169C4B", color: "#FFFFFF" },
  cardTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: 600 },
  cardArrow: { width: 32, height: 32, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.16)", color: "#FFFFFF", flexShrink: 0 },
  cardCount: { fontSize: 40, lineHeight: 1, fontWeight: 800 },
  section: { background: "#FFFFFF", border: "1px solid #D0D5DD", borderRadius: 24, overflow: "hidden" },
  sectionHeader: { padding: "18px 20px", borderBottom: "1px solid #EAECF0" },
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#101828" },
  sectionSubtitle: { marginTop: 4, fontSize: 13, color: "#667085" },
  emptyState: { padding: 24, color: "#667085", fontSize: 14 },
  areasGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18, padding: 20 },
  areaCard: { border: "1px solid #D0E5D8", borderRadius: 24, background: "#FFFFFF", minHeight: 168, padding: 22, display: "grid", gap: 10, textAlign: "left", cursor: "pointer", alignContent: "space-between" },
  areaCardTop: { display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 },
  areaName: { fontSize: 21, fontWeight: 800, color: "#101828", lineHeight: 1.15 },
  areaArrow: { width: 32, height: 32, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#ECFDF3", color: "#067647", flexShrink: 0 },
  areaMetaLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "#667085", fontWeight: 700 },
  areaMetaValue: { fontSize: 15, color: "#344054", fontWeight: 600 },
  areaAction: { marginTop: 8, fontSize: 13.5, color: "#067647", fontWeight: 800 },
  recentesList: { display: "grid" },
  rowLink: { textDecoration: "none", padding: "16px 20px", display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid #F2F4F7", color: "inherit" },
  rowMain: { display: "grid", gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: 700, color: "#101828" },
  rowMeta: { fontSize: 13, color: "#667085" },
  rowRight: { display: "grid", gap: 4, justifyItems: "end" },
  rowBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 72, height: 28, borderRadius: 999, background: "#FEF3F2", color: "#B42318", fontSize: 12, fontWeight: 800, padding: "0 10px" },
};
