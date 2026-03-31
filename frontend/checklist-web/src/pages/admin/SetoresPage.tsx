import React, { useEffect, useState } from "react";
import { api, ApiError } from "../../api";

type Setor = {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  criadoEm: string;
  supervisoresCount: number;
  equipamentosCount: number;
  operadoresCount: number;
};

export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", ativo: true });

  useEffect(() => {
    void loadSetores();
  }, []);

  async function loadSetores() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<Setor[]>("/api/master/setores");
      setSetores(data);
    } catch (e) {
      setError(extractMessage(e, "Erro ao carregar setores."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        const updated = await api.put<Setor>(`/api/master/setores/${editingId}`, form);
        setSetores((current) => current.map((setor) => setor.id === updated.id ? updated : setor));
        setSuccess(`Setor ${updated.nome} atualizado.`);
      } else {
        const created = await api.post<Setor>("/api/master/setores", form);
        setSetores((current) => [...current, created].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setSuccess(`Setor ${created.nome} criado.`);
      }
      resetForm();
    } catch (e) {
      setError(extractMessage(e, "Erro ao salvar setor."));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(setor: Setor) {
    setEditingId(setor.id);
    setForm({ nome: setor.nome, descricao: setor.descricao || "", ativo: setor.ativo });
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditingId(null);
    setForm({ nome: "", descricao: "", ativo: true });
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Setores</h1>
        <div style={styles.metricsRow}>
          <MetricCard value={setores.length} label="Setores" />
          <MetricCard
            value={setores.reduce((sum, setor) => sum + setor.supervisoresCount, 0)}
            label="Supervisores"
          />
        </div>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}
      {success ? <div style={styles.successAlert}>{success}</div> : null}

      <section style={styles.grid}>
        <div style={styles.formCard}>
          <h2 style={styles.cardTitle}>{editingId ? "Editar setor" : "Novo setor"}</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <Field label="Nome">
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={styles.input} />
            </Field>

            <Field label="Descrição">
              <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} style={{ ...styles.input, minHeight: 100, resize: "vertical", paddingTop: 12 }} />
            </Field>

            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} style={styles.checkbox} />
              <span style={styles.checkboxLabel}>Ativo</span>
            </label>

            <div style={styles.formFooter}>
              {editingId ? <button type="button" onClick={resetForm} style={styles.secondaryButton}>Cancelar</button> : null}
              <button type="submit" disabled={submitting} style={styles.primaryButton}>
                {submitting ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </button>
            </div>
          </form>
        </div>

        <div style={styles.listCard}>
          <div style={styles.list}>
            {loading ? (
              <div style={styles.loadingCard}>Carregando setores...</div>
            ) : (
              setores.map((setor) => (
                <article key={setor.id} className="cf-card-list-item" style={styles.listItem}>
                  <div style={styles.listHead}>
                    <div>
                      <div style={styles.listTitle}>{setor.nome}</div>
                      <div style={styles.listMeta}>
                        {new Date(setor.criadoEm).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <span style={{ ...styles.statusBadge, ...(setor.ativo ? styles.statusActive : styles.statusInactive) }}>
                      {setor.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {setor.descricao ? <p style={styles.description}>{setor.descricao}</p> : null}
                  <div style={styles.itemFooter}>
                    <button type="button" onClick={() => startEdit(setor)} style={styles.linkButton}>Editar</button>
                  </div>
                </article>
              ))
            )}

            {!loading && setores.length === 0 ? <div style={styles.emptyState}>Nenhum setor</div> : null}
          </div>
        </div>
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
  grid: { display: "grid", gridTemplateColumns: "minmax(320px, 380px) minmax(0, 1fr)", gap: 16, alignItems: "start" },
  formCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 18 },
  listCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 18 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#1F2937" },
  form: { display: "grid", gap: 14, marginTop: 16 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  input: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  checkbox: { width: 18, height: 18, accentColor: "#0057B8" },
  checkboxLabel: { fontSize: 14, color: "#344054", fontWeight: 500 },
  formFooter: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },
  primaryButton: { background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  secondaryButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  loadingCard: { padding: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#475467" },
  list: { display: "grid", gap: 12 },
  listItem: { borderRadius: 18, border: "1px solid #E4E7EC", background: "linear-gradient(180deg, #FFFFFF 0%, #FBFCFE 100%)", padding: 16 },
  listHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  listTitle: { fontSize: 17, fontWeight: 700, color: "#1F2937" },
  listMeta: { marginTop: 4, fontSize: 12.5, color: "#667085" },
  description: { margin: "12px 0 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#475467" },
  itemFooter: { display: "flex", justifyContent: "flex-end", marginTop: 16 },
  linkButton: { border: "none", background: "transparent", color: "#0057B8", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 },
  statusBadge: { display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700 },
  statusActive: { background: "#EAF8EE", color: "#1E7E34", border: "1px solid #B7E1C0" },
  statusInactive: { background: "#FFF4F2", color: "#B42318", border: "1px solid #F3C9C5" },
  emptyState: { padding: 24, textAlign: "center", color: "#667085", fontSize: 14, border: "1px dashed #D0D5DD", borderRadius: 16 },
};
