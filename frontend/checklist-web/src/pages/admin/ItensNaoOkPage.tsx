import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../api";

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
  imagemNokBase64?: string | null;
  imagemNokNomeArquivo?: string | null;
  imagemNokMimeType?: string | null;
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

type ActiveStatus = "pendentes" | "andamento" | "concluidas";

const EMPTY_PANEL: PainelResponse = {
  pendentesAprovacao: [],
  emAndamento: [],
  concluidas: [],
};

export default function ItensNaoOkPage() {
  const [searchParams] = useSearchParams();

  const rawStatus = searchParams.get("status");
  const activeStatus: ActiveStatus =
    rawStatus === "pendentes" || rawStatus === "andamento" || rawStatus === "concluidas"
      ? rawStatus
      : "pendentes";

  const [painel, setPainel] = useState<PainelResponse>(EMPTY_PANEL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [equipamento, setEquipamento] = useState("");
  const [operador, setOperador] = useState("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  const pageMeta = useMemo(() => {
    if (activeStatus === "pendentes") {
      return {
        title: "Pendentes",
        description: "Itens aguardando aprovacao e atribuicao.",
        cardAccent: styles.listHeaderDanger,
        countBadge: styles.countBadgeDanger,
      };
    }

    if (activeStatus === "andamento") {
      return {
        title: "Em andamento",
        description: "Tratativas aprovadas que ainda exigem acao.",
        cardAccent: styles.listHeaderPrimary,
        countBadge: styles.countBadgePrimary,
      };
    }

    return {
      title: "Concluidas",
      description: "Itens encerrados para consulta e historico.",
      cardAccent: styles.listHeaderSuccess,
      countBadge: styles.countBadgeSuccess,
    };
  }, [activeStatus]);

  const totalItens = useMemo(
    () => painel.pendentesAprovacao.length + painel.emAndamento.length + painel.concluidas.length,
    [painel],
  );

  const activeItems = useMemo(() => {
    if (activeStatus === "pendentes") return painel.pendentesAprovacao;
    if (activeStatus === "andamento") return painel.emAndamento;
    return painel.concluidas;
  }, [activeStatus, painel]);

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      await loadPainel();
    } catch (err) {
      setError(extractMessage(err, "Erro ao carregar a lista de itens nao OK."));
    } finally {
      setLoading(false);
    }
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
  }

  async function handleBuscar() {
    setLoading(true);
    setError("");

    try {
      await loadPainel();
    } catch (err) {
      setError(extractMessage(err, "Erro ao carregar os itens nao OK."));
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

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.titleBlock}>
          <div>
            <h1 style={styles.title}>{pageMeta.title}</h1>
            <p style={styles.description}>{pageMeta.description}</p>
          </div>

          <Link to="/admin/itens-nao-ok" style={styles.backButton}>
            Voltar
          </Link>
        </div>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}

      <div style={styles.filterCard}>
        <button type="button" style={styles.filterToggle} onClick={() => setFiltersCollapsed((current) => !current)}>
          <div style={styles.filterToggleCopy}>
            <span style={styles.filterToggleTitle}>Filtros</span>
            <span style={styles.filterToggleMeta}>
              {filtersCollapsed ? "Expandir filtros" : "Ocultar filtros"}
            </span>
          </div>
          <span
            style={{
              ...styles.filterChevron,
              transform: filtersCollapsed ? "rotate(0deg)" : "rotate(90deg)",
            }}
          >
            <ChevronIcon />
          </span>
        </button>

        {!filtersCollapsed ? (
          <>
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
          </>
        ) : (
          <div style={styles.filterCollapsedSummary}>{totalItens} registros no painel atual</div>
        )}
      </div>

      {loading ? (
        <div style={styles.loadingCard}>Carregando lista...</div>
      ) : (
        <section style={styles.listSection}>
          <header style={{ ...styles.listHeader, ...pageMeta.cardAccent }}>
            <div style={styles.listHeaderText}>
              <h2 style={styles.listTitle}>{pageMeta.title}</h2>
              <p style={styles.listSubtitle}>{activeItems.length} itens na fila atual</p>
            </div>

            <span style={{ ...styles.countBadge, ...pageMeta.countBadge }}>{activeItems.length}</span>
          </header>

          {activeItems.length === 0 ? (
            <div style={styles.emptyState}>Nenhum item encontrado para este status.</div>
          ) : (
            <div style={styles.itemsList}>
              {activeItems.map((item) => (
                <Link
                  key={item.checklistItemId}
                  to={`/admin/itens-nao-ok/item/${item.checklistItemId}?status=${encodeURIComponent(activeStatus)}`}
                  state={{ item }}
                  style={styles.itemCardLink}
                >
                  <article style={styles.itemCard}>
                    <div style={styles.itemHeader}>
                      <div style={styles.itemHeaderCopy}>
                        <div style={styles.codeBadge}>{item.equipamentoCodigo}</div>
                        <h3 style={styles.itemTitle}>Item {item.ordem} - {item.descricao}</h3>
                        <div style={styles.itemSubtitle}>{item.equipamentoDescricao}</div>
                      </div>
                    </div>

                    <div style={styles.infoGrid}>
                      <InfoBlock label="Setor de origem" value={item.setorOrigemNome} />
                      <InfoBlock label="Operador" value={`${item.operadorNome} - ${item.operadorMatricula}`} />
                      <InfoBlock label="Data do checklist" value={formatarData(item.dataRealizacao)} />
                    </div>

                    {item.instrucao ? (
                      <div style={styles.copyBlock}>
                        <div style={styles.copyLabel}>Instrucao</div>
                        <div style={styles.copyText}>{item.instrucao}</div>
                      </div>
                    ) : null}

                    <div style={styles.copyBlock}>
                      <div style={styles.copyLabel}>Observação do operador</div>
                      <div style={styles.copyText}>{item.observacao || "-"}</div>
                    </div>

                    {item.observacaoAtribuicao ? (
                      <div style={styles.copyBlock}>
                        <div style={styles.copyLabel}>Observacao da atribuicao</div>
                        <div style={styles.copyText}>{item.observacaoAtribuicao}</div>
                      </div>
                    ) : null}

                    <div style={styles.metaPanel}>
                      <MetaLine label="Status" value={activeStatus === "pendentes" ? "Pendente" : activeStatus === "andamento" ? "Em andamento" : "Concluida"} />
                      <MetaLine label="Responsavel" value={item.responsavelNomeCompleto || "-"} />
                      <MetaLine label="Setor responsavel" value={item.responsavelSetorNome || "-"} />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
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

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "grid",
    gap: 24,
  },
  header: {
    display: "grid",
    gap: 18,
  },
  titleBlock: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.1,
    color: "#101828",
  },
  description: {
    margin: "6px 0 0",
    color: "#475467",
    fontSize: 14,
  },
  backLink: {
    textDecoration: "none",
    color: "#0A6AD7",
    fontWeight: 700,
    fontSize: 14,
  },
  errorAlert: {
    border: "1px solid #F04438",
    background: "#FEF3F2",
    color: "#B42318",
    borderRadius: 16,
    padding: "14px 16px",
    fontSize: 14,
  },
  successAlert: {
    border: "1px solid #12B76A",
    background: "#ECFDF3",
    color: "#027A48",
    borderRadius: 16,
    padding: "14px 16px",
    fontSize: 14,
  },
  filterCard: {
    border: "1px solid #D0D5DD",
    borderRadius: 20,
    background: "#FFFFFF",
    padding: 20,
    display: "grid",
    gap: 18,
  },
  filterToggle: {
    border: "none",
    background: "transparent",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    cursor: "pointer",
    color: "#101828",
  },
  filterToggleCopy: {
    display: "grid",
    gap: 4,
    textAlign: "left",
  },
  filterToggleTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#101828",
  },
  filterToggleMeta: {
    fontSize: 13,
    color: "#667085",
  },
  filterChevron: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid #D0D5DD",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#344054",
    transition: "transform 160ms ease",
    flexShrink: 0,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 700,
    color: "#344054",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    width: "100%",
    border: "1px solid #D0D5DD",
    borderRadius: 12,
    padding: "11px 13px",
    fontSize: 14,
    color: "#101828",
    background: "#FFFFFF",
    boxSizing: "border-box",
  },
  filterActions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: 12,
    padding: "11px 16px",
    background: "#0A6AD7",
    color: "#FFFFFF",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #D0D5DD",
    borderRadius: 12,
    padding: "11px 16px",
    background: "#FFFFFF",
    color: "#344054",
    fontWeight: 700,
    cursor: "pointer",
  },
  filterMeta: {
    color: "#667085",
    fontSize: 13,
    marginLeft: "auto",
  },
  filterCollapsedSummary: {
    color: "#667085",
    fontSize: 13,
  },
  loadingCard: {
    border: "1px solid #D0D5DD",
    borderRadius: 18,
    background: "#FFFFFF",
    padding: 22,
    color: "#475467",
    fontSize: 14,
  },
  listSection: {
    border: "1px solid #D0D5DD",
    borderRadius: 24,
    overflow: "hidden",
    background: "#FFFFFF",
  },
  listHeader: {
    padding: "20px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  listHeaderDanger: {
    background: "#FEE4E2",
  },
  listHeaderPrimary: {
    background: "#DCEEFF",
  },
  listHeaderSuccess: {
    background: "#DFF7E7",
  },
  listHeaderText: {
    display: "grid",
    gap: 4,
  },
  listTitle: {
    margin: 0,
    fontSize: 22,
    color: "#101828",
  },
  listSubtitle: {
    margin: 0,
    color: "#475467",
    fontSize: 14,
  },
  countBadge: {
    minWidth: 48,
    height: 48,
    borderRadius: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 800,
  },
  countBadgeDanger: {
    background: "#D92D20",
    color: "#FFFFFF",
  },
  countBadgePrimary: {
    background: "#0A6AD7",
    color: "#FFFFFF",
  },
  countBadgeSuccess: {
    background: "#169C4B",
    color: "#FFFFFF",
  },
  emptyState: {
    padding: 24,
    color: "#475467",
    fontSize: 14,
  },
  itemsList: {
    display: "grid",
    gap: 16,
    padding: 18,
  },
  itemCard: {
    border: "1px solid #085BB9",
    borderRadius: 20,
    padding: 18,
    display: "grid",
    gap: 16,
    background: "#0A6AD7",
  },
  itemCardLink: {
    textDecoration: "none",
    display: "block",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  itemHeaderCopy: {
    display: "grid",
    gap: 8,
  },
  codeBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    color: "#FFFFFF",
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 800,
    width: "fit-content",
  },
  itemTitle: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.25,
    fontWeight: 800,
    color: "#ffffff",
  },
  itemSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  infoBlock: {
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 6,
    background: "rgba(255,255,255,0.08)",
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: 700,
  },
  copyBlock: {
    display: "grid",
    gap: 6,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  copyText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 1.5,
  },
  metaPanel: {
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.08)",
    padding: 14,
    display: "grid",
    gap: 8,
  },
  metaLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    fontSize: 13,
  },
  metaLabel: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: 700,
  },
  metaValue: {
    color: "#FFFFFF",
    fontWeight: 600,
    textAlign: "right",
  },
  backButton: {
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #D0D5DD",
  borderRadius: 12,
  padding: "10px 14px",
  background: "#0A6AD7",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 14,
},

};
