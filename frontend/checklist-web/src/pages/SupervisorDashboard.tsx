import { useEffect, useState } from "react";
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

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" style={{ margin: 24 }}>
        Erro: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14 }}>
          Acompanhe o status dos checklists em tempo real
        </p>
      </div>

      {/* Grid de Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {equipamentos.map((eq) => (
          <div
            key={eq.id}
            style={{
              background: "white",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              overflow: "hidden",
              transition: "box-shadow 0.2s ease",
            }}
          >
            {/* Barra de Status no Topo */}
            <div style={{
              height: 4,
              background: eq.status === "ok" 
                ? "#059669" 
                : eq.status === "nok" 
                  ? "#DC2626" 
                  : "#9CA3AF",
            }} />

            {/* Conteúdo do Card */}
            <div style={{ padding: 20 }}>
              {/* Header do Card */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}>
                <span style={{
                  background: "#F3F4F6",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#374151",
                }}>
                  {eq.codigo}
                </span>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: eq.status === "ok" 
                    ? "#D1FAE5" 
                    : eq.status === "nok" 
                      ? "#FEE2E2" 
                      : "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {eq.status === "ok" && <span style={{ color: "#059669", fontSize: 16 }}>✓</span>}
                  {eq.status === "nok" && <span style={{ color: "#DC2626", fontSize: 16 }}>!</span>}
                  {eq.status === "nao-preenchido" && <span style={{ color: "#9CA3AF", fontSize: 16 }}>○</span>}
                </div>
              </div>

              {/* Descrição */}
              <h3 style={{ 
                fontSize: 15, 
                fontWeight: 600, 
                margin: "0 0 4px 0", 
                color: "#1A1A1A" 
              }}>
                {eq.descricao}
              </h3>
              
              {/* Categoria */}
              <p style={{ 
                fontSize: 13, 
                color: "#6B7280", 
                margin: 0 
              }}>
                {eq.categoriaNome || "Sem categoria"}
              </p>

              {/* Status Badge */}
              <div style={{ marginTop: 16 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: eq.status === "ok" 
                    ? "#D1FAE5" 
                    : eq.status === "nok" 
                      ? "#FEE2E2" 
                      : "#F3F4F6",
                  color: eq.status === "ok" 
                    ? "#065F46" 
                    : eq.status === "nok" 
                      ? "#991B1B" 
                      : "#4B5563",
                }}>
                  {eq.status === "ok" && "Conforme"}
                  {eq.status === "nok" && "Não Conforme"}
                  {eq.status === "nao-preenchido" && "Aguardando"}
                </span>
              </div>

              {/* Footer com Link */}
              {eq.checklistId && (
                <div style={{ 
                  marginTop: 16, 
                  paddingTop: 16, 
                  borderTop: "1px solid #F3F4F6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  {eq.criadoEm && (
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                      {new Date(eq.criadoEm).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <a
                    href={`/supervisor/checklist/${eq.checklistId}`}
                    style={{
                      color: "#0057B8",
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Ver relatório →
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}