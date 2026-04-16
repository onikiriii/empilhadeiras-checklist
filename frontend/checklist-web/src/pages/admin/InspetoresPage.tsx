import React, { useEffect, useState } from "react";
import { api, ApiError } from "../../api";

const inspectorModules = [
  { code: "seguranca-trabalho", label: "Segurança do Trabalho" },
  { code: "inspecao-materiais", label: "Inspeção de Materiais" },
] as const;

type SetorOption = {
  id: string;
  nome: string;
  ativo: boolean;
};

type Inspetor = {
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
  tipoUsuario: "Supervisor" | "Inspetor";
  modulosDisponiveis: string[];
};

export default function InspetoresPage() {
  const [inspetores, setInspetores] = useState<Inspetor[]>([]);
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
    modulosDisponiveis: ["seguranca-trabalho"] as string[],
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
      const [loadedSetores, loadedInspetores] = await Promise.all([
        api.get<SetorOption[]>("/api/master/setores"),
        api.get<Inspetor[]>("/api/master/inspetores"),
      ]);

      const setoresAtivos = loadedSetores.filter((setor) => setor.ativo);
      setSetores(setoresAtivos);
      setInspetores(loadedInspetores);
      setForm((current) => ({
        ...current,
        setorId: current.setorId || setoresAtivos[0]?.id || "",
      }));
    } catch (e) {
      setError(extractMessage(e, "Erro ao carregar setores e inspetores."));
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
        modulosDisponiveis: form.modulosDisponiveis,
        ramal: form.ramal || null,
        email: form.email || null,
        ativo: form.ativo,
        senha: form.senha || null,
        confirmaSenha: form.confirmaSenha || null,
      };

      if (editingId) {
        const updated = await api.put<Inspetor>(`/api/master/inspetores/${editingId}`, payload);
        setInspetores((current) =>
          current
            .map((inspetor) => (inspetor.id === updated.id ? updated : inspetor))
            .sort((a, b) =>
              `${a.setorNome}${a.nomeCompleto}`.localeCompare(`${b.setorNome}${b.nomeCompleto}`, "pt-BR"),
            ),
        );
        setSuccess(`Inspetor ${updated.nomeCompleto} atualizado. Login atual: ${updated.login}.`);
      } else {
        const created = await api.post<Inspetor>("/api/master/inspetores", payload);
        setInspetores((current) =>
          [...current, created].sort((a, b) =>
            `${a.setorNome}${a.nomeCompleto}`.localeCompare(`${b.setorNome}${b.nomeCompleto}`, "pt-BR"),
          ),
        );
        setSuccess(`Login ${created.login} criado.`);
      }

      resetForm();
    } catch (e) {
      setError(extractMessage(e, editingId ? "Erro ao atualizar inspetor." : "Erro ao criar inspetor."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(inspetor: Inspetor) {
    setEditingId(inspetor.id);
    setForm({
      nome: inspetor.nome,
      sobrenome: inspetor.sobrenome,
      senha: "",
      confirmaSenha: "",
      setorId: inspetor.setorId,
      forceChange: inspetor.forceChangePassword,
      modulosDisponiveis: inspetor.modulosDisponiveis,
      ramal: inspetor.ramal || "",
      email: inspetor.email || "",
      ativo: inspetor.ativo,
    });
    setError("");
    setSuccess("");
  }

  function handleToggleModule(moduleCode: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      modulosDisponiveis: checked
        ? [...current.modulosDisponiveis, moduleCode]
        : current.modulosDisponiveis.filter((item) => item !== moduleCode),
    }));
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
      modulosDisponiveis: ["seguranca-trabalho"],
      ramal: "",
      email: "",
      ativo: true,
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Inspetores</h1>
        <div style={styles.metricsRow}>
          <MetricCard value={inspetores.length} label="Inspetores" />
          <MetricCard value={inspectorModules.length} label="Módulos" />
        </div>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}
      {success ? <div style={styles.successAlert}>{success}</div> : null}

      <section style={styles.grid}>
        <div style={styles.formCard}>
          <h2 style={styles.cardTitle}>{editingId ? "Editar inspetor" : "Novo inspetor"}</h2>
          <div style={styles.helperText}>
            Inspetores podem acessar múltiplos módulos de inspeção. O módulo operacional não é gerenciado aqui.
          </div>

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

              <div style={styles.modulesCard}>
                <div style={styles.modulesLabel}>Módulos de inspeção</div>
                <div style={styles.modulesGrid}>
                  {inspectorModules.map((module) => (
                    <label key={module.code} style={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={form.modulosDisponiveis.includes(module.code)}
                        onChange={(e) => handleToggleModule(module.code, e.target.checked)}
                        style={styles.checkbox}
                      />
                      <span style={styles.checkboxLabel}>{module.label}</span>
                    </label>
                  ))}
                </div>
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
            <span style={styles.countBadge}>{inspetores.length}</span>
          </div>

          {loading ? (
            <div style={styles.loadingCard}>Carregando inspetores...</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Inspetor</th>
                    <th style={styles.th}>Setor</th>
                    <th style={styles.th}>Login</th>
                    <th style={styles.th}>Contato</th>
                    <th style={styles.th}>Módulos</th>
                    <th style={{ ...styles.th, width: 120 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inspetores.map((inspetor) => (
                    <tr key={inspetor.id} className="cf-data-row" style={styles.tr}>
                      <td style={styles.tdName}>
                        <div>{inspetor.nomeCompleto}</div>
                        <div style={styles.metaText}>{inspetor.ativo ? "Ativo" : "Inativo"}</div>
                      </td>
                      <td style={styles.td}><span style={styles.setorBadge}>{inspetor.setorNome}</span></td>
                      <td style={styles.td}><span style={styles.loginBadge}>{inspetor.login}</span></td>
                      <td style={styles.td}>
                        <div>{inspetor.email || "-"}</div>
                        <div style={styles.metaText}>{inspetor.ramal || "-"}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.accessBadges}>
                          {inspetor.modulosDisponiveis.map((moduleCode) => (
                            <span key={moduleCode} style={{ ...styles.badge, ...(moduleCode === "seguranca-trabalho" ? styles.badgeStp : styles.badgeMaterial) }}>
                              {moduleCode === "seguranca-trabalho" ? "STP" : "Materiais"}
                            </span>
                          ))}
                          <span style={{ ...styles.badge, ...(inspetor.forceChangePassword ? styles.badgeWarning : styles.badgeSuccess) }}>
                            {inspetor.forceChangePassword ? "Pendente" : "Liberado"}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button type="button" onClick={() => handleEdit(inspetor)} style={styles.secondarySmallButton}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {inspetores.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyState}>Nenhum inspetor</td>
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
  grid: { display: "grid", gridTemplateColumns: "minmax(360px, 460px) minmax(0, 1fr)", gap: 16, alignItems: "start" },
  formCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 18 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" },
  helperText: { marginTop: 8, fontSize: 13.5, lineHeight: 1.5, color: "#667085" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 16 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  input: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, boxSizing: "border-box", outline: "none" },
  checkboxCell: { display: "flex", alignItems: "center" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#0057B8" },
  checkboxLabel: { fontSize: 14, color: "#344054", fontWeight: 500 },
  modulesCard: { gridColumn: "1 / -1", borderRadius: 16, border: "1px solid #DDE6F0", background: "#F8FBFF", padding: 14 },
  modulesLabel: { fontSize: 13.5, fontWeight: 700, color: "#344054", marginBottom: 10 },
  modulesGrid: { display: "grid", gap: 10 },
  formFooter: { display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 10 },
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
  accessBadges: { display: "flex", flexWrap: "wrap", gap: 6 },
  loginBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 96, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: "#EAF2FF", color: "#0057B8", border: "1px solid #C9DDFC" },
  setorBadge: { display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: "#F5F7FA", color: "#344054", border: "1px solid #DEE7F1" },
  badge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 96, padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 },
  badgeSuccess: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  badgeStp: { background: "#ECFDF3", color: "#027A48", border: "1px solid #ABEFC6" },
  badgeMaterial: { background: "#EEF4FF", color: "#175CD3", border: "1px solid #C7D7FE" },
  badgeWarning: { background: "#FFF7E8", color: "#B54708", border: "1px solid #F7D29A" },
  secondarySmallButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  emptyState: { padding: 24, textAlign: "center", color: "#667085", fontSize: 14 },
};
