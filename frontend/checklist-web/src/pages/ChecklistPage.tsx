import React, { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api";
import "../styles/global.css";
import type {
  ChecklistDto,
  ChecklistItemTemplateDto,
  EquipamentoDto,
  ItemStatus,
} from "../types";

type ItemForm = {
  templateId: string;
  status: ItemStatus;
  observacao?: string;
};

type OperadorSugestao = {
  id: string;
  nome: string;
  matricula: string;
};

export function ChecklistPage() {
  const { qrId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [equipamento, setEquipamento] = useState<EquipamentoDto | null>(null);
  const [templates, setTemplates] = useState<ChecklistItemTemplateDto[]>([]);
  const [itens, setItens] = useState<Record<string, ItemForm>>({});
  const [operadorId, setOperadorId] = useState("");
  const [operadorQuery, setOperadorQuery] = useState("");
  const [sugestoesOperador, setSugestoesOperador] = useState<OperadorSugestao[]>([]);
  const [loadingOperador, setLoadingOperador] = useState(false);
  const [obsGerais, setObsGerais] = useState("");
  const [signatureStepOpen, setSignatureStepOpen] = useState(false);
  const [assinaturaBase64, setAssinaturaBase64] = useState("");
  const [result, setResult] = useState<ChecklistDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signatureRef = useRef<SignatureCanvas | null>(null);

  const allAnswered = useMemo(() => {
    if (templates.length === 0) return false;
    return templates.every((template) => {
      const status = itens[template.id]?.status;
      return status && status !== "NaoVerificado";
    });
  }, [itens, templates]);

  const hasOperatorSearch = operadorQuery.trim().length >= 2 && !operadorId;
  const canOpenSignature = !!operadorId && allAnswered;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const eq = await api.get<EquipamentoDto>(`/api/equipamentos/por-qr/${qrId}`);
        const tpl = await api.get<ChecklistItemTemplateDto[]>(
          `/api/supervisor/checklist-itens-template?categoriaId=${eq.categoriaId}&ativos=true`
        );

        if (!mounted) return;

        const initial: Record<string, ItemForm> = {};
        for (const template of tpl) {
          initial[template.id] = {
            templateId: template.id,
            status: "NaoVerificado",
          };
        }

        setEquipamento(eq);
        setTemplates(tpl);
        setItens(initial);
      } catch (e: unknown) {
        if (!mounted) return;
        setError(extractErrorMessage(e, "Falha ao carregar checklist."));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    if (qrId) {
      void load();
    }

    return () => {
      mounted = false;
    };
  }, [qrId]);

  useEffect(() => {
    const query = operadorQuery.trim();
    let active = true;

    if (operadorId) {
      setSugestoesOperador([]);
      setLoadingOperador(false);
      return () => {
        active = false;
      };
    }

    if (query.length < 2) {
      setSugestoesOperador([]);
      setLoadingOperador(false);
      return () => {
        active = false;
      };
    }

    const handle = window.setTimeout(async () => {
      try {
        if (!active) return;
        setLoadingOperador(true);

        const data = await api.get<OperadorSugestao[]>(
          `/api/operadores/busca?query=${encodeURIComponent(query)}&take=10${
            equipamento ? `&setorId=${equipamento.setorId}` : ""
          }`
        );

        if (!active) return;
        setSugestoesOperador(data);
      } catch {
        if (!active) return;
        setSugestoesOperador([]);
      } finally {
        if (!active) return;
        setLoadingOperador(false);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(handle);
    };
  }, [equipamento, operadorId, operadorQuery]);

  useEffect(() => {
    if (canOpenSignature) return;
    setSignatureStepOpen(false);
    signatureRef.current?.clear();
    setAssinaturaBase64("");
  }, [canOpenSignature]);

  function invalidateSignature() {
    signatureRef.current?.clear();
    setAssinaturaBase64("");
  }

  function setStatus(templateId: string, status: ItemStatus) {
    invalidateSignature();
    setItens((current) => ({
      ...current,
      [templateId]: {
        ...current[templateId],
        templateId,
        status,
        observacao: status === "NOK" ? current[templateId]?.observacao ?? "" : "",
      },
    }));
  }

  function setObs(templateId: string, observacao: string) {
    invalidateSignature();
    setItens((current) => ({
      ...current,
      [templateId]: {
        ...current[templateId],
        templateId,
        observacao,
      },
    }));
  }

  function capturarAssinatura() {
    if (!signatureRef.current) return "";

    if (signatureRef.current.isEmpty()) {
      setAssinaturaBase64("");
      return "";
    }

    const dataUrl = signatureRef.current.getCanvas().toDataURL("image/png");
    setAssinaturaBase64(dataUrl);
    return dataUrl;
  }

  function limparAssinatura() {
    signatureRef.current?.clear();
    setAssinaturaBase64("");
  }

  function abrirAssinatura() {
    if (!operadorId) {
      setError("Selecione um operador antes de assinar.");
      return;
    }

    if (!allAnswered) {
      setError("Conclua todos os itens antes de assinar.");
      return;
    }

    setError(null);
    setSignatureStepOpen(true);
    limparAssinatura();
  }

  async function submit() {
    if (!equipamento) return;

    setError(null);
    setResult(null);

    if (!operadorId) {
      setError("Selecione um operador antes de enviar.");
      return;
    }

    if (!allAnswered) {
      setError("Responda todos os itens antes de enviar.");
      return;
    }

    const assinatura = capturarAssinatura();
    if (!assinatura) {
      setError("O operador precisa assinar antes de enviar.");
      return;
    }

    const payload = {
      equipamentoId: equipamento.id,
      operadorId: operadorId.trim(),
      itens: templates.map((template) => ({
        templateId: template.id,
        status: itens[template.id].status,
        observacao: itens[template.id].status === "NOK" ? itens[template.id].observacao ?? "" : null,
      })),
      observacoesGerais: obsGerais || null,
      assinaturaOperadorBase64: assinatura,
    };

    try {
      const created = await api.post<ChecklistDto>("/api/checklists", payload);
      setResult(created);

      window.setTimeout(() => {
        navigate("/?sucesso=1");
      }, 1500);
    } catch (e: unknown) {
      setError(extractErrorMessage(e, "Falha ao enviar checklist."));
    }
  }

  if (loading) {
    return (
      <div className="cf-mobile-page">
        <div className="cf-checklist-shell">
          <div className="cf-loading cf-surface cf-surface-padded">Carregando checklist...</div>
        </div>
      </div>
    );
  }

  if (error && !equipamento) {
    return (
      <div className="cf-mobile-page">
        <div className="cf-checklist-shell">
          <div className="cf-alert cf-alert-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!equipamento) {
    return (
      <div className="cf-mobile-page">
        <div className="cf-checklist-shell">
          <div className="cf-alert cf-alert-error">Equipamento não encontrado.</div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="cf-mobile-page">
        <div className="cf-checklist-shell">
          <section className="cf-mobile-success">
            <div className="cf-mobile-success-icon">
              <CheckIcon />
            </div>
            <h1 className="cf-mobile-success-title">Checklist enviado</h1>
            <p className="cf-mobile-success-text">
              Equipamento <strong>{result.equipamentoCodigo}</strong>
            </p>
            <p className="cf-mobile-success-meta">
              {new Date(result.dataRealizacao).toLocaleString("pt-BR")}
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-mobile-page">
      <div className="cf-mobile-backdrop cf-mobile-backdrop-top" />
      <div className="cf-mobile-backdrop cf-mobile-backdrop-bottom" />

      <div className="cf-checklist-shell">
        <section className="cf-checklist-hero">
          <div className="cf-checklist-hero-top">
            <div className="cf-checklist-brand">
              <div className="cf-mobile-logo">
                <QrIcon />
              </div>

              <div>
                <div className="cf-mobile-brand-name">CheckFlow</div>
                <div className="cf-checklist-brand-meta">Checklist operacional</div>
              </div>
            </div>

            <button
              type="button"
              className="cf-button cf-button-secondary cf-checklist-back-button"
              onClick={() => navigate(-1)}
            >
              Voltar
            </button>
          </div>

          <div className="cf-checklist-hero-copy">
            <h1 className="cf-checklist-title">Checklist</h1>
          </div>

          <div className="cf-checklist-equipment-grid">
            <div className="cf-checklist-equipment-card">
              <span className="cf-checklist-equipment-label">Código</span>
              <strong className="cf-checklist-equipment-value">{equipamento.codigo}</strong>
            </div>
            <div className="cf-checklist-equipment-card">
              <span className="cf-checklist-equipment-label">Categoria</span>
              <strong className="cf-checklist-equipment-value">{equipamento.categoriaNome}</strong>
            </div>
            <div className="cf-checklist-equipment-card cf-checklist-equipment-card-wide">
              <span className="cf-checklist-equipment-label">Descrição</span>
              <strong className="cf-checklist-equipment-value">{equipamento.descricao}</strong>
            </div>
            <div className="cf-checklist-equipment-card cf-checklist-equipment-card-wide">
              <span className="cf-checklist-equipment-label">QR ID</span>
              <strong className="cf-checklist-equipment-value">{equipamento.qrId}</strong>
            </div>
          </div>

          <div className="cf-checklist-hero-form">
            <section className="cf-checklist-hero-panel">
              <div className="cf-checklist-hero-panel-head">
                <div className="cf-checklist-hero-panel-icon">
                  <UserIconLight />
                </div>

                <div className="cf-checklist-section-copy">
                  <h2 className="cf-checklist-hero-panel-title">Operador</h2>
                  <p className="cf-checklist-hero-panel-text">Selecione o responsável pela execução.</p>
                </div>
              </div>

              <div>
                <label className="cf-field-label cf-checklist-hero-label">Nome ou matrícula</label>
                <input
                  value={operadorQuery}
                  onChange={(e) => {
                    invalidateSignature();
                    setOperadorQuery(e.target.value);
                    setOperadorId("");
                  }}
                  placeholder="Digite para buscar"
                  autoComplete="off"
                  className={`cf-mobile-input cf-checklist-hero-input ${operadorId ? "selected" : ""}`}
                />

                {operadorId ? (
                  <div className="cf-checklist-inline-row">
                    <span className="cf-checklist-selection-ok">Operador selecionado</span>
                    <button
                      type="button"
                      className="cf-mobile-inline-link cf-checklist-hero-link"
                      onClick={() => {
                        invalidateSignature();
                        setOperadorId("");
                        setOperadorQuery("");
                        setSugestoesOperador([]);
                      }}
                    >
                      Trocar operador
                    </button>
                  </div>
                ) : null}

                {hasOperatorSearch && loadingOperador ? (
                  <div className="cf-mobile-helper cf-checklist-hero-helper">Buscando operadores...</div>
                ) : null}

                {hasOperatorSearch && !loadingOperador && sugestoesOperador.length > 0 ? (
                  <div className="cf-checklist-suggestions">
                    {sugestoesOperador.map((operador) => (
                      <button
                        key={operador.id}
                        type="button"
                        className="cf-checklist-suggestion"
                        onClick={() => {
                          invalidateSignature();
                          setOperadorId(operador.id);
                          setOperadorQuery(`${operador.nome} (${operador.matricula})`);
                          setSugestoesOperador([]);
                        }}
                      >
                        <strong>{operador.nome}</strong>
                        <span>{operador.matricula}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {hasOperatorSearch && !loadingOperador && sugestoesOperador.length === 0 ? (
                  <div className="cf-mobile-helper cf-checklist-hero-helper">Nenhum operador encontrado.</div>
                ) : null}
              </div>
            </section>

            <section className="cf-checklist-hero-panel">
              <div className="cf-checklist-hero-panel-head">
                <div className="cf-checklist-hero-panel-icon">
                  <NotesIconLight />
                </div>

                <div className="cf-checklist-section-copy">
                  <h2 className="cf-checklist-hero-panel-title">Observações gerais</h2>
                  <p className="cf-checklist-hero-panel-text">Registre detalhes adicionais antes da assinatura.</p>
                </div>
              </div>

              <div>
                <label className="cf-field-label cf-checklist-hero-label">Observações</label>
                <textarea
                  rows={4}
                  value={obsGerais}
                  onChange={(e) => {
                    invalidateSignature();
                    setObsGerais(e.target.value);
                  }}
                  placeholder="Digite observações adicionais"
                  className="cf-mobile-textarea cf-checklist-hero-input cf-checklist-hero-textarea"
                />
              </div>
            </section>
          </div>
        </section>

        <section className="cf-checklist-workspace">
          <section className="cf-checklist-items">
            <div className="cf-checklist-items-head">
              <div>
                <h2 className="cf-checklist-section-title">Itens do checklist</h2>
                <p className="cf-checklist-section-text">Marque cada item antes de seguir para a assinatura.</p>
              </div>
              <span className="cf-count">{templates.length}</span>
            </div>

            <div className="cf-checklist-items-grid">
              {templates.map((template) => {
                const current = itens[template.id]?.status ?? "NaoVerificado";

                return (
                  <article key={template.id} className="cf-checklist-item">
                    <div className="cf-checklist-item-top">
                      <div className="cf-checklist-item-heading">
                        <div className="cf-checklist-item-order">{template.ordem}</div>
                        <h3 className="cf-checklist-item-title">{template.descricao}</h3>
                      </div>

                      {template.instrucao ? (
                        <p className="cf-checklist-item-text">{template.instrucao}</p>
                      ) : null}
                    </div>

                    <div className="cf-checklist-status-grid">
                      <button
                        type="button"
                        className={`cf-checklist-status ${current === "OK" ? "is-ok" : ""}`}
                        onClick={() => setStatus(template.id, "OK")}
                      >
                        OK
                      </button>

                      <button
                        type="button"
                        className={`cf-checklist-status ${current === "NOK" ? "is-nok" : ""}`}
                        onClick={() => setStatus(template.id, "NOK")}
                      >
                        NOK
                      </button>

                      <button
                        type="button"
                        className={`cf-checklist-status ${current === "NA" ? "is-na" : ""}`}
                        onClick={() => setStatus(template.id, "NA")}
                      >
                        N/A
                      </button>
                    </div>

                    {current === "NOK" ? (
                      <div className="cf-checklist-item-note">
                        <label className="cf-field-label">Observação do item</label>
                        <input
                          value={itens[template.id]?.observacao ?? ""}
                          onChange={(e) => setObs(template.id, e.target.value)}
                          placeholder="Descreva a não conformidade"
                          className="cf-mobile-input"
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          {error ? <div className="cf-alert cf-alert-error">{error}</div> : null}

          {!signatureStepOpen ? (
            <button
              type="button"
              className="cf-button cf-button-primary cf-checklist-primary-action"
              onClick={abrirAssinatura}
              disabled={!canOpenSignature}
            >
              <span className="cf-mobile-button-icon">
                <SignatureMiniIcon />
              </span>
              Assinar checklist
            </button>
          ) : (
            <section className="cf-checklist-section cf-checklist-signature-section">
              <div className="cf-checklist-section-head">
                <div className="cf-checklist-section-icon">
                  <SignatureIcon />
                </div>

                <div>
                  <h2 className="cf-checklist-section-title">Assinatura do operador</h2>
                  <p className="cf-checklist-section-text">A assinatura habilita o envio do checklist.</p>
                </div>
              </div>

              <div className="cf-checklist-signature-shell">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="#1F2937"
                  onEnd={() => capturarAssinatura()}
                  canvasProps={{
                    width: 800,
                    height: 180,
                    style: {
                      width: "100%",
                      height: 180,
                      display: "block",
                      borderRadius: 18,
                      background: "#FFFFFF",
                    },
                  }}
                />
              </div>

              {!assinaturaBase64 ? (
                <div className="cf-checklist-signature-note">Faça a assinatura para liberar o envio.</div>
              ) : null}

              <div className="cf-checklist-signature-actions">
                <button type="button" className="cf-button cf-button-secondary" onClick={limparAssinatura}>
                  Limpar assinatura
                </button>

                <button
                  type="button"
                  className="cf-button cf-button-primary"
                  onClick={() => void submit()}
                  disabled={!assinaturaBase64}
                >
                  <span className="cf-mobile-button-icon">
                    <ArrowRightIcon />
                  </span>
                  Enviar checklist
                </button>
              </div>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status >= 500) return fallback;

    try {
      const parsed = JSON.parse(error.body) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      if (error.body && error.body.length < 220) return error.body;
    }

    return error.message;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

function QrIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1.2" stroke="white" strokeWidth="2" />
      <rect x="15" y="3" width="6" height="6" rx="1.2" stroke="white" strokeWidth="2" />
      <rect x="3" y="15" width="6" height="6" rx="1.2" stroke="white" strokeWidth="2" />
      <path d="M15 15H18V18H15V15Z" fill="white" />
      <path d="M18 18H21V21H18V18Z" fill="white" />
      <path d="M18 12H21V15H18V12Z" fill="white" />
      <path d="M12 18H15V21H12V18Z" fill="white" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="#0057B8" strokeWidth="2" />
      <path d="M5 19C6.3 16.7 8.73 15.5 12 15.5C15.27 15.5 17.7 16.7 19 19" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UserIconLight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="white" strokeWidth="2" />
      <path d="M5 19C6.3 16.7 8.73 15.5 12 15.5C15.27 15.5 17.7 16.7 19 19" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="#0057B8" strokeWidth="2" />
      <path d="M9 9H15" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 13H15" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NotesIconLight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="white" strokeWidth="2" />
      <path d="M9 9H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 13H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SignatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16C6 13.5 7.2 13.5 8.5 16C9.3 17.4 10.2 17.4 11 16L13 12.5C13.8 11.1 14.7 11.1 15.5 12.5L16.5 14.3C17.3 15.7 18.2 15.7 19 14.3L20 12.5"
        stroke="#0057B8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20H20" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SignatureMiniIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16C6 13.5 7.2 13.5 8.5 16C9.3 17.4 10.2 17.4 11 16L13 12.5C13.8 11.1 14.7 11.1 15.5 12.5L16.5 14.3C17.3 15.7 18.2 15.7 19 14.3L20 12.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20H20" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.5L9.5 17L19 7.5" stroke="#1E7E34" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
