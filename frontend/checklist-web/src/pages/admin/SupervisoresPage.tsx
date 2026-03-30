import React, { useEffect, useState } from "react";
import { api, ApiError } from "../../api";

type SetorOption = {
  id: string;
  nome: string;
  ativo: boolean;
};

type Supervisor = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeCompleto: string;
  login: string;
  ramal?: string | null;
  email?: string | null;
  forceChangePassword: boolean;
  isMaster: boolean;
  ativo: boolean;
  setorId: string;
  setorNome: string;
};

export default function SupervisoresPage() {
  const [supervisores, setSupervisores] = useState<Supervisor[]>([]);
  const [setores, setSetores] = useState<SetorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    senha: "",
    confirmaSenha: "",
    setorId: "",
    forceChange: true,
    ramal: "",
    email: "",
    ativo: true,
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [loadedSetores, loadedSupervisores] = await Promise.all([
        api.get<SetorOption[]>("/api/master/setores"),
        api.get<Supervisor[]>("/api/master/supervisores"),
      ]);

      const setoresAtivos = loadedSetores.filter((setor) => setor.ativo);
      setSetores(setoresAtivos);
      setSupervisores(loadedSupervisores);
      setForm((current) => ({
        ...current,
        setorId: current.setorId || setoresAtivos[0]?.id || "",
      }));
    } catch (e) {
      setError(extractMessage(e, "Erro ao carregar setores e supervisores."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        nome: form.nome,
        sobrenome: form.sobrenome,
        setorId: form.setorId,
        forceChange: form.forceChange,
        ramal: form.ramal || null,
        email: form.email || null,
        ativo: form.ativo,
        senha: form.senha || null,
        confirmaSenha: form.confirmaSenha || null,
      };

      if (editingId) {
        const updated = await api.put<Supervisor>(`/api/master/supervisores/${editingId}`, payload);
        setSupervisores((current) =>
          current
            .map((supervisor) => (supervisor.id === updated.id ? updated : supervisor))
            .sort((a, b) =>
              `${a.setorNome}${a.nomeCompleto}`.localeCompare(`${b.setorNome}${b.nomeCompleto}`, "pt-BR"),
            ),
        );
        setSuccess(`Supervisor ${updated.nomeCompleto} atualizado. Login atual: ${updated.login}.`);
      } else {
        const created = await api.post<Supervisor>("/api/master/supervisores", payload);
        setSupervisores((current) =>
          [...current, created].sort((a, b) =>
            `${a.setorNome}${a.nomeCompleto}`.localeCompare(`${b.setorNome}${b.nomeCompleto}`, "pt-BR"),
          ),
        );
        setSuccess(`Login ${created.login} criado.`);
      }

      resetForm();
    } catch (e) {
      setError(extractMessage(e, editingId ? "Erro ao atualizar supervisor." : "Erro ao criar supervisor."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(supervisor: Supervisor) {
    setEditingId(supervisor.id);
    setForm({
      nome: supervisor.nome,
      sobrenome: supervisor.sobrenome,
      senha: "",
      confirmaSenha: "",
      setorId: supervisor.setorId,
      forceChange: supervisor.forceChangePassword,
      ramal: supervisor.ramal || "",
      email: supervisor.email || "",
      ativo: supervisor.ativo,
    });
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      nome: "",
      sobrenome: "",
      senha: "",
      confirmaSenha: "",
      setorId: setores[0]?.id || "",
      forceChange: true,
      ramal: "",
      email: "",
      ativo: true,
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Supervisores</h1>
        <div style={styles.metricsRow}>
          <MetricCard value={supervisores.length} label="Supervisores" />
          <MetricCard value={setores.length} label="Setores" />
        </div>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}
      {success ? <div style={styles.successAlert}>{success}</div> : null}

      <section style={styles.grid}>
        <div style={styles.formCard}>
          <h2 style={styles.cardTitle}>{editingId ? "Editar supervisor" : "Novo supervisor"}</h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <Field label="Nome">
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={styles.input} />
              </Field>

              <Field label="Sobrenome">
                <input value={form.sobrenome} onChange={(e) => setForm({ ...form, sobrenome: e.target.value })} style={styles.input} />
              </Field>

              <Field label="Setor">
                <select value={form.setorId} onChange={(e) => setForm({ ...form, setorId: e.target.value })} style={styles.input}>
                  <option value="">Selecione</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>{setor.nome}</option>
                  ))}
                </select>
              </Field>

              <Field label="Ramal">
                <input value={form.ramal} onChange={(e) => setForm({ ...form, ramal: e.target.value })} style={styles.input} />
              </Field>

              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={styles.input} />
              </Field>

              <Field label="Senha">
                <input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} style={styles.input} />
              </Field>

              <Field label="Confirmar senha">
                <input type="password" value={form.confirmaSenha} onChange={(e) => setForm({ ...form, confirmaSenha: e.target.value })} style={styles.input} />
              </Field>

              <div style={styles.checkboxCell}>
                <label style={styles.checkboxRow}>
                  <input type="checkbox" checked={form.forceChange} onChange={(e) => setForm({ ...form, forceChange: e.target.checked })} style={styles.checkbox} />
                  <span style={styles.checkboxLabel}>Troca no primeiro acesso</span>
                </label>
              </div>

              <div style={styles.checkboxCell}>
                <label style={styles.checkboxRow}>
                  <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} style={styles.checkbox} />
                  <span style={styles.checkboxLabel}>Ativo</span>
                </label>
              </div>
            </div>

            <div style={styles.formFooter}>
              {editingId ? (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Cancelar
                </button>
              ) : null}
              <button type="submit" disabled={submitting || setores.length === 0} style={styles.primaryButton}>
                {submitting ? (editingId ? "Salvando..." : "Criando...") : editingId ? "Salvar" : "Criar"}
              </button>
            </div>
          </form>
        </div>

        <section style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.cardTitle}>Lista</h2>
            <span style={styles.countBadge}>{supervisores.length}</span>
          </div>

          {loading ? (
            <div style={styles.loadingCard}>Carregando supervisores...</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Supervisor</th>
                    <th style={styles.th}>Setor</th>
                    <th style={styles.th}>Login</th>
                    <th style={styles.th}>Contato</th>
                    <th style={styles.th}>Acesso</th>
                    <th style={{ ...styles.th, width: 120 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisores.map((supervisor) => (
                    <tr key={supervisor.id} className="cf-data-row" style={styles.tr}>
                      <td style={styles.tdName}>
                        <div>{supervisor.nomeCompleto}</div>
                        <div style={styles.metaText}>{supervisor.ativo ? "Ativo" : "Inativo"}</div>
                      </td>
                      <td style={styles.td}><span style={styles.setorBadge}>{supervisor.setorNome}</span></td>
                      <td style={styles.td}><span style={styles.loginBadge}>{supervisor.login}</span></td>
                      <td style={styles.td}>
                        <div>{supervisor.email || "-"}</div>
                        <div style={styles.metaText}>{supervisor.ramal || "-"}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(supervisor.forceChangePassword ? styles.badgeWarning : styles.badgeSuccess) }}>
                          {supervisor.forceChangePassword ? "Pendente" : "Liberado"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button type="button" onClick={() => handleEdit(supervisor)} style={styles.secondarySmallButton}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {supervisores.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyState}>Nenhum supervisor</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function MetricCard({ value, label }: { value: number; label: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 16 },
  header: { display: "grid", gap: 14 },
  title: { margin: 0, fontSize: 24, color: "#1F2937", fontWeight: 700 },
  metricsRow: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 180px))", gap: 10 },
  metricCard: { borderRadius: 18, border: "1px solid #DDE6F0", background: "rgba(255,255,255,0.88)", padding: 14 },
  metricValue: { fontSize: 24, fontWeight: 700, color: "#0057B8" },
  metricLabel: { marginTop: 4, fontSize: 12.5, color: "#667085" },
  errorAlert: { background: "#FFF4F2", border: "1px solid #F3C9C5", color: "#912018", borderRadius: 14, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  successAlert: { background: "#EEF8F2", border: "1px solid #CDE8D6", color: "#116032", borderRadius: 14, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "minmax(340px, 420px) minmax(0, 1fr)", gap: 16, alignItems: "start" },
  formCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 18 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 16 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  input: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, boxSizing: "border-box", outline: "none" },
  checkboxCell: { display: "flex", alignItems: "center" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#0057B8" },
  checkboxLabel: { fontSize: 14, color: "#344054", fontWeight: 500 },
  formFooter: { display: "flex", justifyContent: "flex-end", marginTop: 16 },
  primaryButton: { background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  secondaryButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  tableCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, overflow: "hidden" },
  loadingCard: { padding: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#475467" },
  tableHeader: { padding: "16px 18px", borderBottom: "1px solid #EAECF0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  countBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 30, borderRadius: 999, background: "#EAF2FF", color: "#0057B8", fontSize: 13, fontWeight: 700, padding: "0 10px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 600, color: "#667085", textTransform: "uppercase", letterSpacing: 0.35, borderBottom: "1px solid #EAECF0", background: "#FCFCFD" },
  tr: { borderBottom: "1px solid #F2F4F7" },
  td: { padding: "14px 18px", fontSize: 14, color: "#475467", verticalAlign: "middle" },
  tdName: { padding: "14px 18px", fontSize: 14.5, color: "#1F2937", fontWeight: 500, verticalAlign: "middle" },
  metaText: { marginTop: 4, fontSize: 12.5, color: "#667085", fontWeight: 400 },
  loginBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 96, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: "#EAF2FF", color: "#0057B8", border: "1px solid #C9DDFC" },
  setorBadge: { display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: "#F5F7FA", color: "#344054", border: "1px solid #DEE7F1" },
  badge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 96, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 },
  badgeSuccess: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  badgeWarning: { background: "#FFF7E8", color: "#B54708", border: "1px solid #F7D29A" },
  secondarySmallButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  emptyState: { padding: 24, textAlign: "center", color: "#667085", fontSize: 14 },
};
