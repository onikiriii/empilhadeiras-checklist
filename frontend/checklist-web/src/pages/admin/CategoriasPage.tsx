import React, { useEffect, useState } from "react";
import { api } from "../../api";

const fechamentoOptions = [
  { value: 0, label: "Sem fechamento mensal" },
  { value: 1, label: "Empilhadeira a combustao" },
  { value: 2, label: "Empilhadeira eletrica" },
];

type Categoria = {
  id: string;
  nome: string;
  ativa: boolean;
  modeloFechamentoMensal: number;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", ativa: true, modeloFechamentoMensal: 0 });

  useEffect(() => {
    loadCategorias();
  }, []);

  async function loadCategorias() {
    setLoading(true);
    try {
      const data = await api.get<Categoria[]>("/api/supervisor/categorias-equipamento");
      setCategorias(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        nome: form.nome,
        ativa: form.ativa,
        modeloFechamentoMensal: form.modeloFechamentoMensal,
      };

      if (editingId) {
        await api.put(`/api/supervisor/categorias-equipamento/${editingId}`, payload);
      } else {
        await api.post("/api/supervisor/categorias-equipamento", payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ nome: "", ativa: true, modeloFechamentoMensal: 0 });
      loadCategorias();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar categoria");
    }
  }

  function handleEdit(categoria: Categoria) {
    setForm({
      nome: categoria.nome,
      ativa: categoria.ativa,
      modeloFechamentoMensal: categoria.modeloFechamentoMensal,
    });
    setEditingId(categoria.id);
    setShowForm(true);
  }

  async function handleToggleStatus(categoria: Categoria) {
    const proximoStatus = !categoria.ativa;
    if (!confirm(`Tem certeza que deseja ${proximoStatus ? "ativar" : "inativar"} esta categoria?`)) return;
    try {
      await api.put(`/api/supervisor/categorias-equipamento/${categoria.id}`, {
        nome: categoria.nome,
        ativa: proximoStatus,
        modeloFechamentoMensal: categoria.modeloFechamentoMensal,
      });
      loadCategorias();
    } catch (e: any) {
      setError(e.message ?? "Erro ao atualizar status da categoria");
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingCard}>Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Categorias</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ nome: "", ativa: true, modeloFechamentoMensal: 0 });
          }}
          style={styles.primaryButton}
        >
          {showForm ? "Cancelar" : "Nova categoria"}
        </button>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}

      <div style={styles.contentGrid}>
        {showForm ? (
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>{editingId ? "Editar" : "Nova categoria"}</h2>

            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <div>
                <label style={styles.label}>Nome</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Modelo de fechamento mensal</label>
                <select
                  value={form.modeloFechamentoMensal}
                  onChange={(e) => setForm({ ...form, modeloFechamentoMensal: Number(e.target.value) })}
                  style={styles.input}
                >
                  {fechamentoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={form.ativa}
                  onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxLabel}>Ativa</span>
              </label>

              <div style={styles.formActions}>
                <button type="submit" style={styles.successButton}>
                  {editingId ? "Salvar" : "Criar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm({ nome: "", ativa: true, modeloFechamentoMensal: 0 });
                  }}
                  style={styles.secondaryButton}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.cardTitle}>Lista</h2>
            <span style={styles.countBadge}>{categorias.length}</span>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nome</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, width: 160 }}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {categorias.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={styles.emptyCell}>
                      Nenhuma categoria
                    </td>
                  </tr>
                ) : (
                  categorias.map((categoria) => (
                    <tr key={categoria.id} className="cf-data-row" style={styles.tr}>
                      <td style={styles.tdName}>{categoria.nome}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(categoria.ativa ? styles.badgeSuccess : styles.badgeDanger) }}>
                          {categoria.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button onClick={() => handleEdit(categoria)} style={styles.secondarySmallButton}>Editar</button>
                          <button
                            onClick={() => handleToggleStatus(categoria)}
                            style={categoria.ativa ? styles.dangerSmallButton : styles.successSmallButton}
                          >
                            {categoria.ativa ? "Inativar" : "Ativar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 16 },
  loadingWrap: { padding: 8 },
  loadingCard: {
    background: "#FFFFFF",
    border: "1px solid #D9D9D9",
    borderRadius: 18,
    padding: 24,
    textAlign: "center",
    fontSize: 14,
    fontWeight: 600,
    color: "#475467",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1F2937",
    margin: 0,
  },
  primaryButton: {
    background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "11px 16px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  errorAlert: {
    background: "#FFF4F2",
    border: "1px solid #F3C9C5",
    color: "#912018",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 13.5,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 16,
    alignItems: "start",
  },
  formCard: {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(217,217,217,0.96)",
    borderRadius: 20,
    padding: 22,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#1F2937",
  },
  formGrid: { display: "grid", gap: 14, marginTop: 16 },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13.5,
    fontWeight: 600,
    color: "#344054",
  },
  input: {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 12,
    border: "1px solid #C9D2DC",
    background: "#FFFFFF",
    color: "#1F2937",
    fontSize: 14.5,
    outline: "none",
    boxSizing: "border-box",
  },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#0057B8" },
  checkboxLabel: { fontSize: 14, color: "#344054", fontWeight: 500 },
  formActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  successButton: {
    background: "#1E7E34",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    padding: "11px 16px",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#FFFFFF",
    color: "#344054",
    border: "1px solid #D0D5DD",
    borderRadius: 12,
    padding: "11px 16px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  tableCard: {
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(217,217,217,0.96)",
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 420,
  },
  tableHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid #EAECF0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
    height: 30,
    borderRadius: 999,
    background: "#EAF2FF",
    color: "#0057B8",
    fontSize: 13,
    fontWeight: 700,
    padding: "0 10px",
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 18px",
    fontSize: 12,
    fontWeight: 600,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    borderBottom: "1px solid #EAECF0",
    background: "#FCFCFD",
  },
  tr: { borderBottom: "1px solid #F2F4F7" },
  td: { padding: "14px 18px", fontSize: 14, color: "#475467", verticalAlign: "middle" },
  tdName: { padding: "14px 18px", fontSize: 14.5, color: "#1F2937", fontWeight: 500, verticalAlign: "middle" },
  emptyCell: { textAlign: "center", color: "#6B7280", padding: 28, fontSize: 14 },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 82,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 600,
  },
  badgeSuccess: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  badgeDanger: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5" },
  actionRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  secondarySmallButton: {
    background: "#FFFFFF",
    color: "#344054",
    border: "1px solid #D0D5DD",
    borderRadius: 10,
    padding: "7px 11px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  successSmallButton: {
    background: "#EAF8EE",
    color: "#1E7E34",
    border: "1px solid #B7E1C0",
    borderRadius: 10,
    padding: "7px 11px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerSmallButton: {
    background: "#FFF1F0",
    color: "#B42318",
    border: "1px solid #F2B8B5",
    borderRadius: 10,
    padding: "7px 11px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
};
