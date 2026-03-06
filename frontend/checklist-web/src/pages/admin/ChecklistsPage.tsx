import { useEffect, useState } from "react";
import { api } from "../../api";

type Checklist = {
  id: string;
  equipamentoCodigo: string;
  equipamentoDescricao: string;
  operadorNome: string;
  operadorMatricula: string;
  criadoEm: string;
  status: "ok" | "nok";
  totalItens: number;
  itensOk: number;
  itensNok: number;
};

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState("");
  const [operador, setOperador] = useState("");

  useEffect(() => {
    const hoje = new Date().toISOString().split("T")[0];
    setDataInicio(hoje);
    setDataFim(hoje);
  }, []);

  useEffect(() => {
    if (dataInicio) loadChecklists();
  }, [dataInicio, dataFim]);

  async function loadChecklists() {
    setLoading(true);
    try {
      let url = `/api/supervisor/checklists?dataInicio=${dataInicio}`;
      if (dataFim) url += `&dataFim=${dataFim}`;
      if (status) url += `&status=${status}`;
      if (operador) url += `&operador=${encodeURIComponent(operador)}`;

      const data = await api.get<Checklist[]>(url);
      setChecklists(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar checklists");
    } finally {
      setLoading(false);
    }
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
            Checklists Realizados
          </h1>
          <p style={{ color: "#6B7280", fontSize: 14 }}>
            Consulte e filtre os checklists por data, status ou operador
          </p>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={(e) => { e.preventDefault(); loadChecklists(); }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <label>Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <label>Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="ok">Conforme</option>
                <option value="nok">Não Conforme</option>
              </select>
            </div>
            <div>
              <label>Operador</label>
              <input
                type="text"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                placeholder="Nome ou matrícula"
              />
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                const hoje = new Date().toISOString().split("T")[0];
                setDataInicio(hoje);
                setDataFim(hoje);
                setStatus("");
                setOperador("");
              }}
              className="btn btn-secondary"
            >
              Limpar
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>
          Carregando...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Equipamento</th>
                <th>Operador</th>
                <th>Data/Hora</th>
                <th>Itens</th>
                <th>Status</th>
                <th style={{ width: 80 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {checklists.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#6B7280", padding: 40 }}>
                    Nenhum checklist encontrado para o período selecionado
                  </td>
                </tr>
              ) : (
                checklists.map((checklist) => (
                  <tr key={checklist.id}>
                    <td>
                      <div>
                        <span className="badge badge-primary" style={{ marginBottom: 4 }}>
                          {checklist.equipamentoCodigo}
                        </span>
                        <div style={{ fontWeight: 500 }}>{checklist.equipamentoDescricao}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{checklist.operadorNome}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{checklist.operadorMatricula}</div>
                    </td>
                    <td>{formatarData(checklist.criadoEm)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                        <span>Total: {checklist.totalItens}</span>
                        <span style={{ color: "#059669" }}>✅ {checklist.itensOk}</span>
                        <span style={{ color: "#DC2626" }}>❌ {checklist.itensNok}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${checklist.status === "ok" ? "badge-success" : "badge-danger"}`}>
                        {checklist.status === "ok" ? "Conforme" : "Não Conforme"}
                      </span>
                    </td>
                    <td>
                      <a
                        href={`/supervisor/checklist/${checklist.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: 13 }}
                      >
                        Ver
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}