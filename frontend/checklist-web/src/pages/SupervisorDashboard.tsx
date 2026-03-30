import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

type EquipamentoStatus = {
  id: string;
  codigo: string;
  descricao: string;
  categoriaNome: string;
  status: "nao-preenchido" | "nok" | "ok";
  checklistId?: string;
  criadoEm?: string;
};

type CategoriaGroup = {
  categoriaNome: string;
  equipamentos: EquipamentoStatus[];
};

export default function SupervisorDashboard() {
  const [equipamentos, setEquipamentos] = useState<EquipamentoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<EquipamentoStatus[]>("/api/supervisor/dashboard")
      .then(setEquipamentos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categorias = useMemo<CategoriaGroup[]>(() => {
    const grouped = new Map<string, EquipamentoStatus[]>();

    for (const equipamento of equipamentos) {
      const categoriaNome = equipamento.categoriaNome?.trim() || "Sem categoria";
      const current = grouped.get(categoriaNome) ?? [];
      current.push(equipamento);
      grouped.set(categoriaNome, current);
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
      .map(([categoriaNome, items]) => ({
        categoriaNome,
        equipamentos: items.sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR")),
      }));
  }, [equipamentos]);

  if (loading) {
    return <div className="cf-loading cf-surface">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="cf-alert cf-alert-error">Erro: {error}</div>;
  }

  return (
    <div className="cf-page">
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title"></h1>
          <p className="cf-page-subtitle"></p>
        </div>
      </div>

      <div className="cf-dashboard-groups">
        {categorias.map((categoria) => (
          <section key={categoria.categoriaNome} className="cf-dashboard-group">
            <div className="cf-dashboard-group-header">
              <div>
                <h2 className="cf-dashboard-group-title">{categoria.categoriaNome}</h2>
              </div>
            </div>

            <div className="cf-dashboard-grid">
              {categoria.equipamentos.map((eq) => (
                <article key={eq.id} className="cf-status-card">
                  <div
                    className="cf-status-bar"
                    style={{
                      background: eq.status === "ok"
                        ? "#059669"
                        : eq.status === "nok"
                          ? "#DC2626"
                          : "#9CA3AF",
                    }}
                  />

                  <div className="cf-status-body">
                    <div className="cf-status-row">
                      <span className="cf-badge cf-badge-blue">{eq.codigo}</span>
                      <div
                        className="cf-status-icon"
                        style={{
                          background: eq.status === "ok"
                            ? "#D1FAE5"
                            : eq.status === "nok"
                              ? "#FEE2E2"
                              : "#F3F4F6",
                          color: eq.status === "ok"
                            ? "#059669"
                            : eq.status === "nok"
                              ? "#DC2626"
                              : "#9CA3AF",
                        }}
                      >
                        {eq.status === "ok" ? "✓" : eq.status === "nok" ? "!" : "○"}
                      </div>
                    </div>

                    <h3 className="cf-card-title">{eq.descricao}</h3>
                    <p className="cf-card-subtitle">{eq.categoriaNome || "Sem categoria"}</p>

                    <div style={{ marginTop: 16 }}>
                      <span
                        className={`cf-badge ${
                          eq.status === "ok"
                            ? "cf-badge-success"
                            : eq.status === "nok"
                              ? "cf-badge-danger"
                              : "cf-badge-gray"
                        }`}
                      >
                        {eq.status === "ok" ? "Conforme" : eq.status === "nok" ? "Não conforme" : "Aguardando"}
                      </span>
                    </div>

                    {eq.checklistId ? (
                      <div className="cf-card-footer">
                        <span className="cf-meta" style={{ marginTop: 0 }}>
                          {eq.criadoEm
                            ? new Date(eq.criadoEm).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        <a className="cf-link" href={`/supervisor/checklist/${eq.checklistId}`}>Ver relatório</a>
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
