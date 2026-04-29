import React, { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../api";

type EquipamentoOption = {
  id: string;
  codigo: string;
  descricao: string;
};

type ClosingSummary = {
  id: string;
  equipamentoId: string;
  equipamentoCodigo: string;
  equipamentoDescricao: string;
  ano: number;
  mes: number;
  quantidadeChecklists: number;
  templateVersao: string;
  nomeArquivo: string;
  fechadoEm: string;
  fechadoPorNome: string;
};

type PreviewRow = {
  ordem: number;
  descricao: string;
  valoresPorDia: Array<string | null>;
};

type PreviewDay = {
  dia: number;
  checklistId: string;
  operadorNome: string;
  operadorMatricula: string;
  dataRealizacao: string;
};

type ClosingPreview = {
  jaFechado: boolean;
  fechamentoId: string | null;
  equipamentoId: string;
  equipamentoCodigo: string;
  equipamentoDescricao: string;
  setorNome: string;
  ano: number;
  mes: number;
  totalDiasComChecklist: number;
  totalChecklistsConsiderados: number;
  linhas: PreviewRow[];
  dias: PreviewDay[];
  comentarios: string[];
  operadoresConsolidados: string[];
  avisos: string[];
};

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function FechamentosMensaisPage() {
  const [equipamentos, setEquipamentos] = useState<EquipamentoOption[]>([]);
  const [resumos, setResumos] = useState<ClosingSummary[]>([]);
  const [preview, setPreview] = useState<ClosingPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const [ano, mes] = useMemo(() => {
    const [year, month] = monthValue.split("-").map(Number);
    return [year, month];
  }, [monthValue]);

  const previewDaysInMonth = preview ? new Date(preview.ano, preview.mes, 0).getDate() : 0;
  const previewFilledDays = useMemo(() => {
    return new Set((preview?.dias ?? []).map((item) => item.dia));
  }, [preview]);
  const displayWarnings = useMemo(() => {
    return (preview?.avisos ?? []).filter((aviso) => !aviso.startsWith("Dias sem checklist:"));
  }, [preview]);
  const previewMissingDays = useMemo(() => {
    if (!preview) return [];
    return Array.from({ length: previewDaysInMonth }, (_, index) => index + 1).filter((day) => !previewFilledDays.has(day));
  }, [preview, previewDaysInMonth, previewFilledDays]);
  const previewDayMap = useMemo(() => {
    return new Map((preview?.dias ?? []).map((item) => [item.dia, item]));
  }, [preview]);
  const occurrenceCards = useMemo(() => {
    if (!preview) return [];

    return preview.comentarios.map((comentario, index) => {
      const match = comentario.match(/^Dia\s+(\d{2})/i);
      const dia = match ? Number(match[1]) : null;
      const dayInfo = dia ? previewDayMap.get(dia) : undefined;

      return {
        id: `${index}-${comentario}`,
        comentario,
        dia,
        operadorNome: dayInfo?.operadorNome ?? "Operador nao identificado",
        operadorMatricula: dayInfo?.operadorMatricula ?? "-",
      };
    });
  }, [preview, previewDayMap]);

  useEffect(() => {
    void loadBase();
  }, []);

  useEffect(() => {
    void loadSummaries();
  }, [ano, mes]);

  async function loadBase() {
    setLoadingList(true);
    setError("");
    try {
      const [equipamentosData, resumosData] = await Promise.all([
        api.get<EquipamentoOption[]>("/api/equipamentos"),
        api.get<ClosingSummary[]>(`/api/supervisor/fechamentos-mensais?ano=${ano}&mes=${mes}`),
      ]);

      setEquipamentos(equipamentosData);
      setResumos(resumosData);
      setEquipamentoId((current) => current || equipamentosData[0]?.id || "");
    } catch (e) {
      setError(extractMessage(e, "Erro ao carregar fechamentos mensais."));
    } finally {
      setLoadingList(false);
    }
  }

  async function loadSummaries() {
    try {
      const data = await api.get<ClosingSummary[]>(`/api/supervisor/fechamentos-mensais?ano=${ano}&mes=${mes}`);
      setResumos(data);
    } catch (e) {
      setError(extractMessage(e, "Erro ao atualizar a lista de fechamentos."));
    }
  }

  async function handlePreview() {
    if (!equipamentoId) {
      setError("Selecione um equipamento.");
      return;
    }

    setLoadingPreview(true);
    setError("");
    setSuccess("");

    try {
      const data = await api.get<ClosingPreview>(
        `/api/supervisor/fechamentos-mensais/preview?equipamentoId=${equipamentoId}&ano=${ano}&mes=${mes}`,
      );
      setPreview(data);
    } catch (e) {
      setError(extractMessage(e, "Erro ao gerar a previa do fechamento."));
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleCloseMonth() {
    if (!preview) {
      setError("Gere a previa antes de fechar o mes.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const resumo = await api.post<ClosingSummary>("/api/supervisor/fechamentos-mensais/fechar", {
        equipamentoId: preview.equipamentoId,
        ano: preview.ano,
        mes: preview.mes,
      });

      setSuccess(`Fechamento criado: ${resumo.nomeArquivo}`);
      await loadSummaries();
      await handlePreview();
    } catch (e) {
      setError(extractMessage(e, "Erro ao fechar o mes."));
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadArquivo(id: string, fileName: string) {
    try {
      const blob = await api.getBlob(`/api/supervisor/fechamentos-mensais/${id}/arquivo`);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(extractMessage(e, "Erro ao baixar a planilha oficial."));
    }
  }

  return (
    <div className="cf-page">
      <div className="cf-page-header">
        <div>
          <h1 className="cf-page-title"></h1>
          <p className="cf-page-subtitle"></p>
        </div>
      </div>

      {error ? <div className="cf-alert cf-alert-error">{error}</div> : null}
      {success ? <div className="cf-alert cf-alert-success">{success}</div> : null}

      <section className="cf-surface cf-surface-padded">
        <div className="cf-form-grid">
          <div>
            <label className="cf-field-label">Equipamento</label>
            <select value={equipamentoId} onChange={(e) => setEquipamentoId(e.target.value)}>
              <option value="">Selecione</option>
              {equipamentos.map((equipamento) => (
                <option key={equipamento.id} value={equipamento.id}>
                  {equipamento.codigo} - {equipamento.descricao}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="cf-field-label">Competencia</label>
            <input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
          </div>
        </div>

        <div className="cf-form-actions" style={{ marginTop: 14 }}>
          <button type="button" className="cf-button cf-button-secondary" onClick={() => void loadBase()}>
            Atualizar lista
          </button>
          <button type="button" className="cf-button cf-button-primary" onClick={() => void handlePreview()}>
            {loadingPreview ? "Gerando previa..." : "Gerar previa"}
          </button>
          <button
            type="button"
            className="cf-button cf-button-primary"
            onClick={() => void handleCloseMonth()}
            disabled={!preview || preview.jaFechado || submitting}
          >
            {submitting ? "Fechando..." : "Fechar mes"}
          </button>
          {preview?.jaFechado && preview.fechamentoId ? (
            <button
              type="button"
              className="cf-button cf-button-secondary"
              onClick={() =>
                void downloadArquivo(
                  preview.fechamentoId!,
                  `CheckFlow_${preview.equipamentoCodigo}_${preview.ano}-${String(preview.mes).padStart(2, "0")}.xlsx`,
                )
              }
            >
              Baixar planilha
            </button>
          ) : null}
        </div>
      </section>

      {preview ? (
        <section className="cf-surface cf-surface-padded">
          <div className="cf-page-header">
            <div>
              <h2 className="cf-surface-title">
                Previa {preview.equipamentoCodigo} - {String(preview.mes).padStart(2, "0")}/{preview.ano}
              </h2>
            </div>
            <div className="cf-metrics" style={{ minWidth: 280 }}>
              <div className="cf-metric">
                <div className="cf-metric-value">{preview.totalDiasComChecklist}</div>
                <div className="cf-metric-label">Dias preenchidos</div>
              </div>
              <div className="cf-metric">
                <div className="cf-metric-value">{previewMissingDays.length}</div>
                <div className="cf-metric-label">Dias pendentes</div>
              </div>
              <div className="cf-metric">
                <div className="cf-metric-value">{preview.comentarios.length}</div>
                <div className="cf-metric-label">Ocorrencias</div>
              </div>
            </div>
          </div>

          <div className="cf-layout-2-wide" style={{ marginTop: 16 }}>
            <div
              className="cf-surface cf-surface-padded"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
                border: "1px solid #d6e4f3",
                boxShadow: "0 18px 32px rgba(0, 87, 184, 0.08)",
              }}
            >
              <h3 className="cf-surface-title">Cobertura da competencia</h3>
              <div className="cf-meta" style={{ marginTop: 6 }}>
                {preview.jaFechado ? "Competencia fechada com snapshot oficial." : "Competencia aberta. Dias sem checklist continuam como pendentes na previa."}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(54px, 1fr))",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                {Array.from({ length: previewDaysInMonth }, (_, index) => {
                  const day = index + 1;
                  const filled = previewFilledDays.has(day);
                  const dayInfo = previewDayMap.get(day);
                  const showTooltip = filled && hoveredDay === day && dayInfo;

                  return (
                    <button
                      key={day}
                      type="button"
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay((current) => (current === day ? null : current))}
                      onFocus={() => setHoveredDay(day)}
                      onBlur={() => setHoveredDay((current) => (current === day ? null : current))}
                      style={{
                        border: filled ? "1px solid #8fd0a4" : "1px solid #d6e0eb",
                        background: filled ? "linear-gradient(180deg, #f5fbf7 0%, #e8f6ed 100%)" : "linear-gradient(180deg, #ffffff 0%, #f3f6f9 100%)",
                        boxShadow: filled ? "0 12px 24px rgba(17, 96, 50, 0.08)" : "0 10px 20px rgba(15, 23, 42, 0.05)",
                        borderRadius: 18,
                        padding: "12px 8px",
                        display: "grid",
                        gap: 6,
                        justifyItems: "center",
                        textAlign: "center",
                        alignContent: "start",
                        minHeight: filled ? 96 : 78,
                        position: "relative",
                        cursor: filled ? "pointer" : "default",
                        appearance: "none",
                        width: "100%",
                      }}
                      aria-label={
                        filled && dayInfo
                          ? `Dia ${String(day).padStart(2, "0")}. Checklist feito por ${dayInfo.operadorNome} as ${formatTime(dayInfo.dataRealizacao)}.`
                          : `Dia ${String(day).padStart(2, "0")} pendente.`
                      }
                    >
                      <strong style={{ fontSize: 15, color: filled ? "#116032" : "#344054" }}>
                        {String(day).padStart(2, "0")}
                      </strong>
                      <span style={{ fontSize: 11.5, color: filled ? "#116032" : "#667085", fontWeight: 700 }}>
                        {filled ? "Preenchido" : "Pendente"}
                      </span>

                      {showTooltip ? (
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            bottom: "calc(100% + 10px)",
                            transform: "translateX(-50%)",
                            width: 188,
                            padding: "10px 12px",
                            borderRadius: 14,
                            background: "#0f172a",
                            color: "#ffffff",
                            boxShadow: "0 18px 36px rgba(15, 23, 42, 0.22)",
                            textAlign: "left",
                            zIndex: 4,
                          }}
                        >
                          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{dayInfo.operadorNome}</div>
                          <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 2 }}>
                            Matricula {dayInfo.operadorMatricula}
                          </div>
                          <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 8 }}>
                            {formatDateShort(dayInfo.dataRealizacao)} as {formatTime(dayInfo.dataRealizacao)}
                          </div>
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "100%",
                              width: 12,
                              height: 12,
                              background: "#0f172a",
                              transform: "translateX(-50%) rotate(45deg)",
                            }}
                          />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {displayWarnings.length > 0 ? (
                <div className="cf-stack" style={{ marginTop: 14 }}>
                  {displayWarnings.map((aviso, index) => (
                    <div key={`${index}-${aviso}`} className="cf-alert cf-alert-error">
                      {aviso}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div
              className="cf-surface cf-surface-padded"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%)",
                border: "1px solid #dbe4ee",
                boxShadow: "0 16px 28px rgba(15, 23, 42, 0.08)",
              }}
            >
              <h3 className="cf-surface-title">Resumo da previa</h3>
              <div className="cf-stack" style={{ marginTop: 14, gap: 12 }}>
                <div>
                  <div className="cf-meta">Equipamento</div>
                  <div className="cf-name">
                    {preview.equipamentoCodigo} - {preview.equipamentoDescricao}
                  </div>
                </div>
                <div>
                  <div className="cf-meta">Setor</div>
                  <div className="cf-name">{preview.setorNome}</div>
                </div>
                <div>
                  <div className="cf-meta">Situacao</div>
                  <div className="cf-inline-actions" style={{ marginTop: 6 }}>
                    <span className={`cf-badge ${preview.jaFechado ? "cf-badge-blue" : "cf-badge-warning"}`}>
                      {preview.jaFechado ? "Fechado" : "Aberto"}
                    </span>
                    <span className="cf-badge cf-badge-gray">{preview.totalChecklistsConsiderados} checklists usados</span>
                  </div>
                </div>
                <div>
                  <div className="cf-meta">Operadores no periodo</div>
                  <div className="cf-inline-actions" style={{ marginTop: 6 }}>
                    {preview.operadoresConsolidados.length === 0 ? (
                      <span className="cf-badge cf-badge-gray">Sem operadores</span>
                    ) : (
                      preview.operadoresConsolidados.map((item) => (
                        <span key={item} className="cf-badge cf-badge-gray">
                          {item}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="cf-surface cf-surface-padded" style={{ marginTop: 16 }}>
            <div className="cf-surface-header">
              <h3 className="cf-surface-title">Ocorrencias registradas</h3>
              <span className="cf-count">{occurrenceCards.length}</span>
            </div>

            {occurrenceCards.length === 0 ? (
              <div className="cf-empty cf-empty-soft" style={{ marginTop: 12 }}>
                Nenhum comentario no periodo.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 14,
                  marginTop: 16,
                }}
              >
                {occurrenceCards.map((item) => (
                  <article
                    key={item.id}
                    className="cf-surface"
                    style={{
                      padding: 18,
                      borderRadius: 20,
                      background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                      border: "1px solid #dbe5f0",
                      boxShadow: "0 16px 28px rgba(15, 23, 42, 0.08)",
                    }}
                  >
                    <div className="cf-inline-actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <span className="cf-badge cf-badge-blue">
                        {item.dia ? `Dia ${String(item.dia).padStart(2, "0")}` : "Sem dia"}
                      </span>
                      <span className="cf-badge cf-badge-gray">{preview.equipamentoCodigo}</span>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div className="cf-meta">Operador</div>
                      <div className="cf-name">{item.operadorNome}</div>
                      <div className="cf-meta">Matricula {item.operadorMatricula}</div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div className="cf-meta">Comentario</div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 13.5,
                          lineHeight: 1.6,
                          color: "#1f2937",
                          padding: "12px 13px",
                          borderRadius: 14,
                          background: "#f7fafc",
                          border: "1px solid #e3eaf2",
                        }}
                      >
                        {item.comentario}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      ) : null}

      <section className="cf-surface">
        <div className="cf-surface-header">
          <h2 className="cf-surface-title">Fechamentos gerados</h2>
          <span className="cf-count">{resumos.length}</span>
        </div>

        {loadingList ? (
          <div className="cf-loading">Carregando fechamentos...</div>
        ) : (
          <div className="cf-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Competencia</th>
                  <th>Checklists</th>
                  <th>Fechado em</th>
                  <th>Responsavel</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {resumos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="cf-empty">
                      Nenhum fechamento mensal.
                    </td>
                  </tr>
                ) : (
                  resumos.map((resumo) => (
                    <tr key={resumo.id} className="cf-data-row">
                      <td>
                        <div className="cf-name">{resumo.equipamentoCodigo}</div>
                        <div className="cf-meta">{resumo.equipamentoDescricao}</div>
                      </td>
                      <td>
                        {String(resumo.mes).padStart(2, "0")}/{resumo.ano}
                      </td>
                      <td>{resumo.quantidadeChecklists}</td>
                      <td>{formatDateTime(resumo.fechadoEm)}</td>
                      <td>{resumo.fechadoPorNome}</td>
                      <td>
                        <div className="cf-inline-actions">
                          <button
                            type="button"
                            className="cf-button cf-button-secondary cf-button-small"
                            onClick={() => void downloadArquivo(resumo.id, resumo.nomeArquivo)}
                          >
                            Planilha oficial
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
      </section>
    </div>
  );
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.body) as { message?: string };
      return parsed.message || error.message;
    } catch {
      return error.body || error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
