import React, { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../api";
import { useAuth } from "../../auth";

type PainelItem = {
  checklistId: string;
  checklistItemId: string;
  dataRealizacao: string;
  setorOrigemId: string;
  setorOrigemNome: string;
  equipamentoCodigo: string;
  equipamentoDescricao: string;
  operadorNome: string;
  operadorMatricula: string;
  ordem: number;
  descricao: string;
  instrucao?: string | null;
  observacao?: string | null;
  workflowStatus: "pendente-aprovacao" | "em-andamento" | "concluida";
  responsavelSupervisorId?: string | null;
  responsavelNomeCompleto?: string | null;
  responsavelSetorId?: string | null;
  responsavelSetorNome?: string | null;
  observacaoAtribuicao?: string | null;
  aprovadoEm?: string | null;
  aprovadoPorNomeCompleto?: string | null;
  concluidoEm?: string | null;
  concluidoPorNomeCompleto?: string | null;
};

type PainelResponse = {
  pendentesAprovacao: PainelItem[];
  emAndamento: PainelItem[];
  concluidas: PainelItem[];
};

type ResponsavelOption = {
  id: string;
  nomeCompleto: string;
  login: string;
  setorId: string;
  setorNome: string;
};

const EMPTY_PANEL: PainelResponse = {
  pendentesAprovacao: [],
  emAndamento: [],
  concluidas: [],
};

export default function ItensNaoOkPage() {
  const { session } = useAuth();
  const currentSupervisorId = session?.supervisor.id ?? "";

  const [painel, setPainel] = useState<PainelResponse>(EMPTY_PANEL);
  const [responsaveis, setResponsaveis] = useState<ResponsavelOption[]>([]);
  const [selectedResponsaveis, setSelectedResponsaveis] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [operador, setOperador] = useState("");
  const [collapsedSections, setCollapsedSections] = useState({
    pendentes: true,
    andamento: true,
    concluidas: true,
  });

  const totalItens = useMemo(
    () => painel.pendentesAprovacao.length + painel.emAndamento.length + painel.concluidas.length,
    [painel],
  );

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!painel.pendentesAprovacao.length) return;

    setSelectedResponsaveis((current) => {
      const next = { ...current };

      for (const item of painel.pendentesAprovacao) {
        if (!next[item.checklistItemId]) {
          next[item.checklistItemId] = currentSupervisorId || responsaveis[0]?.id || "";
        }
      }

      return next;
    });
  }, [painel.pendentesAprovacao, responsaveis, currentSupervisorId]);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([loadResponsaveis(), loadPainel()]);
    } catch (e) {
      setError(extractMessage(e, "Erro ao carregar o painel de itens nao OK."));
    } finally {
      setLoading(false);
    }
  }

  async function loadResponsaveis() {
    const data = await api.get<ResponsavelOption[]>("/api/supervisor/itens-nao-ok/responsaveis");
    setResponsaveis(data);
  }

  async function loadPainel() {
    const params = new URLSearchParams();
    if (dataInicio) params.set("dataInicio", dataInicio);
    if (dataFim) params.set("dataFim", dataFim);
    if (equipamento) params.set("equipamento", equipamento);
    if (operador) params.set("operador", operador);

    const query = params.toString();
    const url = query ? `/api/supervisor/itens-nao-ok/painel?${query}` : "/api/supervisor/itens-nao-ok/painel";
    const data = await api.get<PainelResponse>(url);
    setPainel(data);
    setSelectedResponsaveis((current) => {
      const next = { ...current };

      for (const item of data.pendentesAprovacao) {
        if (!next[item.checklistItemId]) {
          next[item.checklistItemId] = currentSupervisorId || responsaveis[0]?.id || "";
        }
      }

      return next;
    });
  }

  async function handleBuscar() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await loadPainel();
    } catch (e) {
      setError(extractMessage(e, "Erro ao carregar itens nao OK."));
    } finally {
      setLoading(false);
    }
  }

  function resetFiltros() {
    setDataInicio("");
    setDataFim("");
    setEquipamento("");
    setOperador("");
    setError("");
    setSuccess("");
  }

  async function handleAtribuir(item: PainelItem) {
    const responsavelSupervisorId = selectedResponsaveis[item.checklistItemId];
    if (!responsavelSupervisorId) {
      setError("Selecione um responsavel antes de atribuir a tratativa.");
      return;
    }

    setActionLoadingKey(`assign-${item.checklistItemId}`);
    setError("");
    setSuccess("");

    try {
      await api.post<PainelItem>(`/api/supervisor/itens-nao-ok/${item.checklistItemId}/atribuir`, {
        responsavelSupervisorId,
        observacaoAtribuicao: null,
      });
      await loadPainel();
      const responsavel = responsaveis.find((entry) => entry.id === responsavelSupervisorId);
      setSuccess(`Tratativa atribuida para ${responsavel?.nomeCompleto || "o responsavel selecionado"}.`);
    } catch (e) {
      setError(extractMessage(e, "Erro ao atribuir a tratativa."));
    } finally {
      setActionLoadingKey("");
    }
  }

  async function handleConcluir(item: PainelItem) {
    setActionLoadingKey(`complete-${item.checklistItemId}`);
    setError("");
    setSuccess("");

    try {
      await api.post<PainelItem>(`/api/supervisor/itens-nao-ok/${item.checklistItemId}/concluir`, {});
      await loadPainel();
      setSuccess(`Tratativa do item ${item.ordem} marcada como concluida.`);
    } catch (e) {
      setError(extractMessage(e, "Erro ao concluir a tratativa."));
    } finally {
      setActionLoadingKey("");
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function responsavelLabel(id: string) {
    const responsavel = responsaveis.find((entry) => entry.id === id);
    return responsavel ? `${responsavel.nomeCompleto} • ${responsavel.setorNome}` : "Responsavel";
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Itens nao OK</h1>
        </div>

        <div style={styles.metricsRow}>
          <MetricCard value={painel.pendentesAprovacao.length} label="Pendentes" tone="warning" />
          <MetricCard value={painel.emAndamento.length} label="Em andamento" tone="primary" />
          <MetricCard value={painel.concluidas.length} label="Concluidas" tone="success" />
        </div>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}
      {success ? <div style={styles.successAlert}>{success}</div> : null}

      <div style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <div>
            <label style={styles.label}>Inicio</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Equipamento</label>
            <input value={equipamento} onChange={(e) => setEquipamento(e.target.value)} style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Operador</label>
            <input value={operador} onChange={(e) => setOperador(e.target.value)} style={styles.input} />
          </div>
        </div>

        <div style={styles.filterActions}>
          <button type="button" onClick={() => void handleBuscar()} style={styles.primaryButton}>Buscar</button>
          <button type="button" onClick={resetFiltros} style={styles.secondaryButton}>Limpar</button>
          <span style={styles.filterMeta}>{totalItens} registros no painel atual</span>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingCard}>Carregando painel de tratativas...</div>
      ) : (
        <div style={styles.sections}>
          <PainelSection
            collapsed={collapsedSections.pendentes}
            onToggle={() => setCollapsedSections((current) => ({ ...current, pendentes: !current.pendentes }))}
            title="Pendentes de aprovação"
            items={painel.pendentesAprovacao}
            emptyMessage="Nenhum item pendente de aprovacao."
            tone="warning"
            renderActions={(item) => (
              <div style={styles.actionColumn}>
                <select
                  value={selectedResponsaveis[item.checklistItemId] || ""}
                  onChange={(e) =>
                    setSelectedResponsaveis((current) => ({
                      ...current,
                      [item.checklistItemId]: e.target.value,
                    }))
                  }
                  style={styles.input}
                >
                  <option value="">Selecione um responsavel</option>
                  {responsaveis.map((responsavel) => (
                    <option key={responsavel.id} value={responsavel.id}>
                      {responsavel.nomeCompleto} - {responsavel.setorNome}
                    </option>
                  ))}
                </select>

                <div style={styles.inlineActions}>
                  <button
                    type="button"
                    style={styles.secondarySmallButton}
                    onClick={() =>
                      setSelectedResponsaveis((current) => ({
                        ...current,
                        [item.checklistItemId]: currentSupervisorId,
                      }))
                    }
                    disabled={!currentSupervisorId}
                  >
                    Atribuir para mim
                  </button>

                  <button
                    type="button"
                    style={styles.primarySmallButton}
                    onClick={() => void handleAtribuir(item)}
                    disabled={actionLoadingKey === `assign-${item.checklistItemId}`}
                  >
                    {actionLoadingKey === `assign-${item.checklistItemId}`
                      ? "Atribuindo..."
                      : selectedResponsaveis[item.checklistItemId]
                        ? `Aprovar e atribuir para ${responsavelLabel(selectedResponsaveis[item.checklistItemId])}`
                        : "Aprovar e atribuir"}
                  </button>

                  <button
                    type="button"
                    style={styles.successSmallButton}
                    onClick={() => void handleConcluir(item)}
                    disabled={actionLoadingKey === `complete-${item.checklistItemId}`}
                  >
                    {actionLoadingKey === `complete-${item.checklistItemId}` ? "Concluindo..." : "Concluir agora"}
                  </button>
                </div>
              </div>
            )}
          />

          <PainelSection
            collapsed={collapsedSections.andamento}
            onToggle={() => setCollapsedSections((current) => ({ ...current, andamento: !current.andamento }))}
            title="Ações em andamento"
            items={painel.emAndamento}
            emptyMessage="Nenhuma tratativa em andamento."
            tone="primary"
            renderActions={(item) => (
              <div style={styles.actionColumn}>
                <div style={styles.metaPanel}>
                  <MetaLine label="Responsavel" value={item.responsavelNomeCompleto || "-"} />
                  <MetaLine label="Setor responsavel" value={item.responsavelSetorNome || "-"} />
                  <MetaLine label="Aprovado por" value={item.aprovadoPorNomeCompleto || "-"} />
                  <MetaLine label="Aprovado em" value={formatarData(item.aprovadoEm)} />
                </div>

                <div style={styles.inlineActions}>
                  <button
                    type="button"
                    style={styles.successSmallButton}
                    onClick={() => void handleConcluir(item)}
                    disabled={actionLoadingKey === `complete-${item.checklistItemId}`}
                  >
                    {actionLoadingKey === `complete-${item.checklistItemId}` ? "Concluindo..." : "Marcar como concluida"}
                  </button>
                </div>
              </div>
            )}
          />

          <PainelSection
            collapsed={collapsedSections.concluidas}
            onToggle={() => setCollapsedSections((current) => ({ ...current, concluidas: !current.concluidas }))}
            title="Concluídas"
            items={painel.concluidas}
            emptyMessage="Nenhuma tratativa concluida."
            tone="success"
            renderActions={(item) => (
              <div style={styles.actionColumn}>
                <div style={styles.metaPanel}>
                  <MetaLine label="Responsavel" value={item.responsavelNomeCompleto || "-"} />
                  <MetaLine label="Setor responsavel" value={item.responsavelSetorNome || "-"} />
                  <MetaLine label="Concluido por" value={item.concluidoPorNomeCompleto || "-"} />
                  <MetaLine label="Concluido em" value={formatarData(item.concluidoEm)} />
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

function PainelSection({
  collapsed,
  onToggle,
  title,
  items,
  emptyMessage,
  tone,
  renderActions,
}: {
  collapsed: boolean;
  onToggle: () => void;
  title: string;
  items: PainelItem[];
  emptyMessage: string;
  tone: "warning" | "primary" | "success";
  renderActions: (item: PainelItem) => React.ReactNode;
}) {
  const toneContainerStyle =
    tone === "warning"
      ? styles.sectionCardWarning
      : tone === "success"
        ? styles.sectionCardSuccess
        : styles.sectionCardPrimary;

  const toneItemStyle =
    tone === "warning"
      ? styles.itemCardWarning
      : tone === "success"
        ? styles.itemCardSuccess
        : styles.itemCardPrimary;

  return (
    <section style={{ ...styles.sectionCard, ...toneContainerStyle }}>
      <button type="button" style={styles.sectionToggle} onClick={onToggle}>
        <div style={styles.sectionHeaderContent}>
          <span
            style={{
              ...styles.chevron,
              transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
            }}
          >
            <ChevronIcon />
          </span>
          <div>
            <h2 style={styles.sectionTitle}>{title}</h2>
          </div>
        </div>
        <span
          style={{
            ...styles.countBadge,
            ...(tone === "warning"
              ? styles.countBadgeWarning
              : tone === "success"
                ? styles.countBadgeSuccess
                : styles.countBadgePrimary),
          }}
        >
          {items.length}
        </span>
      </button>

      {!collapsed ? (items.length === 0 ? (
        <div style={styles.emptyState}>{emptyMessage}</div>
      ) : (
        <div style={styles.cardGrid}>
          {items.map((item) => (
            <article key={item.checklistItemId} style={{ ...styles.itemCard, ...toneItemStyle }}>
              <div style={styles.itemHeader}>
                <div>
                  <div style={styles.codeBadge}>{item.equipamentoCodigo}</div>
                  <div style={styles.itemTitle}>Item {item.ordem} • {item.descricao}</div>
                  <div style={styles.itemSubTitle}>{item.equipamentoDescricao}</div>
                </div>
                <a href={`/supervisor/checklist/${item.checklistId}`} style={styles.viewButton}>Ver checklist</a>
              </div>

              <div style={styles.infoGrid}>
                <InfoBlock label="Setor de origem" value={item.setorOrigemNome} />
                <InfoBlock label="Operador" value={`${item.operadorNome} • ${item.operadorMatricula}`} />
                <InfoBlock label="Data do checklist" value={new Date(item.dataRealizacao).toLocaleString("pt-BR")} />
              </div>

              {item.instrucao ? (
                <div style={styles.copyBlock}>
                  <div style={styles.copyLabel}>Instrucao</div>
                  <div style={styles.copyText}>{item.instrucao}</div>
                </div>
              ) : null}

              <div style={styles.copyBlock}>
                <div style={styles.copyLabel}>Observacao do operador</div>
                <div style={styles.copyText}>{item.observacao || "-"}</div>
              </div>

              {item.observacaoAtribuicao ? (
                <div style={styles.copyBlock}>
                  <div style={styles.copyLabel}>Observacao da atribuicao</div>
                  <div style={styles.copyText}>{item.observacaoAtribuicao}</div>
                </div>
              ) : null}

              <div style={styles.cardFooter}>
                {renderActions(item)}
              </div>
            </article>
          ))}
        </div>
      )) : null}
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoBlock}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metaLine}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}

function MetricCard({ value, label, tone }: { value: number; label: string; tone: "warning" | "primary" | "success" }) {
  const toneStyle =
    tone === "warning"
      ? styles.metricWarning
      : tone === "success"
        ? styles.metricSuccess
        : styles.metricPrimary;

  return (
    <div style={{ ...styles.metricCard, ...toneStyle }}>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.body) as { message?: string };
      return parsed.message || error.body || error.message;
    } catch {
      return error.body || error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 16 },
  header: { display: "grid", gap: 14 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "#1F2937" },
  metricsRow: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 180px))", gap: 10 },
  metricCard: { borderRadius: 18, border: "1px solid #DDE6F0", background: "rgba(255,255,255,0.88)", padding: 14 },
  metricPrimary: { borderColor: "#C9DDFC", background: "#EEF5FF" },
  metricWarning: { borderColor: "#F8D1AA", background: "#FFF5E8" },
  metricSuccess: { borderColor: "#CDE8D6", background: "#EEF8F2" },
  metricValue: { fontSize: 24, fontWeight: 700, color: "#1F2937" },
  metricLabel: { marginTop: 4, fontSize: 12.5, color: "#667085" },
  errorAlert: { background: "#FFF4F2", border: "1px solid #F3C9C5", color: "#912018", borderRadius: 14, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  successAlert: { background: "#EEF8F2", border: "1px solid #CDE8D6", color: "#116032", borderRadius: 14, padding: "12px 14px", fontSize: 13.5, fontWeight: 600 },
  filterCard: { background: "rgba(255,255,255,0.94)", border: "1px solid rgba(217,217,217,0.96)", borderRadius: 20, padding: 18, display: "grid", gap: 14 },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 },
  label: { display: "block", marginBottom: 6, fontSize: 13.5, fontWeight: 600, color: "#344054" },
  input: { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid #C9D2DC", background: "#FFFFFF", color: "#1F2937", fontSize: 14.5, outline: "none", boxSizing: "border-box" },
  filterActions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  filterMeta: { marginLeft: "auto", fontSize: 13, color: "#667085", fontWeight: 600 },
  primaryButton: { background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" },
  secondaryButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 12, padding: "11px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
  loadingCard: { background: "#FFFFFF", border: "1px solid #D9D9D9", borderRadius: 18, padding: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#475467" },
  sections: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, alignItems: "start" },
  sectionCard: { borderRadius: 24, padding: 18, display: "grid", gap: 16, border: "1px solid rgba(217,217,217,0.96)" },
  sectionCardPrimary: { background: "#0A6AD7", borderColor: "#0A6AD7" },
  sectionCardWarning: { background: "#D92D20", borderColor: "#D92D20" },
  sectionCardSuccess: { background: "#169C4B", borderColor: "#169C4B" },
  sectionToggle: { background: "transparent", border: "none", padding: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, width: "100%", cursor: "pointer", textAlign: "left" },
  sectionHeaderContent: { display: "flex", alignItems: "flex-start", gap: 12 },
  chevron: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.16)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.28)", transition: "transform 180ms ease" },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#FFFFFF" },
  countBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, height: 30, borderRadius: 999, fontSize: 13, fontWeight: 800, padding: "0 10px", border: "1px solid rgba(255,255,255,0.24)" },
  countBadgePrimary: { background: "rgba(255,255,255,0.18)", color: "#FFFFFF" },
  countBadgeWarning: { background: "rgba(255,255,255,0.18)", color: "#FFFFFF" },
  countBadgeSuccess: { background: "rgba(255,255,255,0.18)", color: "#FFFFFF" },
  emptyState: { borderRadius: 16, border: "1px dashed rgba(255,255,255,0.32)", padding: 28, textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.86)", background: "rgba(255,255,255,0.08)" },
  cardGrid: { display: "grid", gap: 16 },
  itemCard: { border: "1px solid rgba(255,255,255,0.75)", borderRadius: 22, padding: 18, display: "grid", gap: 14, background: "#FFFFFF" },
  itemCardPrimary: { borderColor: "#7CB3F4" },
  itemCardWarning: { borderColor: "#F3A6A0" },
  itemCardSuccess: { borderColor: "#8BDBAE" },
  itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  codeBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "6px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, background: "#EAF2FF", color: "#0057B8", border: "1px solid #C9DDFC", marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: 700, color: "#1F2937" },
  itemSubTitle: { marginTop: 4, fontSize: 13.5, color: "#667085" },
  viewButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 600, textDecoration: "none", flexShrink: 0 },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 },
  infoBlock: { background: "#F9FAFB", border: "1px solid #EAECF0", borderRadius: 14, padding: 12 },
  infoLabel: { fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.32, color: "#667085", fontWeight: 700 },
  infoValue: { marginTop: 6, fontSize: 14, color: "#1F2937", fontWeight: 600, lineHeight: 1.45 },
  copyBlock: { borderTop: "1px solid #F2F4F7", paddingTop: 12 },
  copyLabel: { fontSize: 12, color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.28, marginBottom: 6 },
  copyText: { fontSize: 14, color: "#344054", lineHeight: 1.6, whiteSpace: "pre-wrap" },
  cardFooter: { borderTop: "1px solid #F2F4F7", paddingTop: 14 },
  actionColumn: { display: "grid", gap: 12 },
  inlineActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  primarySmallButton: { background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)", color: "#FFFFFF", border: "none", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  secondarySmallButton: { background: "#FFFFFF", color: "#344054", border: "1px solid #D0D5DD", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  successSmallButton: { background: "#EEF8F2", color: "#116032", border: "1px solid #CDE8D6", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" },
  metaPanel: { display: "grid", gap: 8, background: "linear-gradient(180deg, #FFF4BF 0%, #FFE073 100%)", border: "1px solid #EAB308", borderRadius: 16, padding: 14, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)" },
  metaLine: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  metaLabel: { fontSize: 12.5, color: "#7A4A00", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.28 },
  metaValue: { fontSize: 13, color: "#1F2937", fontWeight: 700, textAlign: "right" },
};
