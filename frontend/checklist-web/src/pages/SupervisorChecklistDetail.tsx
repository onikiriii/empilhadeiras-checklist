import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";

type ChecklistItem = {
  id: string;
  templateId: string;
  ordem: number;
  descricao: string;
  instrucao: string;
  status: "OK" | "NOK";
  observacao: string;
};

type ChecklistDetail = {
  id: string;
  equipamentoId: string;
  equipamentoCodigo: string;
  operadorId: string;
  operadorNome: string;
  dataRealizacao: string;
  aprovado: boolean;
  observacoesGerais: string;
  status: string;
  itens: ChecklistItem[];
};

export default function SupervisorChecklistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    api.get<ChecklistDetail>(`/api/checklists/${id}`)
      .then(setChecklist)
      .catch((e) => setError(e.message ?? "Erro ao carregar checklist"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Carregando...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "crimson" }}>{error}</div>;
  if (!checklist) return <div style={{ padding: 40, textAlign: "center" }}>Checklist não encontrado</div>;

  const totalItens = checklist.itens.length;
  const totalOk = checklist.itens.filter(i => i.status === "OK").length;
  const totalNok = checklist.itens.filter(i => i.status === "NOK").length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 16,
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "white",
          cursor: "pointer",
        }}
      >
        ← Voltar
      </button>

      {/* CABEÇALHO */}
      <div style={{
        background: "#f8f9fa",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
      }}>
        <h1 style={{ margin: "0 0 12px 0" }}>Checklist - {checklist.equipamentoCodigo}</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: 12 }}>OPERADOR</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{checklist.operadorNome}</p>
          </div>

          <div>
            <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: 12 }}>DATA/HORA</p>
            <p style={{ margin: 0, fontWeight: 700 }}>
              {new Date(checklist.dataRealizacao).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {checklist.observacoesGerais && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd" }}>
            <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: 12 }}>OBSERVAÇÕES GERAIS</p>
            <p style={{ margin: 0 }}>{checklist.observacoesGerais}</p>
          </div>
        )}
      </div>

      {/* RESUMO */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{
          background: "#e8f5e9",
          border: "2px solid #1f6f3d",
          borderRadius: 12,
          padding: 12,
          minWidth: 120,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1f6f3d" }}>{totalOk}</div>
          <div style={{ color: "#2e7d32", fontSize: 12 }}>OK</div>
        </div>

        <div style={{
          background: "#fff3cd",
          border: "2px solid #7a5a00",
          borderRadius: 12,
          padding: 12,
          minWidth: 120,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#7a5a00" }}>{totalNok}</div>
          <div style={{ color: "#856404", fontSize: 12 }}>NOK</div>
        </div>

        <div style={{
          background: "#e7f3ff",
          border: "2px solid #0066cc",
          borderRadius: 12,
          padding: 12,
          minWidth: 120,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0066cc" }}>{totalItens}</div>
          <div style={{ color: "#0052a3", fontSize: 12 }}>Total</div>
        </div>
      </div>

      {/* ITENS */}
      <div>
        <h2 style={{ marginBottom: 12 }}>Itens do Checklist</h2>

        {checklist.itens.map((item, idx) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              background: item.status === "OK" ? "#f0f9ff" : "#fef2f2",
              borderColor: item.status === "OK" ? "#0066cc" : "#b91c1c",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px 0", color: "#666", fontSize: 12 }}>
                  ITEM {idx + 1}
                </p>
                <h3 style={{ margin: "0 0 8px 0" }}>{item.descricao}</h3>

                {item.instrucao && (
                  <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: 13 }}>
                    <b>Instrução:</b> {item.instrucao}
                  </p>
                )}

                {item.observacao && (
                  <p style={{ margin: "0 0 0 0", color: "#666", fontSize: 13 }}>
                    <b>Observação:</b> {item.observacao}
                  </p>
                )}
              </div>

              <div style={{
                background: item.status === "OK" ? "#e8f5e9" : "#fee2e2",
                border: `2px solid ${item.status === "OK" ? "#1f6f3d" : "#b91c1c"}`,
                borderRadius: 8,
                padding: "8px 12px",
                minWidth: 80,
                textAlign: "center",
                marginLeft: 16,
              }}>
                <span style={{
                  fontWeight: 700,
                  color: item.status === "OK" ? "#1f6f3d" : "#b91c1c",
                }}>
                  {item.status === "OK" ? "✓ OK" : "✗ NOK"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BOTÃO IMPRIMIR */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: "#111827",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Imprimir / Exportar
        </button>
      </div>
    </div>
  );
}