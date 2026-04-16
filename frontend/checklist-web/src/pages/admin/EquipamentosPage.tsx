import React, { useEffect, useState } from "react";
import { api } from "../../api";

type Categoria = { id: string; nome: string };
type Equipamento = {
  id: string;
  codigo: string;
  descricao: string;
  qrId: string;
  categoriaId: string;
  categoriaNome: string;
  ativa: boolean;
};

export default function EquipamentosPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    codigo: "",
    descricao: "",
    categoriaId: "",
    ativa: true,
  });

  useEffect(() => {
    loadCategorias();
    loadEquipamentos();
  }, []);

  async function loadCategorias() {
    try {
      const data = await api.get<Categoria[]>("/api/supervisor/categorias-equipamento?ativas=true");
      setCategorias(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar categorias");
    }
  }

  async function loadEquipamentos() {
    setLoading(true);
    try {
      const data = await api.get<Equipamento[]>("/api/equipamentos");
      setEquipamentos(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar equipamentos");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/api/equipamentos/${editingId}`, form);
      } else {
        await api.post("/api/equipamentos", form);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ codigo: "", descricao: "", categoriaId: "", ativa: true });
      loadEquipamentos();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar equipamento");
    }
  }

  function handleEdit(equipamento: Equipamento) {
    setForm({
      codigo: equipamento.codigo,
      descricao: equipamento.descricao,
      categoriaId: equipamento.categoriaId,
      ativa: equipamento.ativa,
    });
    setEditingId(equipamento.id);
    setShowForm(true);
  }

  async function handleToggleStatus(equipamento: Equipamento) {
    const proximoStatus = !equipamento.ativa;
    if (!confirm(`Tem certeza que deseja ${proximoStatus ? "ativar" : "inativar"} este equipamento?`)) return;

    try {
      await api.put(`/api/equipamentos/${equipamento.id}`, {
        descricao: equipamento.descricao,
        categoriaId: equipamento.categoriaId,
        ativa: proximoStatus,
      });
      loadEquipamentos();
    } catch (e: any) {
      setError(e.message ?? "Erro ao atualizar status do equipamento");
    }
  }

  function generateQrId() {
    const qrId = crypto.randomUUID();
    setForm({ ...form, codigo: qrId.substring(0, 8).toUpperCase() });
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Equipamentos</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ codigo: "", descricao: "", categoriaId: "", ativa: true });
          }}
          style={styles.primaryButton}
        >
          {showForm ? "Cancelar" : "Novo equipamento"}
        </button>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}

      <div style={styles.contentGrid}>
        {showForm ? (
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>{editingId ? "Editar" : "Novo equipamento"}</h2>

            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <div>
                <label style={styles.label}>Código</label>
                <div style={styles.inlineField}>
                  <input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    required
                    disabled={!!editingId}
                    style={{ ...styles.input, ...(editingId ? styles.inputDisabled : {}) }}
                  />

                  {!editingId ? (
                    <button type="button" onClick={generateQrId} style={styles.secondarySmallButton}>Gerar</button>
                  ) : null}
                </div>
              </div>

              <div>
                <label style={styles.label}>Categoria</label>
                <select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })} required style={styles.input}>
                  <option value="">Selecione</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Descrição</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required style={styles.input} />
              </div>

              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={form.ativa} onChange={(e) => setForm({ ...form, ativa: e.target.checked })} style={styles.checkbox} />
                <span style={styles.checkboxLabel}>Ativo</span>
              </label>

              <div style={styles.formActions}>
                <button type="submit" style={styles.successButton}>{editingId ? "Salvar" : "Criar"}</button>
                <button type="button" onClick={() => setShowForm(false)} style={styles.secondaryButton}>Cancelar</button>
              </div>
            </form>
          </div>
        ) : null}

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.cardTitle}>Lista</h2>
          </div>

          {loading ? (
            <div style={styles.loadingCard}>Carregando equipamentos...</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Código</th>
                    <th style={styles.th}>Descrição</th>
                    <th style={styles.th}>QR ID</th>
                    <th style={styles.th}>Categoria</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, width: 190 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {equipamentos.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyCell}>Nenhum equipamento</td>
                    </tr>
                  ) : (
                    equipamentos.map((equipamento) => (
                      <tr key={equipamento.id} className="cf-data-row" style={styles.tr}>
                        <td style={styles.td}><span style={styles.codeBadge}>{equipamento.codigo}</span></td>
                        <td style={styles.tdDescription}>{equipamento.descricao}</td>
                        <td style={styles.td}><span style={styles.qrBadge}>{equipamento.qrId}</span></td>
                        <td style={styles.td}>{equipamento.categoriaNome}</td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, ...(equipamento.ativa ? styles.badgeSuccess : styles.badgeDanger) }}>
                            {equipamento.ativa ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button onClick={() => handleEdit(equipamento)} style={styles.secondarySmallButton}>Editar</button>
                            <button
                              onClick={() => handleToggleStatus(equipamento)}
                              style={equipamento.ativa ? styles.dangerSmallButton : styles.successSmallButton}
                            >
                              {equipamento.ativa ? "Inativar" : "Ativar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  title: { fontSize: 24, fontWeight: 700, color: "#1F2937", margin: 0 },
  primaryButton: { background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  errorAlert: { background: "#FFF4F2", border: "1px solid #F3C9C5", color: "#912018", borderRadius: 14, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  contentGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, alignItems: "start" },
  formCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 22 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" },
  formGrid: { display: "grid", gap: 14, marginTop: 16 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  inlineField: { display: "flex", gap: 8, alignItems: "stretch" },
  input: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, outline: "none", boxSizing: "border-box" },
  inputDisabled: { background: "#F5F7FA", color: "#667085" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#0057B8" },
  checkboxLabel: { fontSize: 14, color: "#344054", fontWeight: 500 },
  formActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  successButton: { background: "#1E7E34", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  secondaryButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  secondarySmallButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  successSmallButton: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  dangerSmallButton: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  actionRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  loadingCard: { padding: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#475467" },
  tableCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, overflow: "hidden", minHeight: 460 },
  tableHeader: { padding: "16px 18px", borderBottom: "1px solid #EAECF0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: 0.35, borderBottom: "1px solid #EAECF0", background: "#FCFCFD" },
  tr: { borderBottom: "1px solid #F2F4F7" },
  td: { padding: "14px 18px", fontSize: 14, color: "#475467", verticalAlign: "middle" },
  tdDescription: { padding: "14px 18px", fontSize: 14.5, color: "#1F2937", fontWeight: 500, verticalAlign: "middle" },
  codeBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 72, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "#EAF2FF", color: "#0057B8", border: "1px solid #C9DDFC" },
  qrBadge: { display: "inline-flex", alignItems: "center", maxWidth: 190, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "#F8FAFC", color: "#344054", border: "1px solid #DEE7F1", fontFamily: "Consolas, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  badge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 82, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 },
  badgeSuccess: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  badgeDanger: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5" },
  emptyCell: { textAlign: "center", color: "#6B7280", padding: 28, fontSize: 14 },
};
