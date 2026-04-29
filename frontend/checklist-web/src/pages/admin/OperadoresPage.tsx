import React, { useEffect, useState } from "react";
import { api } from "../../api";

type Operador = {
  id: string;
  nome: string;
  matricula: string;
  login: string;
  forceChangePassword: boolean;
  ativo: boolean;
};

export default function OperadoresPage() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    matricula: "",
    login: "",
    senha: "",
    confirmaSenha: "",
    forceChangePassword: true,
    ativo: true,
  });

  useEffect(() => {
    void loadOperadores();
  }, []);

  async function loadOperadores() {
    setLoading(true);
    try {
      const data = await api.get<Operador[]>("/api/operadores");
      setOperadores(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar operadores");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/api/operadores/${editingId}`, form);
      } else {
        await api.post("/api/operadores", form);
      }

      resetForm();
      await loadOperadores();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar operador");
    }
  }

  function handleEdit(operador: Operador) {
    setForm({
      nome: operador.nome,
      matricula: operador.matricula,
      login: operador.login,
      senha: "",
      confirmaSenha: "",
      forceChangePassword: operador.forceChangePassword,
      ativo: operador.ativo,
    });
    setEditingId(operador.id);
    setShowForm(true);
  }

  async function handleToggleStatus(operador: Operador) {
    const proximoStatus = !operador.ativo;
    if (!confirm(`Tem certeza que deseja ${proximoStatus ? "ativar" : "inativar"} este operador?`)) return;

    try {
      await api.put(`/api/operadores/${operador.id}`, {
        nome: operador.nome,
        login: operador.login,
        ativo: proximoStatus,
        forceChangePassword: operador.forceChangePassword,
      });
      await loadOperadores();
    } catch (e: any) {
      setError(e.message ?? "Erro ao atualizar status do operador");
    }
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      nome: "",
      matricula: "",
      login: "",
      senha: "",
      confirmaSenha: "",
      forceChangePassword: true,
      ativo: true,
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Operadores</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
              return;
            }

            setShowForm(true);
            setEditingId(null);
          }}
          style={styles.primaryButton}
        >
          {showForm ? "Cancelar" : "Novo operador"}
        </button>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}

      <div style={styles.contentGrid}>
        {showForm ? (
          <div style={styles.formCard}>
            <h2 style={styles.cardTitle}>{editingId ? "Editar operador" : "Novo operador"}</h2>

            <form onSubmit={handleSubmit} style={styles.formGrid}>
              <div>
                <label style={styles.label}>Nome</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Matrícula</label>
                <input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} required style={styles.input} disabled={!!editingId} />
              </div>

              <div>
                <label style={styles.label}>Login</label>
                <input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Senha</label>
                <input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} required={!editingId} style={styles.input} />
              </div>

              <div>
                <label style={styles.label}>Confirmar senha</label>
                <input type="password" value={form.confirmaSenha} onChange={(e) => setForm({ ...form, confirmaSenha: e.target.value })} required={!editingId || !!form.senha} style={styles.input} />
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={form.forceChangePassword}
                  onChange={(e) => setForm({ ...form, forceChangePassword: e.target.checked })}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxLabel}>Forçar troca de senha no primeiro acesso</span>
              </label>

              <label style={styles.checkboxRow}>
                <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} style={styles.checkbox} />
                <span style={styles.checkboxLabel}>Ativo</span>
              </label>

              <div style={styles.formActions}>
                <button type="submit" style={styles.successButton}>{editingId ? "Salvar" : "Criar"}</button>
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>Cancelar</button>
              </div>
            </form>
          </div>
        ) : null}

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.cardTitle}>Lista</h2>
          </div>

          {loading ? (
            <div style={styles.loadingCard}>Carregando operadores...</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nome</th>
                    <th style={styles.th}>Matrícula</th>
                    <th style={styles.th}>Login</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, width: 220 }}>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {operadores.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={styles.emptyCell}>Nenhum operador</td>
                    </tr>
                  ) : (
                    operadores.map((operador) => (
                      <tr key={operador.id} className="cf-data-row" style={styles.tr}>
                        <td style={styles.tdName}>{operador.nome}</td>
                        <td style={styles.td}><span style={styles.pill}>{operador.matricula}</span></td>
                        <td style={styles.td}><span style={styles.pill}>{operador.login}</span></td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <span style={{ ...styles.badge, ...(operador.ativo ? styles.badgeSuccess : styles.badgeDanger) }}>
                              {operador.ativo ? "Ativo" : "Inativo"}
                            </span>
                            <span style={{ ...styles.badge, ...(operador.forceChangePassword ? styles.badgeDanger : styles.badgeSuccess) }}>
                              {operador.forceChangePassword ? "Troca pendente" : "Senha liberada"}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button onClick={() => handleEdit(operador)} style={styles.secondarySmallButton}>Editar</button>
                            <button
                              onClick={() => void handleToggleStatus(operador)}
                              style={operador.ativo ? styles.dangerSmallButton : styles.successSmallButton}
                            >
                              {operador.ativo ? "Inativar" : "Ativar"}
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
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 16,
    alignItems: "start",
  },
  formCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 22 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" },
  formGrid: { display: "grid", gap: 14, marginTop: 16 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  input: {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 12,
    border: "1px solid #C9D2DC",
    background: "#FFFFFF",
    color: "#1F2937",
    fontSize: 14.5,
    boxSizing: "border-box",
    outline: "none",
  },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#0057B8" },
  checkboxLabel: { fontSize: 14, color: "#344054", fontWeight: 500 },
  formActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  successButton: { background: "#1E7E34", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  secondaryButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  secondarySmallButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  successSmallButton: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  dangerSmallButton: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  actionRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  loadingCard: { padding: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#475467" },
  tableCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, overflow: "hidden", minHeight: 440 },
  tableHeader: { padding: "16px 18px", borderBottom: "1px solid #EAECF0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: 0.35, borderBottom: "1px solid #EAECF0", background: "#FCFCFD" },
  tr: { borderBottom: "1px solid #F2F4F7" },
  td: { padding: "14px 18px", fontSize: 14, color: "#475467", verticalAlign: "middle" },
  tdName: { padding: "14px 18px", fontSize: 14.5, color: "#1F2937", fontWeight: 500, verticalAlign: "middle" },
  pill: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 76, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "#F2F4F7", color: "#475467", border: "1px solid #E4E7EC" },
  badge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 82, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 },
  badgeSuccess: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  badgeDanger: { background: "#FFF1F0", color: "#B42318", border: "1px solid #F2B8B5" },
  emptyCell: { textAlign: "center", color: "#6B7280", padding: 28, fontSize: 14 },
};
