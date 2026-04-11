import { CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../api";

type PainelResponse = {
  pendentesAprovacao: unknown[];
  emAndamento: unknown[];
  concluidas: unknown[];
};

type DashboardCardProps = {
  title: string;
  count: number;
  tone: "danger" | "primary" | "success";
  onClick: () => void;
};

function DashboardCard({ title, count, tone, onClick }: DashboardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.card,
        ...(tone === "danger"
          ? styles.cardDanger
          : tone === "primary"
            ? styles.cardPrimary
            : styles.cardSuccess),
      }}
    >
      <span style={styles.cardTitle}>{title}</span>
      <strong style={styles.cardCount}>{count}</strong>
    </button>
  );
}

export default function ItensNaoOkDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState({
    pendentes: 0,
    andamento: 0,
    concluidas: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await api.get<PainelResponse>("/api/supervisor/itens-nao-ok/painel");

        if (cancelled) return;

        setCounts({
          pendentes: data.pendentesAprovacao.length,
          andamento: data.emAndamento.length,
          concluidas: data.concluidas.length,
        });
      } catch (err) {
        if (cancelled) return;

        const apiError = err as ApiError;
        setError(apiError.message || "Erro ao carregar o painel de itens nao OK.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Itens nao OK</h1>
      </header>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <div style={styles.grid}>
        <DashboardCard
          title="Pendentes"
          count={counts.pendentes}
          tone="danger"
          onClick={() => navigate("/admin/itens-nao-ok/lista?status=pendentes")}
        />
        <DashboardCard
          title="Em andamento"
          count={counts.andamento}
          tone="primary"
          onClick={() => navigate("/admin/itens-nao-ok/lista?status=andamento")}
        />
        <DashboardCard
          title="Concluidas"
          count={counts.concluidas}
          tone="success"
          onClick={() => navigate("/admin/itens-nao-ok/lista?status=concluidas")}
        />
      </div>

      {loading ? <p style={styles.loading}>Carregando...</p> : null}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "grid",
    gap: 24,
  },
  header: {
    display: "grid",
    gap: 6,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#0F172A",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
  },
  card: {
    border: "1px solid transparent",
    borderRadius: 20,
    padding: 24,
    display: "grid",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
  },
  cardDanger: {
    background: "#D92D20",
    color: "#FFFFFF",
  },
  cardPrimary: {
    background: "#0A6AD7",
    color: "#FFFFFF",
  },
  cardSuccess: {
    background: "#169C4B",
    color: "#FFFFFF",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
  },
  cardCount: {
    fontSize: 40,
    lineHeight: 1,
    fontWeight: 800,
  },
  loading: {
    margin: 0,
    color: "#475467",
    fontSize: 14,
  },
  errorBox: {
    border: "1px solid #F04438",
    background: "#FEF3F2",
    color: "#B42318",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
  },
};
