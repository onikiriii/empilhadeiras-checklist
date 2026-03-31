import React, { useEffect, useState } from "react";
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
    setError("");

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

  function resetFiltros() {
    const hoje = new Date().toISOString().split("T")[0];
    setDataInicio(hoje);
    setDataFim(hoje);
    setStatus("");
    setOperador("");
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Checklists</h1>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}

      <div style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <div>
            <label style={styles.label}>Início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.input}>
              <option value="">Todos</option>
              <option value="ok">Conforme</option>
              <option value="nok">Não conforme</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Operador</label>
            <input value={operador} onChange={(e) => setOperador(e.target.value)} style={styles.input} />
          </div>
        </div>

        <div style={styles.filterActions}>
          <button type="button" onClick={loadChecklists} style={styles.primaryButton}>Buscar</button>
          <button type="button" onClick={resetFiltros} style={styles.secondaryButton}>Limpar</button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingCard}>Carregando checklists...</div>
      ) : (
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.cardTitle}>Resultados</h2>
            <span style={styles.countBadge}>{checklists.length}</span>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Equipamento</th>
                  <th style={styles.th}>Operador</th>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Itens</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, width: 90 }}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {checklists.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={styles.emptyCell}>Nenhum checklist</td>
                  </tr>
                ) : (
                  checklists.map((checklist) => (
                    <tr key={checklist.id} className="cf-data-row" style={styles.tr}>
                      <td style={styles.td}>
                        <div>
                          <span style={styles.codeBadge}>{checklist.equipamentoCodigo}</span>
                          <div style={styles.equipDescription}>{checklist.equipamentoDescricao}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.operatorName}>{checklist.operadorNome}</div>
                        <div style={styles.operatorMatricula}>{checklist.operadorMatricula}</div>
                      </td>
                      <td style={styles.td}>{formatarData(checklist.criadoEm)}</td>
                      <td style={styles.td}>
                        <div style={styles.itemsSummary}>
                          <span style={styles.itemsTotal}>{checklist.totalItens}</span>
                          <span style={styles.itemsOk}>OK {checklist.itensOk}</span>
                          <span style={styles.itemsNok}>NOK {checklist.itensNok}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, ...(checklist.status === "ok" ? styles.statusBadgeSuccess : styles.statusBadgeDanger) }}>
                          {checklist.status === "ok" ? "Conforme" : "Não conforme"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <a href={`/supervisor/checklist/${checklist.id}`} style={styles.viewButton}>Ver</a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  title: { fontSize: 24, fontWeight: 700, color: "#1F2937", margin: 0 },
  errorAlert: { background: "#FFF4F2", border: "1px solid #F3C9C5", color: "#912018", borderRadius: 14, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  filterCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 18, display: "grid", gap: 14 },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  input: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, outline: "none", boxSizing: "border-box" },
  filterActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primaryButton: { background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  secondaryButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  loadingCard: { background: "#FFFFFF", border: "1px solid #D9D9D9", borderRadius: 18, padding: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#475467" },
  tableCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, overflow: "hidden" },
  tableHeader: { padding: "16px 18px", borderBottom: "1px solid #EAECF0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" },
  countBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 30, borderRadius: 999, background: "#EAF2FF", color: "#0057B8", fontSize: 13, fontWeight: 700, padding: "0 10px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: 0.35, borderBottom: "1px solid #EAECF0", background: "#FCFCFD" },
  tr: { borderBottom: "1px solid #F2F4F7" },
  td: { padding: "14px 18px", fontSize: 14, color: "#475467", verticalAlign: "middle" },
  codeBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "#EAF2FF", color: "#0057B8", border: "1px solid #C9DDFC", marginBottom: 6 },
  equipDescription: { fontSize: 14.5, color: "#1F2937", fontWeight: 500 },
  operatorName: { fontSize: 14.5, color: "#1F2937", fontWeight: 500 },
  operatorMatricula: { fontSize: 12.5, color: "#667085", marginTop: 4, fontWeight: 400 },
  itemsSummary: { display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12.5, alignItems: "center" },
  itemsTotal: { color: "#475467", fontWeight: 600 },
  itemsOk: { color: "#1E7E34", fontWeight: 600 },
  itemsNok: { color: "#B42318", fontWeight: 600 },
  statusBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 100, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 },
  statusBadgeSuccess: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  statusBadgeDanger: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5" },
  viewButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, textDecoration: "none" },
  emptyCell: { textAlign: "center", color: "#6B7280", padding: 28, fontSize: 14 },
};
