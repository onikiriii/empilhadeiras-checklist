import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../../api";
import type { StpAreaChecklistListItemDto } from "../../types";

export default function StpChecklistsPage() {
  const [checklists, setChecklists] = useState<StpAreaChecklistListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [responsavel, setResponsavel] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (dataInicio) query.set("dataInicio", dataInicio);
      if (dataFim) query.set("dataFim", dataFim);
      if (responsavel.trim()) query.set("responsavel", responsavel.trim());

      const data = await api.get<StpAreaChecklistListItemDto[]>(`/api/stp/checklists${query.size ? `?${query.toString()}` : ""}`);
      setChecklists(data);
    } catch (err) {
      setError(extractError(err, "Erro ao carregar historico STP."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>Historico</div>
          <h1 style={styles.title}>Inspecoes de area</h1>
        </div>
      </div>

      <section style={styles.filters}>
        <Field label="Inicio">
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={styles.input} />
        </Field>
        <Field label="Fim">
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={styles.input} />
        </Field>
        <Field label="Supervisor responsavel">
          <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} style={styles.input} />
        </Field>
        <div style={styles.filterActions}>
          <button type="button" onClick={() => void load()} style={styles.primaryButton}>
            Filtrar
          </button>
        </div>
      </section>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <section style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Carregando inspecoes...</div>
        ) : checklists.length === 0 ? (
          <div style={styles.emptyState}>Nenhuma inspecao de area encontrada.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Data</th>
                  <th style={styles.th}>Template</th>
                  <th style={styles.th}>Area inspecionada</th>
                  <th style={styles.th}>Inspetor</th>
                  <th style={styles.th}>Supervisor responsavel</th>
                  <th style={styles.th}>Resultado</th>
                  <th style={styles.th}>Acao</th>
                </tr>
              </thead>
              <tbody>
                {checklists.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>{new Date(item.dataRealizacao).toLocaleString("pt-BR")}</td>
                    <td style={styles.td}>
                      {item.templateCodigo} - {item.templateNome}
                    </td>
                    <td style={styles.td}>{item.areaInspecaoNome}</td>
                    <td style={styles.td}>{item.inspetorNomeCompleto}</td>
                    <td style={styles.td}>{item.responsavelAreaNomeCompleto}</td>
                    <td style={styles.td}>
                      <span style={styles.badgeCheck}>{item.totalCheck} check</span>
                      <span style={styles.badgeX}>{item.totalX} X</span>
                    </td>
                    <td style={styles.td}>
                      <Link to={`/stp/checklists/${item.id}`} style={styles.detailLink}>
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0F766E" },
  title: { margin: "6px 0 0 0", fontSize: 30, color: "#052E2B" },
  primaryLink: { textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 16px", borderRadius: 12, background: "#0F766E", color: "#FFFFFF", fontWeight: 800 },
  filters: { background: "#FFFFFF", border: "1px solid #D0D5DD", borderRadius: 20, padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, alignItems: "end" },
  field: { display: "grid", gap: 8 },
  label: { fontSize: 13, fontWeight: 700, color: "#344054" },
  input: { width: "100%", boxSizing: "border-box", minHeight: 44, borderRadius: 12, border: "1px solid #D0D5DD", padding: "10px 12px", fontSize: 14, background: "#FFFFFF", color: "#101828" },
  filterActions: { display: "flex", justifyContent: "flex-end" },
  primaryButton: { border: "none", borderRadius: 12, minHeight: 44, padding: "0 16px", background: "#0F766E", color: "#FFFFFF", fontWeight: 800, cursor: "pointer" },
  errorBox: { border: "1px solid #F04438", background: "#FEF3F2", color: "#B42318", borderRadius: 14, padding: "12px 14px", fontSize: 14 },
  card: { background: "#FFFFFF", border: "1px solid #D0D5DD", borderRadius: 24, overflow: "hidden" },
  emptyState: { padding: 24, color: "#667085", fontSize: 14 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #EAECF0", background: "#FCFCFD" },
  td: { padding: "14px 16px", fontSize: 14, color: "#344054", borderBottom: "1px solid #F2F4F7", verticalAlign: "middle" },
  badgeCheck: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 72, height: 28, borderRadius: 999, background: "#ECFDF3", color: "#027A48", fontSize: 12, fontWeight: 800, marginRight: 6 },
  badgeX: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 52, height: 28, borderRadius: 999, background: "#FEF3F2", color: "#B42318", fontSize: 12, fontWeight: 800 },
  detailLink: { textDecoration: "none", color: "#0A6AD7", fontWeight: 700 },
};
