import React, { useEffect, useState } from "react";
import { api } from "../../api";

type Categoria = { id: string; nome: string };
type TemplateItem = {
  id: string;
  categoriaId: string;
  ordem: number;
  descricao: string;
  instrucao: string;
  ativo: boolean;
};

export default function TemplatesPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ordem: 1, descricao: "", instrucao: "", ativo: true });

  useEffect(() => { loadCategorias(); }, []);
  useEffect(() => { if (selectedCategoria) loadTemplates(selectedCategoria); }, [selectedCategoria]);

  async function loadCategorias() {
    try {
      const data = await api.get<Categoria[]>("/api/supervisor/categorias-equipamento");
      setCategorias(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar categorias");
    }
  }

  async function loadTemplates(categoriaId: string) {
    setLoading(true);
    try {
      const data = await api.get<TemplateItem[]>(`/api/supervisor/checklist-itens-template?categoriaId=${categoriaId}`);
      setTemplates(data.sort((a, b) => a.ordem - b.ordem));
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const payload = { categoriaId: selectedCategoria, ordem: form.ordem, descricao: form.descricao, instrucao: form.instrucao || null, ativo: form.ativo };
      if (editingId) await api.put(`/api/supervisor/checklist-itens-template/${editingId}`, payload);
      else await api.post("/api/supervisor/checklist-itens-template", payload);

      setShowForm(false);
      setEditingId(null);
      setForm({ ordem: templates.length + 1, descricao: "", instrucao: "", ativo: true });
      loadTemplates(selectedCategoria);
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar template");
    }
  }

  function handleEdit(template: TemplateItem) {
    setForm({ ordem: template.ordem, descricao: template.descricao, instrucao: template.instrucao || "", ativo: template.ativo });
    setEditingId(template.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    try {
      await api.delete(`/api/supervisor/checklist-itens-template/${id}`);
      loadTemplates(selectedCategoria);
    } catch (e: any) {
      setError(e.message ?? "Erro ao excluir template");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Templates</h1>
        {selectedCategoria ? <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ordem: templates.length + 1, descricao: "", instrucao: "", ativo: true }); }} style={styles.primaryButton}>Novo item</button> : null}
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}

      <div style={styles.pageGrid}>
        <div style={styles.sideColumn}>
          <div style={styles.selectorCard}>
            <h2 style={styles.cardTitle}>Categoria</h2>
            <div style={styles.formBlock}>
              <label style={styles.label}>Selecionar</label>
              <select value={selectedCategoria} onChange={(e) => setSelectedCategoria(e.target.value)} style={styles.input}>
                <option value="">Selecione</option>
                {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
            </div>
          </div>

          {showForm ? (
            <div style={styles.formCard}>
              <h2 style={styles.cardTitle}>{editingId ? "Editar item" : "Novo item"}</h2>
              <form onSubmit={handleSubmit} style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Ordem</label>
                  <input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 1 })} min={1} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Descrição</label>
                  <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Instrução</label>
                  <textarea value={form.instrucao} onChange={(e) => setForm({ ...form, instrucao: e.target.value })} rows={4} style={styles.textarea} />
                </div>
                <label style={styles.checkboxRow}>
                  <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} style={styles.checkbox} />
                  <span style={styles.checkboxLabel}>Ativo</span>
                </label>
                <div style={styles.formActions}>
                  <button type="submit" style={styles.successButton}>{editingId ? "Salvar" : "Criar"}</button>
                  <button type="button" onClick={() => setShowForm(false)} style={styles.secondaryButton}>Cancelar</button>
                </div>
              </form>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div style={styles.loadingCard}>Carregando templates...</div>
        ) : !selectedCategoria ? (
          <div style={styles.emptyCard}>Selecione uma categoria</div>
        ) : (
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h2 style={styles.cardTitle}>Itens</h2>
              <span style={styles.countBadge}>{templates.length}</span>
            </div>

            {templates.length === 0 ? (
              <div style={styles.emptyTable}>Nenhum item</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, width: 90 }}>Ordem</th>
                      <th style={styles.th}>Descrição</th>
                      <th style={styles.th}>Instrução</th>
                      <th style={{ ...styles.th, width: 100 }}>Status</th>
                      <th style={{ ...styles.th, width: 150 }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id} className="cf-data-row" style={styles.tr}>
                        <td style={styles.td}><span style={styles.orderBadge}>#{template.ordem}</span></td>
                        <td style={styles.tdDescription}>{template.descricao}</td>
                        <td style={styles.tdInstruction}>{template.instrucao || "-"}</td>
                        <td style={styles.td}><span style={{ ...styles.badge, ...(template.ativo ? styles.badgeSuccess : styles.badgeDanger) }}>{template.ativo ? "Ativo" : "Inativo"}</span></td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button onClick={() => handleEdit(template)} style={styles.secondarySmallButton}>Editar</button>
                            <button onClick={() => handleDelete(template.id)} style={styles.dangerSmallButton}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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
  pageGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, alignItems: "start" },
  sideColumn: { display: "grid", gap: 16 },
  selectorCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 22 },
  formCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 22 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" },
  formBlock: { display: "grid", gap: 12, marginTop: 16 },
  formGrid: { display: "grid", gap: 14, marginTop: 16 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  input: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, outline: "none", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 100 },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#0057B8" },
  checkboxLabel: { fontSize: 14, color: "#344054", fontWeight: 500 },
  formActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  successButton: { background: "#1E7E34", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  secondaryButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  loadingCard: { background: "#FFFFFF", border: "1px solid #D9D9D9", borderRadius: 18, padding: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#475467" },
  emptyCard: { background: "#FFFFFF", border: "1px solid #D9D9D9", borderRadius: 18, padding: 24, textAlign: "center", color: "#6B7280", fontSize: 14 },
  tableCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, overflow: "hidden", minHeight: 500 },
  tableHeader: { padding: "16px 18px", borderBottom: "1px solid #EAECF0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  countBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 30, borderRadius: 999, background: "#EAF2FF", color: "#0057B8", fontSize: 13, fontWeight: 700, padding: "0 10px" },
  emptyTable: { padding: 24, textAlign: "center", color: "#6B7280", fontSize: 14 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: 0.35, borderBottom: "1px solid #EAECF0", background: "#FCFCFD" },
  tr: { borderBottom: "1px solid #F2F4F7" },
  td: { padding: "14px 18px", fontSize: 14, color: "#475467", verticalAlign: "middle" },
  tdDescription: { padding: "14px 18px", fontSize: 14.5, color: "#1F2937", fontWeight: 500, verticalAlign: "middle" },
  tdInstruction: { padding: "14px 18px", fontSize: 13.5, color: "#667085", fontWeight: 400, verticalAlign: "middle" },
  orderBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 52, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "#EAF2FF", color: "#0057B8", border: "1px solid #C9DDFC" },
  badge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 82, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 },
  badgeSuccess: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  badgeDanger: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5" },
  actionRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  secondarySmallButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  dangerSmallButton: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
};
