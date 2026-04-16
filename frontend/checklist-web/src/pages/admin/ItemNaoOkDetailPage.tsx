import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../../api";
import { useAuth } from "../../auth";

type HistoricoEntry = {
  id: string;
  titulo: string;
  descricao: string;
  criadoEm: string;
  criadoPorNomeCompleto: string;
};

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
  observacaoResponsavel?: string | null;
  dataPrevistaConclusao?: string | null;
  percentualConclusao: number;
  aprovadoEm?: string | null;
  aprovadoPorNomeCompleto?: string | null;
  concluidoEm?: string | null;
  concluidoPorNomeCompleto?: string | null;
  historico?: HistoricoEntry[] | null;
};

type ResponsavelOption = {
  id: string;
  nomeCompleto: string;
  login: string;
  setorId: string;
  setorNome: string;
};

type TimelineEntry = {
  id: string;
  title: string;
  date: string;
  description: string;
  author: string;
};

type HistoryFallbackEntry = {
  titulo: string;
  descricao: string;
};

export default function ItemNaoOkDetailPage() {
  const { session } = useAuth();
  const currentSupervisorId = session?.supervisor.id ?? "";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeState = location.state as { item?: PainelItem } | null;

  const [item, setItem] = useState<PainelItem | null>(routeState?.item ?? null);
  const [responsaveis, setResponsaveis] = useState<ResponsavelOption[]>([]);
  const [selectedResponsavelId, setSelectedResponsavelId] = useState(routeState?.item?.responsavelSupervisorId ?? "");
  const [observacaoResponsavel, setObservacaoResponsavel] = useState(routeState?.item?.observacaoResponsavel ?? "");
  const [dataPrevistaConclusao, setDataPrevistaConclusao] = useState(
    routeState?.item?.dataPrevistaConclusao ? toDateInputValue(routeState.item.dataPrevistaConclusao) : "",
  );
  const [percentualConclusao, setPercentualConclusao] = useState(routeState?.item?.percentualConclusao ?? 0);
  const [loading, setLoading] = useState(!routeState?.item);
  const [syncingItem, setSyncingItem] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const returnStatus = searchParams.get("status") || "pendentes";
  const backHref = `/admin/itens-nao-ok/lista?status=${encodeURIComponent(returnStatus)}`;

  useEffect(() => {
    if (!id) return;

    void loadInitialData(id);
  }, [id]);

  useEffect(() => {
    if (!item) return;

    setSelectedResponsavelId((current) => current || item.responsavelSupervisorId || currentSupervisorId || responsaveis[0]?.id || "");
    setObservacaoResponsavel(item.observacaoResponsavel || "");
    setDataPrevistaConclusao(item.dataPrevistaConclusao ? toDateInputValue(item.dataPrevistaConclusao) : "");
    setPercentualConclusao(item.percentualConclusao ?? 0);
  }, [item, responsaveis, currentSupervisorId]);

  const workflowLabel = useMemo(() => {
    if (!item) return "-";
    if (item.workflowStatus === "pendente-aprovacao") return "Pendente";
    if (item.workflowStatus === "em-andamento") return "Em andamento";
    return "Concluida";
  }, [item]);

  const historyEntries = useMemo(() => {
    if (!item) return [];

    const fallbackEntries: TimelineEntry[] = [
      {
        id: "registro",
        title: "Ocorrencia registrada",
        date: item.dataRealizacao,
        description: `${item.operadorNome} registrou o item ${item.ordem} como nao OK no checklist.`,
        author: item.operadorNome,
      },
    ];

    if (item.historico?.length) {
      return item.historico.map((entry) => ({
        id: entry.id,
        title: entry.titulo,
        date: entry.criadoEm,
        description: entry.descricao,
        author: entry.criadoPorNomeCompleto,
      }));
    }

    if (item.aprovadoEm) {
      fallbackEntries.push({
        id: "aprovacao",
        title: "Tratativa atribuida",
        date: item.aprovadoEm,
        description: buildFallbackAtribuicaoDescription(item, {
          responsavelNomeCompleto: item.responsavelNomeCompleto || "Responsavel nao informado",
          percentualConclusao: item.percentualConclusao ?? 0,
          dataPrevistaConclusao: item.dataPrevistaConclusao ?? null,
          observacaoResponsavel: item.observacaoResponsavel ?? null,
        }),
        author: item.aprovadoPorNomeCompleto || "Supervisor",
      });
    }

    if (item.concluidoEm) {
      fallbackEntries.push({
        id: "conclusao",
        title: "Tratativa concluida",
        date: item.concluidoEm,
        description: `Tratativa marcada como concluida com percentual final de ${item.percentualConclusao ?? 100}%.`,
        author: item.concluidoPorNomeCompleto || "Supervisor",
      });
    }

    return fallbackEntries;
  }, [item]);

  async function loadInitialData(itemId: string) {
    setSyncingItem(true);
    if (!routeState?.item) {
      setLoading(true);
    }
    setError("");

    try {
      const responsaveisPromise = api.get<ResponsavelOption[]>("/api/supervisor/itens-nao-ok/responsaveis");
      const itemPromise = loadItemWithFallback(itemId);
      const [itemData, responsaveisData] = await Promise.all([itemPromise, responsaveisPromise]);

      setItem(itemData);
      setResponsaveis(responsaveisData);
    } catch (err) {
      setError(extractMessage(err, "Erro ao carregar o item nao OK."));
    } finally {
      setSyncingItem(false);
      setLoading(false);
    }
  }

  async function loadItemWithFallback(itemId: string) {
    try {
      return await api.get<PainelItem>(`/api/supervisor/itens-nao-ok/${itemId}`);
    } catch (err) {
      const apiError = err as ApiError;

      if (apiError.status && apiError.status !== 404) {
        throw err;
      }

      const painel = await api.get<{
        pendentesAprovacao: PainelItem[];
        emAndamento: PainelItem[];
        concluidas: PainelItem[];
      }>("/api/supervisor/itens-nao-ok/painel");

      const fallbackItem =
        painel.pendentesAprovacao.find((entry) => entry.checklistItemId === itemId) ||
        painel.emAndamento.find((entry) => entry.checklistItemId === itemId) ||
        painel.concluidas.find((entry) => entry.checklistItemId === itemId) ||
        null;

      if (!fallbackItem) {
        throw err;
      }

      return fallbackItem;
    }
  }

  async function refreshItem() {
    if (!id) return;
    setSyncingItem(true);
    try {
      const data = await loadItemWithFallback(id);
      setItem(data);
      return data;
    } finally {
      setSyncingItem(false);
    }
  }

  async function loadCurrentItem() {
    if (!id) return null;
    return await loadItemWithFallback(id);
  }

  async function syncAfterAction(err: unknown, {
    on404,
    on409,
    fallback,
  }: {
    on404: string;
    on409: string;
    fallback: string;
  }) {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        try {
          await refreshItem();
        } catch {
          // Mantem a mensagem original se nem o fallback conseguir sincronizar.
        }
        setError(on404);
        return;
      }

      if (err.status === 409) {
        try {
          await refreshItem();
        } catch {
          // Mantem a mensagem original se nem o fallback conseguir sincronizar.
        }
        setError(on409);
        return;
      }
    }

    setError(extractMessage(err, fallback));
  }

  async function handleAtribuir() {
    if (!item) return;
    if (!selectedResponsavelId) {
      setError("Selecione um responsavel antes de atribuir a tratativa.");
      return;
    }

    setActionLoadingKey("assign");
    setError("");
    setSuccess("");

    try {
      const updatedItem = await api.post<PainelItem>(`/api/supervisor/itens-nao-ok/${item.checklistItemId}/atribuir`, {
        responsavelSupervisorId: selectedResponsavelId,
        observacaoAtribuicao: null,
        observacaoResponsavel: observacaoResponsavel || null,
        dataPrevistaConclusao: dataPrevistaConclusao ? new Date(`${dataPrevistaConclusao}T00:00:00`).toISOString() : null,
        percentualConclusao,
      });

      const responsavel = responsaveis.find((entry) => entry.id === selectedResponsavelId);
      const immediateItem = ensureHistoryEntry(updatedItem, {
        titulo: "Tratativa atribuida",
        descricao: buildAssignedHistoryDescription({
          responsavelNomeCompleto: responsavel?.nomeCompleto || "Responsavel nao informado",
          percentualConclusao,
          dataPrevistaConclusao,
          observacaoResponsavel,
        }),
      });
      setItem(immediateItem);
      try {
        const reloadedItem = await loadCurrentItem();
        setItem(selectMostCompleteItem(immediateItem, reloadedItem));
      } catch {
        // Mantem o retorno imediato da acao quando o reload secundario falha.
      }
      setSuccess(`Tratativa atribuida para ${responsavel?.nomeCompleto || "o responsavel selecionado"}.`);
    } catch (err) {
      await syncAfterAction(err, {
        on404: "",
        on409: "Este item ja possui uma tratativa registrada. A tela foi sincronizada com o estado atual para evitar aprovacao duplicada.",
        fallback: "Erro ao atribuir a tratativa.",
      });
    } finally {
      setActionLoadingKey("");
    }
  }

  async function handleSalvarTratativa() {
    if (!item) return;
    if (!selectedResponsavelId) {
      setError("Selecione um responsavel antes de salvar a tratativa.");
      return;
    }

    setActionLoadingKey("save");
    setError("");
    setSuccess("");

    try {
      const previousItem = item;
      const updatedItem = await api.put<PainelItem>(`/api/supervisor/itens-nao-ok/${item.checklistItemId}/tratativa`, {
        responsavelSupervisorId: selectedResponsavelId,
        observacaoResponsavel: observacaoResponsavel || null,
        dataPrevistaConclusao: dataPrevistaConclusao ? new Date(`${dataPrevistaConclusao}T00:00:00`).toISOString() : null,
        percentualConclusao,
      });

      const immediateItem = ensureHistoryEntry(updatedItem, buildUpdateHistoryEntry(previousItem, {
        selectedResponsavelId,
        responsaveis,
        observacaoResponsavel,
        dataPrevistaConclusao,
        percentualConclusao,
      }));
      setItem(immediateItem);
      try {
        const reloadedItem = await loadCurrentItem();
        setItem(selectMostCompleteItem(immediateItem, reloadedItem));
      } catch {
        // Mantem o retorno imediato da acao quando o reload secundario falha.
      }
      setSuccess("Tratativa atualizada com sucesso.");
    } catch (err) {
      await syncAfterAction(err, {
        on404: "A API em execucao nao encontrou a tratativa para atualizacao. A tela foi sincronizada com o estado mais recente disponivel.",
        on409: "A tratativa ja foi concluida ou alterada por outro supervisor. A tela foi sincronizada com o estado atual.",
        fallback: "Erro ao atualizar a tratativa.",
      });
    } finally {
      setActionLoadingKey("");
    }
  }

  async function handleConcluir() {
    if (!item) return;

    setActionLoadingKey("complete");
    setError("");
    setSuccess("");

    try {
      const updatedItem = await api.post<PainelItem>(`/api/supervisor/itens-nao-ok/${item.checklistItemId}/concluir`, {});
      const immediateItem = ensureHistoryEntry(updatedItem, {
        titulo: "Tratativa concluida",
        descricao: `Tratativa marcada como concluida com percentual final de ${updatedItem.percentualConclusao ?? 100}%.`,
      });
      setItem(immediateItem);
      try {
        const reloadedItem = await loadCurrentItem();
        setItem(selectMostCompleteItem(immediateItem, reloadedItem));
      } catch {
        // Mantem o retorno imediato da acao quando o reload secundario falha.
      }
      setSuccess(`Tratativa do item ${item.ordem} marcada como concluida.`);
    } catch (err) {
      await syncAfterAction(err, {
        on404: "A API nao localizou a versao atual do item ao concluir. A tela foi sincronizada com o estado mais recente disponivel.",
        on409: "Esta tratativa ja foi concluida. A tela foi sincronizada com o estado atual.",
        fallback: "Erro ao concluir a tratativa.",
      });
    } finally {
      setActionLoadingKey("");
    }
  }

  function handleAssignToMe() {
    setSelectedResponsavelId(currentSupervisorId);
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.feedbackCard}>Carregando item nao OK...</div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.feedbackCard, ...styles.errorCard }}>{error}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.feedbackCard, ...styles.errorCard }}>Item nao OK nao encontrado.</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.commandBar}>
        <div style={styles.commandBarCopy}>
          <div style={styles.commandBarKicker}>Itens nao OK</div>
          <h1 style={styles.commandBarTitle}>Detalhe do item</h1>
        </div>

        <div style={styles.commandBarActions}>
          <Link to={backHref} style={styles.secondaryButton}>
            Voltar para lista
          </Link>
          <button type="button" style={styles.primaryButton} onClick={() => navigate(`/supervisor/checklist/${item.checklistId}`)}>
            Abrir checklist
          </button>
        </div>
      </div>

      {error ? <div style={styles.errorAlert}>{error}</div> : null}
      {success ? <div style={styles.successAlert}>{success}</div> : null}

      <section style={styles.sheet}>
        <div style={styles.headerGrid}>
          <HeaderField label="Item" value={`Item ${item.ordem}`} />
          <HeaderField label="Status" value={workflowLabel} highlight />
          <HeaderField label="Data da ocorrencia" value={formatDateTime(item.dataRealizacao)} />
          <HeaderField label="Equipamento" value={item.equipamentoCodigo} />
          <HeaderField label="Descricao do equipamento" value={item.equipamentoDescricao} span={2} />
          <HeaderField label="Operador" value={`${item.operadorNome} - ${item.operadorMatricula}`} />
          <HeaderField label="Setor origem" value={item.setorOrigemNome} />
          <HeaderField label="Responsavel atual" value={item.responsavelNomeCompleto || "-"} />
          <HeaderField label="Setor destino" value={item.responsavelSetorNome || "-"} />
          <HeaderField label="Checklist" value={item.checklistId} mono span={2} />
        </div>

        <div style={styles.headerNarrativeGrid}>
          <div style={{ ...styles.headerNarrativeBlock, ...styles.headerNarrativeWide }}>
            <div style={styles.sectionLabel}>Descricao do problema</div>
            <div style={styles.problemCompactText}>{item.descricao}</div>
          </div>
          <div style={styles.headerNarrativeBlock}>
            <div style={styles.sectionLabel}>Observacao do operador</div>
            <div style={styles.problemCompactText}>{item.observacao || "-"}</div>
          </div>
          {item.instrucao ? (
            <div style={styles.headerNarrativeBlock}>
              <div style={styles.sectionLabel}>Instrucao original</div>
              <div style={styles.problemCompactText}>{item.instrucao}</div>
            </div>
          ) : null}
          {item.imagemNokBase64 ? (
            <div style={styles.headerNarrativeBlock}>
              <div style={styles.sectionLabel}>Imagem anexada</div>
              <div style={styles.problemImageShell}>
                <img
                  src={item.imagemNokBase64}
                  alt={item.imagemNokNomeArquivo || `Imagem do item ${item.ordem}`}
                  style={styles.problemImage}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div style={styles.singlePanel}>
          <div style={styles.descriptionLayout}>
            <div style={styles.actionPanel}>
              <div style={styles.actionPanelHeader}>
                <div style={styles.sectionLabel}>Tratativa</div>
                <div style={styles.analysisState}>{workflowLabel}</div>
              </div>

              <div style={styles.actionFormGrid}>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>Atribuicao</label>
                  <select
                    value={selectedResponsavelId}
                    onChange={(e) => setSelectedResponsavelId(e.target.value)}
                    style={styles.input}
                    disabled={item.workflowStatus === "concluida" || syncingItem}
                  >
                    <option value="">Selecione um responsavel</option>
                    {responsaveis.map((responsavel) => (
                      <option key={responsavel.id} value={responsavel.id}>
                        {responsavel.nomeCompleto} - {responsavel.setorNome}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formRow}>
                  <label style={styles.formLabel}>Data prevista de conclusao</label>
                  <input
                    type="date"
                    value={dataPrevistaConclusao}
                    onChange={(e) => setDataPrevistaConclusao(e.target.value)}
                    style={styles.input}
                    disabled={item.workflowStatus === "concluida" || syncingItem}
                  />
                </div>

                <div style={styles.formRow}>
                  <label style={styles.formLabel}>Percentual de conclusao</label>
                  <select
                    value={percentualConclusao}
                    onChange={(e) => setPercentualConclusao(Number(e.target.value))}
                    style={styles.input}
                    disabled={item.workflowStatus === "concluida" || syncingItem}
                  >
                    {PERCENTUAL_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <label style={styles.formLabel}>Observacao do responsavel</label>
                <textarea
                  value={observacaoResponsavel}
                  onChange={(e) => setObservacaoResponsavel(e.target.value)}
                  style={styles.textarea}
                  disabled={item.workflowStatus === "concluida" || syncingItem}
                />
              </div>

              {item.workflowStatus === "pendente-aprovacao" ? (
                <div style={styles.inlineActions}>
                  <button type="button" style={styles.secondaryButtonElement} onClick={handleAssignToMe} disabled={!currentSupervisorId || syncingItem}>
                    Atribuir para mim
                  </button>
                  <button type="button" style={styles.primaryButtonElement} onClick={() => void handleAtribuir()} disabled={actionLoadingKey === "assign" || syncingItem}>
                    {actionLoadingKey === "assign" ? "Atribuindo..." : "Aprovar e atribuir"}
                  </button>
                  <button type="button" style={styles.successButtonElement} onClick={() => void handleConcluir()} disabled={actionLoadingKey === "complete" || syncingItem}>
                    {actionLoadingKey === "complete" ? "Concluindo..." : "Concluir agora"}
                  </button>
                </div>
              ) : null}

              {item.workflowStatus === "em-andamento" ? (
                <div style={styles.inlineActions}>
                  <button type="button" style={styles.primaryButtonElement} onClick={() => void handleSalvarTratativa()} disabled={actionLoadingKey === "save" || syncingItem}>
                    {actionLoadingKey === "save" ? "Salvando..." : "Salvar alteracoes"}
                  </button>
                  <button type="button" style={styles.successButtonElement} onClick={() => void handleConcluir()} disabled={actionLoadingKey === "complete" || syncingItem}>
                    {actionLoadingKey === "complete" ? "Concluindo..." : "Marcar como concluida"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div style={styles.historySection}>
            <div style={styles.historyHeader}>
              <div style={styles.sectionLabel}>Historico de mudancas</div>
            </div>
            {historyEntries.length === 0 ? (
              <div style={styles.historyEmptyState}>Nenhuma movimentacao retornada pela API para este item.</div>
            ) : (
              <div style={styles.timeline}>
                {historyEntries.map((entry) => (
                  <div key={entry.id} style={styles.timelineRow}>
                    <div style={styles.timelineDot} />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineTop}>
                        <strong style={styles.timelineTitle}>{entry.title}</strong>
                        <span style={styles.timelineDate}>{formatDateTime(entry.date)}</span>
                      </div>
                      <div style={styles.timelineAuthor}>{entry.author}</div>
                      <div style={styles.timelineText}>{entry.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function HeaderField({
  label,
  value,
  span,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  span?: number;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{ ...styles.headerField, ...(span ? { gridColumn: `span ${span}` } : {}) }}>
      <div style={styles.headerFieldLabel}>{label}</div>
      <div style={{ ...styles.headerFieldValue, ...(mono ? styles.headerFieldMono : {}), ...(highlight ? styles.headerFieldHighlight : {}) }}>
        {value}
      </div>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

function ensureHistoryEntry(item: PainelItem, fallbackEntry: HistoryFallbackEntry) {
  const currentHistory = item.historico ?? [];
  const alreadyExists = currentHistory.some((entry) =>
    entry.titulo === fallbackEntry.titulo && entry.descricao === fallbackEntry.descricao,
  );

  if (alreadyExists) {
    return item;
  }

  return {
    ...item,
    historico: [
      {
        id: `fallback-${Date.now()}`,
        titulo: fallbackEntry.titulo,
        descricao: fallbackEntry.descricao,
        criadoEm: new Date().toISOString(),
        criadoPorNomeCompleto: item.aprovadoPorNomeCompleto || item.concluidoPorNomeCompleto || "Supervisor",
      },
      ...currentHistory,
    ],
  };
}

function buildAssignedHistoryDescription({
  responsavelNomeCompleto,
  percentualConclusao,
  dataPrevistaConclusao,
  observacaoResponsavel,
}: {
  responsavelNomeCompleto: string;
  percentualConclusao: number;
  dataPrevistaConclusao: string;
  observacaoResponsavel: string;
}) {
  const parts = [
    `Responsavel definido: ${responsavelNomeCompleto}.`,
    `Percentual inicial: ${percentualConclusao}%.`,
  ];

  if (dataPrevistaConclusao) {
    parts.push(`Data prevista de conclusao: ${formatDateOnly(`${dataPrevistaConclusao}T00:00:00.000Z`)}.`);
  }

  if (observacaoResponsavel.trim()) {
    parts.push(`Observacao do responsavel: ${observacaoResponsavel.trim()}.`);
  }

  return parts.join("\n");
}

function buildUpdateHistoryEntry(
  previousItem: PainelItem,
  nextValues: {
    selectedResponsavelId: string;
    responsaveis: ResponsavelOption[];
    observacaoResponsavel: string;
    dataPrevistaConclusao: string;
    percentualConclusao: number;
  },
): HistoryFallbackEntry {
  const changes: string[] = [];
  const nextResponsavel = nextValues.responsaveis.find((entry) => entry.id === nextValues.selectedResponsavelId);
  const previousResponsavel = previousItem.responsavelNomeCompleto || "Responsavel nao informado";
  const nextResponsavelNome = nextResponsavel?.nomeCompleto || previousItem.responsavelNomeCompleto || "Responsavel nao informado";

  if (previousResponsavel !== nextResponsavelNome) {
    changes.push(`Responsavel alterado de ${previousResponsavel} para ${nextResponsavelNome}.`);
  }

  if ((previousItem.percentualConclusao ?? 0) !== nextValues.percentualConclusao) {
    changes.push(`Porcentagem alterada de ${previousItem.percentualConclusao ?? 0}% para ${nextValues.percentualConclusao}%.`);
  }

  const previousDataPrevista = previousItem.dataPrevistaConclusao ? formatDateOnly(previousItem.dataPrevistaConclusao) : "-";
  const nextDataPrevista = nextValues.dataPrevistaConclusao ? formatDateOnly(`${nextValues.dataPrevistaConclusao}T00:00:00.000Z`) : "-";
  if (previousDataPrevista !== nextDataPrevista) {
    changes.push(`Data prevista alterada de ${previousDataPrevista} para ${nextDataPrevista}.`);
  }

  const previousObservacao = (previousItem.observacaoResponsavel || "").trim() || "-";
  const nextObservacao = nextValues.observacaoResponsavel.trim() || "-";
  if (previousObservacao !== nextObservacao) {
    changes.push(`Observacao do responsavel alterada de ${previousObservacao} para ${nextObservacao}.`);
  }

  return {
    titulo: "Tratativa atualizada",
    descricao: changes.length > 0 ? changes.join("\n") : "Os dados da tratativa foram atualizados.",
  };
}

function selectMostCompleteItem(primary: PainelItem, candidate: PainelItem | null | undefined) {
  if (!candidate) return primary;

  const primaryHistoryCount = primary.historico?.length ?? 0;
  const candidateHistoryCount = candidate.historico?.length ?? 0;

  if (candidateHistoryCount > primaryHistoryCount) return candidate;
  if (primaryHistoryCount > candidateHistoryCount) return primary;

  const primarySignals = countHistorySignals(primary);
  const candidateSignals = countHistorySignals(candidate);

  if (candidateSignals > primarySignals) return candidate;
  if (primarySignals > candidateSignals) return primary;

  return primary;
}

function countHistorySignals(item: PainelItem) {
  let score = 0;
  if (item.aprovadoEm) score += 1;
  if (item.concluidoEm) score += 1;
  if (item.observacaoResponsavel) score += 1;
  if (item.dataPrevistaConclusao) score += 1;
  if (item.percentualConclusao > 0) score += 1;
  return score;
}

function buildFallbackAtribuicaoDescription(item: PainelItem, fallback: {
  responsavelNomeCompleto: string;
  percentualConclusao: number;
  dataPrevistaConclusao: string | null;
  observacaoResponsavel: string | null;
}) {
  const parts = [
    `Responsavel definido: ${fallback.responsavelNomeCompleto}.`,
    `Percentual atual: ${fallback.percentualConclusao}%.`,
  ];

  if (fallback.dataPrevistaConclusao) {
    parts.push(`Data prevista de conclusao: ${formatDateOnly(fallback.dataPrevistaConclusao)}.`);
  }

  if (fallback.observacaoResponsavel) {
    parts.push(`Observacao do responsavel: ${fallback.observacaoResponsavel}.`);
  }

  return parts.join("\n");
}

function formatDateOnly(value?: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return "-";
  return `${day}/${month}/${year}`;
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

const PERCENTUAL_OPTIONS = Array.from({ length: 11 }, (_, index) => index * 10);

const styles: Record<string, CSSProperties> = {
  page: {
    display: "grid",
    gap: 24,
  },
  feedbackCard: {
    border: "1px solid #D0D5DD",
    borderRadius: 18,
    background: "#FFFFFF",
    padding: 22,
    fontSize: 14,
    color: "#475467",
  },
  errorCard: {
    borderColor: "#F04438",
    background: "#FEF3F2",
    color: "#B42318",
  },
  commandBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 16,
    flexWrap: "wrap",
  },
  commandBarCopy: {
    display: "grid",
    gap: 4,
  },
  commandBarKicker: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#0A6AD7",
  },
  commandBarTitle: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.05,
    color: "#101828",
  },
  commandBarActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryButton: {
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #0A6AD7",
    borderRadius: 12,
    padding: "11px 16px",
    background: "#0A6AD7",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 14,
  },
  secondaryButton: {
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #D0D5DD",
    borderRadius: 12,
    padding: "11px 16px",
    background: "#FFFFFF",
    color: "#344054",
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
  sheet: {
    border: "1px solid #D0D5DD",
    borderRadius: 22,
    overflow: "hidden",
    background: "#F8FAFC",
  },
  headerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 0,
    borderBottom: "1px solid #E4E7EC",
    background: "#FFFFFF",
  },
  headerField: {
    display: "grid",
    gap: 6,
    padding: "14px 16px",
    borderRight: "1px solid #E4E7EC",
    borderBottom: "1px solid #E4E7EC",
    background: "#FFFFFF",
  },
  headerFieldLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },
  headerFieldValue: {
    fontSize: 15,
    color: "#101828",
    lineHeight: 1.35,
    fontWeight: 700,
  },
  headerFieldMono: {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: 12,
  },
  headerFieldHighlight: {
    color: "#0A6AD7",
    background: "#EFF8FF",
    border: "1px solid #B2DDFF",
    borderRadius: 999,
    padding: "6px 10px",
    display: "inline-flex",
    width: "fit-content",
  },
  singlePanel: {
    display: "grid",
    gap: 10,
    padding: 2,
  },
  headerNarrativeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 0,
    borderBottom: "1px solid #E4E7EC",
    background: "#F8FAFC",
  },
  headerNarrativeBlock: {
    display: "grid",
    gap: 8,
    padding: "14px 16px",
    borderRight: "1px solid #E4E7EC",
    background: "#F8FAFC",
    minHeight: 78,
  },
  headerNarrativeWide: {
    gridColumn: "span 2",
  },
  problemCompactText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#101828",
    fontWeight: 700,
  },
  problemImageShell: {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #D0D5DD",
    background: "#FFFFFF",
  },
  problemImage: {
    display: "block",
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
  },
  descriptionLayout: {
    display: "grid",
  },
  actionPanel: {
    border: "1px solid #D0D5DD",
    borderTop: "4px solid #0A6AD7",
    borderRadius: 16,
    background: "#FFFFFF",
    padding: 16,
    display: "grid",
    gap: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  problemText: {
    fontSize: 18,
    lineHeight: 1.6,
    fontWeight: 700,
    color: "#101828",
  },
  actionPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    paddingBottom: 12,
    borderBottom: "1px solid #EAECF0",
  },
  actionFormGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  analysisState: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0A6AD7",
  },
  formRow: {
    display: "grid",
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#344054",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  input: {
    width: "100%",
    border: "1px solid #D0D5DD",
    borderRadius: 12,
    padding: "11px 13px",
    fontSize: 14,
    color: "#101828",
    background: "#FCFCFD",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 108,
    border: "1px solid #D0D5DD",
    borderRadius: 12,
    padding: "11px 13px",
    fontSize: 14,
    color: "#101828",
    background: "#FCFCFD",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },
  inlineActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    paddingTop: 4,
  },
  secondaryButtonElement: {
    border: "1px solid #D0D5DD",
    borderRadius: 12,
    padding: "10px 14px",
    background: "#FFFFFF",
    color: "#344054",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryButtonElement: {
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    background: "#0A6AD7",
    color: "#FFFFFF",
    fontWeight: 700,
    cursor: "pointer",
  },
  successButtonElement: {
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    background: "#169C4B",
    color: "#FFFFFF",
    fontWeight: 700,
    cursor: "pointer",
  },
  timeline: {
    display: "grid",
    gap: 16,
  },
  historySection: {
    borderTop: "1px solid #D0D5DD",
    paddingTop: 18,
    display: "grid",
    gap: 14,
  },
  historyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  historyEmptyState: {
    border: "1px dashed #D0D5DD",
    borderRadius: 16,
    padding: 16,
    color: "#667085",
    background: "#FFFFFF",
    fontSize: 14,
  },
  timelineRow: {
    display: "grid",
    gridTemplateColumns: "18px minmax(0, 1fr)",
    gap: 12,
    alignItems: "start",
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    background: "#0A6AD7",
    marginTop: 6,
    boxShadow: "0 0 0 4px #EFF8FF",
  },
  timelineContent: {
    border: "1px solid #D0D5DD",
    borderRadius: 16,
    padding: 16,
    background: "#FFFFFF",
    display: "grid",
    gap: 8,
  },
  timelineTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  timelineTitle: {
    color: "#101828",
    fontSize: 16,
    fontWeight: 800,
  },
  timelineDate: {
    color: "#667085",
    fontSize: 13,
    fontWeight: 600,
  },
  timelineAuthor: {
    color: "#0A6AD7",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  timelineText: {
    color: "#344054",
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: "pre-line",
  },
};
