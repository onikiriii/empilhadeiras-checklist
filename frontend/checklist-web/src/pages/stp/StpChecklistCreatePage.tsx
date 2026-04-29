import React, { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../../api";
import "../../styles/global.css";
import type {
  StpAreaChecklistDetailDto,
  StpAreaChecklistResultado,
  StpAreaChecklistTemplateDetailDto,
  StpAreaChecklistTemplateSummaryDto,
  StpAreaInspecaoDto,
} from "../../types";

type ItemForm = {
  templateItemId: string;
  resultado: StpAreaChecklistResultado;
  observacao: string;
};

export default function StpChecklistCreatePage() {
  const navigate = useNavigate();
  const { areaId: routeAreaId } = useParams();
  const [searchParams] = useSearchParams();
  const inspetorSignatureRef = useRef<SignatureCanvas | null>(null);
  const responsavelSignatureRef = useRef<SignatureCanvas | null>(null);

  const [templates, setTemplates] = useState<StpAreaChecklistTemplateSummaryDto[]>([]);
  const [areas, setAreas] = useState<StpAreaInspecaoDto[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [template, setTemplate] = useState<StpAreaChecklistTemplateDetailDto | null>(null);
  const [itens, setItens] = useState<Record<string, ItemForm>>({});
  const [comportamentosPreventivosObservados, setComportamentosPreventivosObservados] = useState("");
  const [atosInsegurosObservados, setAtosInsegurosObservados] = useState("");
  const [condicoesInsegurasConstatadas, setCondicoesInsegurasConstatadas] = useState("");
  const [signatureStepOpen, setSignatureStepOpen] = useState(false);
  const [inspetorAssinaturaBase64, setInspetorAssinaturaBase64] = useState("");
  const [responsavelAssinaturaBase64, setResponsavelAssinaturaBase64] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<StpAreaChecklistDetailDto | null>(null);

  const activeAreas = useMemo(() => areas.filter((area) => area.ativa), [areas]);
  const areaLocked = !!routeAreaId;

  const selectedArea = useMemo(
    () => activeAreas.find((area) => area.id === selectedAreaId) ?? null,
    [activeAreas, selectedAreaId],
  );

  const allAnswered = useMemo(() => {
    if (!template) return false;
    return template.itens.every((item) => !!itens[item.id]);
  }, [itens, template]);

  const canOpenSignature = !!template && !!selectedAreaId && allAnswered;

  useEffect(() => {
    let active = true;

    async function loadContext() {
      setLoading(true);
      setError("");
      try {
        const [loadedTemplates, loadedAreas] = await Promise.all([
          api.get<StpAreaChecklistTemplateSummaryDto[]>("/api/stp/templates"),
          api.get<StpAreaInspecaoDto[]>("/api/stp/areas"),
        ]);

        if (!active) return;

        const requestedAreaId = routeAreaId ?? searchParams.get("areaId");
        const loadedActiveAreas = loadedAreas.filter((area) => area.ativa);
        const initialAreaId =
          (requestedAreaId && loadedActiveAreas.some((area) => area.id === requestedAreaId) ? requestedAreaId : null) ??
          loadedActiveAreas[0]?.id ??
          "";

        setTemplates(loadedTemplates);
        setAreas(loadedAreas);
        setSelectedTemplateId(loadedTemplates[0]?.id ?? "");
        setSelectedAreaId(initialAreaId);
      } catch (err) {
        if (active) setError(extractError(err, "Erro ao carregar o contexto da inspecao STP."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadContext();
    return () => {
      active = false;
    };
  }, [routeAreaId, searchParams]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplate(null);
      setItens({});
      return;
    }

    let active = true;

    async function loadTemplate() {
      setLoading(true);
      setError("");
      try {
        const detail = await api.get<StpAreaChecklistTemplateDetailDto>(`/api/stp/templates/${selectedTemplateId}`);
        if (!active) return;

        setTemplate(detail);
        setItens({});
      } catch (err) {
        if (active) setError(extractError(err, "Erro ao carregar o template STP selecionado."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTemplate();
    return () => {
      active = false;
    };
  }, [selectedTemplateId]);

  useEffect(() => {
    if (canOpenSignature) return;
    clearAllSignatures();
    setSignatureStepOpen(false);
  }, [canOpenSignature]);

  function invalidateSignatureStep() {
    clearAllSignatures();
    setSignatureStepOpen(false);
  }

  function clearAllSignatures() {
    inspetorSignatureRef.current?.clear();
    responsavelSignatureRef.current?.clear();
    setInspetorAssinaturaBase64("");
    setResponsavelAssinaturaBase64("");
  }

  function setResultado(templateItemId: string, resultado: StpAreaChecklistResultado) {
    invalidateSignatureStep();
    setItens((current) => ({
      ...current,
      [templateItemId]: {
        ...current[templateItemId],
        templateItemId,
        resultado,
        observacao: resultado === "X" ? current[templateItemId]?.observacao ?? "" : "",
      },
    }));
  }

  function setObservacao(templateItemId: string, observacao: string) {
    invalidateSignatureStep();
    setItens((current) => ({
      ...current,
      [templateItemId]: {
        ...current[templateItemId],
        templateItemId,
        observacao,
      },
    }));
  }

  function captureSignature(signatureCanvas: SignatureCanvas | null) {
    if (!signatureCanvas || signatureCanvas.isEmpty()) {
      return "";
    }

    return signatureCanvas.getCanvas().toDataURL("image/png");
  }

  function openSignatureStep() {
    if (!template) {
      setError("Selecione um template valido antes de continuar.");
      return;
    }

    if (!selectedAreaId) {
      setError("Selecione a area de inspecao antes de continuar.");
      return;
    }

    if (!allAnswered) {
      setError("Conclua todos os itens antes de abrir as rubricas.");
      return;
    }

    setError("");
    setSignatureStepOpen(true);
    clearAllSignatures();
  }

  async function handleSubmit() {
    if (!template) {
      setError("Selecione um template STP valido.");
      return;
    }

    const assinaturaInspetorBase64 = captureSignature(inspetorSignatureRef.current);
    const assinaturaResponsavelPresenteBase64 = captureSignature(responsavelSignatureRef.current);

    setInspetorAssinaturaBase64(assinaturaInspetorBase64);
    setResponsavelAssinaturaBase64(assinaturaResponsavelPresenteBase64);

    if (!selectedAreaId) {
      setError("Selecione a area de inspecao.");
      return;
    }

    const itemXSemObservacao = template.itens.find((item) => {
      const current = itens[item.id];
      return current?.resultado === "X" && !current.observacao.trim();
    });

    if (itemXSemObservacao) {
      setError(`O item ${itemXSemObservacao.ordem} exige observacao quando marcado com X.`);
      return;
    }

    if (!assinaturaInspetorBase64 || !assinaturaResponsavelPresenteBase64) {
      setError("As duas rubricas sao obrigatorias.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await api.post<StpAreaChecklistDetailDto>("/api/stp/checklists", {
        templateId: template.id,
        areaInspecaoId: selectedAreaId,
        comportamentosPreventivosObservados: comportamentosPreventivosObservados || null,
        atosInsegurosObservados: atosInsegurosObservados || null,
        condicoesInsegurasConstatadas: condicoesInsegurasConstatadas || null,
        assinaturaInspetorBase64,
        assinaturaResponsavelPresenteBase64,
        itens: template.itens.map((item) => ({
          templateItemId: item.id,
          resultado: itens[item.id]?.resultado ?? "Check",
          observacao: itens[item.id]?.resultado === "X" ? itens[item.id]?.observacao ?? "" : null,
        })),
      });

      setResult(created);
      window.setTimeout(() => {
        navigate(`/stp/checklists/${created.id}`, { replace: true });
      }, 1200);
    } catch (err) {
      setError(extractError(err, "Erro ao salvar a inspecao STP."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !template && templates.length === 0) {
    return (
    <div className="cf-mobile-page cf-mobile-page-stp">
      <div className="cf-checklist-shell">
        <div className="cf-loading cf-surface cf-surface-padded">Carregando inspecao STP...</div>
      </div>
      </div>
    );
  }

  if (error && !template && templates.length === 0) {
    return (
    <div className="cf-mobile-page cf-mobile-page-stp">
      <div className="cf-checklist-shell">
        <div className="cf-alert cf-alert-error">{error}</div>
      </div>
      </div>
    );
  }

  if (result) {
    return (
    <div className="cf-mobile-page cf-mobile-page-stp">
      <div className="cf-checklist-shell cf-checklist-shell-stp">
        <section className="cf-mobile-success">
            <div className="cf-mobile-success-icon">
              <CheckIcon />
            </div>
            <h1 className="cf-mobile-success-title">Inspecao registrada</h1>
            <p className="cf-mobile-success-text">
              Area inspecionada <strong>{result.areaInspecaoNome}</strong>
            </p>
            <p className="cf-mobile-success-meta">{new Date(result.dataRealizacao).toLocaleString("pt-BR")}</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="cf-mobile-page cf-mobile-page-stp">
      <div className="cf-mobile-backdrop cf-mobile-backdrop-top" />
      <div className="cf-mobile-backdrop cf-mobile-backdrop-bottom" />

      <div className="cf-checklist-shell cf-checklist-shell-stp">
        <section className="cf-checklist-hero">
          <div className="cf-checklist-hero-top">
            <div className="cf-checklist-brand">
              <div className="cf-mobile-logo">
                <ShieldIcon />
              </div>

              <div>
                <div className="cf-mobile-brand-name">CheckFlow</div>
                <div className="cf-checklist-brand-meta">Inspecao de area STP</div>
              </div>
            </div>

            <button type="button" className="cf-button cf-button-secondary cf-checklist-back-button" onClick={() => navigate(-1)}>
              Voltar
            </button>
          </div>

          <div className="cf-checklist-hero-copy">
            <h1 className="cf-checklist-title">Nova inspecao de area</h1>
            <p className="cf-checklist-subtitle">
              Tela separada para campo, no mesmo fluxo operacional do checklist de equipamentos.
            </p>
          </div>

          {selectedArea ? (
            <div className="cf-checklist-equipment-grid">
              <div className="cf-checklist-equipment-card">
                <span className="cf-checklist-equipment-label">Area</span>
                <strong className="cf-checklist-equipment-value">{selectedArea.nome}</strong>
              </div>
              <div className="cf-checklist-equipment-card">
                <span className="cf-checklist-equipment-label">Responsavel</span>
                <strong className="cf-checklist-equipment-value">{selectedArea.responsavelSupervisorNomeCompleto}</strong>
              </div>
              <div className="cf-checklist-equipment-card cf-checklist-equipment-card-wide">
                <span className="cf-checklist-equipment-label">Template</span>
                <strong className="cf-checklist-equipment-value">
                  {template ? `${template.codigo} - ${template.nome}` : "Selecione um template"}
                </strong>
              </div>
            </div>
          ) : null}

          <div className="cf-checklist-hero-form">
            <section className="cf-checklist-hero-panel">
              <div className="cf-checklist-hero-panel-head">
                <div className="cf-checklist-hero-panel-icon">
                  <ClipboardIcon />
                </div>

                <div className="cf-checklist-section-copy">
                  <h2 className="cf-checklist-hero-panel-title">Contexto da inspecao</h2>
                  <p className="cf-checklist-hero-panel-text">Defina o template e a area cadastrada que sera inspecionada.</p>
                </div>
              </div>

              <HeroField label="Template">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    invalidateSignatureStep();
                    setSelectedTemplateId(e.target.value);
                  }}
                  className="cf-checklist-hero-input"
                >
                  <option value="">Selecione</option>
                  {templates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} - {item.nome}
                    </option>
                  ))}
                </select>
              </HeroField>

              <HeroField label="Area de inspecao">
                <select
                  value={selectedAreaId}
                  onChange={(e) => {
                    invalidateSignatureStep();
                    setSelectedAreaId(e.target.value);
                  }}
                  disabled={areaLocked}
                  className="cf-checklist-hero-input"
                >
                  <option value="">Selecione a area</option>
                  {activeAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nome}
                    </option>
                  ))}
                </select>
              </HeroField>
            </section>

            <section className="cf-checklist-hero-panel">
              <div className="cf-checklist-hero-panel-head">
                <div className="cf-checklist-hero-panel-icon">
                  <UserIconLight />
                </div>

                <div className="cf-checklist-section-copy">
                  <h2 className="cf-checklist-hero-panel-title">Responsavel da area</h2>
                  <p className="cf-checklist-hero-panel-text">Esse supervisor vem direto do cadastro da area.</p>
                </div>
              </div>

              <HeroField label="Supervisor responsavel">
                <input
                  value={selectedArea?.responsavelSupervisorNomeCompleto ?? ""}
                  readOnly
                  placeholder="Selecione uma area para preencher"
                  className="cf-checklist-hero-input"
                />
              </HeroField>

              <HeroField label="Origem do vinculo">
                <input
                  value={selectedArea ? "Supervisor vinculado no cadastro da area" : ""}
                  readOnly
                  placeholder="O responsavel sera definido pela area cadastrada"
                  className="cf-checklist-hero-input"
                />
              </HeroField>
            </section>
          </div>
        </section>

        <section className="cf-checklist-workspace">
          <section className="cf-checklist-items">
            <div className="cf-checklist-items-head">
              <div>
                <h2 className="cf-checklist-section-title">Itens da inspecao</h2>
                <p className="cf-checklist-section-text">Marque cada item em campo antes de seguir para as rubricas.</p>
              </div>
              <span className="cf-count">{template?.itens.length ?? 0}</span>
            </div>

            {!template ? (
              <div className="cf-empty">Nenhum template STP disponivel para este inspetor.</div>
            ) : (
              <div className="cf-checklist-items-grid">
                {template.itens.map((item) => {
                  const current = itens[item.id];

                  return (
                    <article key={item.id} className="cf-checklist-item">
                      <div className="cf-checklist-item-top">
                        <div className="cf-checklist-item-heading">
                          <div className="cf-checklist-item-order">{item.ordem}</div>
                          <h3 className="cf-checklist-item-title">{item.descricao}</h3>
                        </div>

                        {item.instrucao ? <p className="cf-checklist-item-text">{item.instrucao}</p> : null}
                      </div>

                      <div style={styles.statusGridTwo}>
                        <button
                          type="button"
                          className={`cf-checklist-status ${current?.resultado === "Check" ? "is-ok" : ""}`}
                          onClick={() => setResultado(item.id, "Check")}
                        >
                          OK
                        </button>

                        <button
                          type="button"
                          className={`cf-checklist-status ${current?.resultado === "X" ? "is-nok" : ""}`}
                          onClick={() => setResultado(item.id, "X")}
                        >
                          N OK
                        </button>
                      </div>

                      {current?.resultado === "X" ? (
                        <div className="cf-checklist-item-note">
                          <label className="cf-field-label">Observacao do item</label>
                          <textarea
                            rows={3}
                            value={current.observacao}
                            onChange={(e) => setObservacao(item.id, e.target.value)}
                            placeholder="Descreva a condicao encontrada"
                            className="cf-mobile-textarea"
                          />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="cf-checklist-section">
            <div className="cf-checklist-section-head">
              <div className="cf-checklist-section-icon">
                <NotesIcon />
              </div>

              <div>
                <h2 className="cf-checklist-section-title">Observacoes livres</h2>
                <p className="cf-checklist-section-text">Registre os apontamentos abertos da inspecao.</p>
              </div>
            </div>

            <div style={styles.stack}>
              <FreeTextField
                label="Comportamentos preventivos observados"
                value={comportamentosPreventivosObservados}
                onChange={(value) => {
                  invalidateSignatureStep();
                  setComportamentosPreventivosObservados(value);
                }}
                placeholder="Descreva os comportamentos preventivos observados"
              />

              <FreeTextField
                label="Atos inseguros observados"
                value={atosInsegurosObservados}
                onChange={(value) => {
                  invalidateSignatureStep();
                  setAtosInsegurosObservados(value);
                }}
                placeholder="Descreva os atos inseguros observados"
              />

              <FreeTextField
                label="Condicoes inseguras constatadas"
                value={condicoesInsegurasConstatadas}
                onChange={(value) => {
                  invalidateSignatureStep();
                  setCondicoesInsegurasConstatadas(value);
                }}
                placeholder="Descreva as condicoes inseguras constatadas"
              />
            </div>
          </section>

          {error ? <div className="cf-alert cf-alert-error">{error}</div> : null}

          {!signatureStepOpen ? (
            <button
              type="button"
              className="cf-button cf-button-primary cf-checklist-primary-action"
              onClick={openSignatureStep}
              disabled={!canOpenSignature || !template}
            >
              <span className="cf-mobile-button-icon">
                <SignatureMiniIcon />
              </span>
              Abrir rubricas
            </button>
          ) : (
            <section className="cf-checklist-section cf-checklist-signature-section">
              <div className="cf-checklist-section-head">
                <div className="cf-checklist-section-icon">
                  <SignatureIcon />
                </div>

                <div>
                  <h2 className="cf-checklist-section-title">Rubricas da inspecao</h2>
                  <p className="cf-checklist-section-text">Coleta de rubrica do inspetor e do supervisor responsavel pela area.</p>
                </div>
              </div>

              <SignatureBlock
                label="Rubrica do inspetor"
                signatureRef={inspetorSignatureRef}
                hasSignature={!!inspetorAssinaturaBase64}
                onSigned={setInspetorAssinaturaBase64}
              />

              <SignatureBlock
                label="Rubrica do responsavel da area"
                signatureRef={responsavelSignatureRef}
                hasSignature={!!responsavelAssinaturaBase64}
                onSigned={setResponsavelAssinaturaBase64}
              />

              <div className="cf-checklist-signature-actions">
                <button type="button" className="cf-button cf-button-secondary" onClick={clearAllSignatures}>
                  Limpar rubricas
                </button>

                <button
                  type="button"
                  className="cf-button cf-button-primary"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                >
                  <span className="cf-mobile-button-icon">
                    <ArrowRightIcon />
                  </span>
                  {submitting ? "Salvando..." : "Salvar inspecao"}
                </button>
              </div>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}

function HeroField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="cf-field-label cf-checklist-hero-label">{label}</label>
      {children}
    </div>
  );
}

function FreeTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="cf-field-label">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="cf-mobile-textarea"
      />
    </div>
  );
}

function SignatureBlock({
  label,
  signatureRef,
  hasSignature,
  onSigned,
}: {
  label: string;
  signatureRef: React.RefObject<SignatureCanvas | null>;
  hasSignature: boolean;
  onSigned: (value: string) => void;
}) {
  return (
    <div style={styles.signatureBlock}>
      <div style={styles.signatureHeader}>
        <div style={styles.signatureTitle}>{label}</div>
        <div style={hasSignature ? styles.signatureOk : styles.signaturePending}>{hasSignature ? "Capturada" : "Pendente"}</div>
      </div>

      <div className="cf-checklist-signature-shell">
        <SignatureCanvas
          ref={signatureRef}
          penColor="#1F2937"
          onEnd={() => onSigned(signatureRef.current?.isEmpty() ? "" : signatureRef.current?.getCanvas().toDataURL("image/png") ?? "")}
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
    </div>
  );
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L19 6V11C19 15.5 16.2 19.5 12 21C7.8 19.5 5 15.5 5 11V6L12 3Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 11.5L11.2 13.2L14.8 9.6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="12" height="16" rx="2.5" stroke="white" strokeWidth="2" />
      <path d="M9 4.5H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 14H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
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
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="#067647" strokeWidth="2" />
      <path d="M9 9H15" stroke="#067647" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 13H15" stroke="#067647" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SignatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16C6 13.5 7.2 13.5 8.5 16C9.3 17.4 10.2 17.4 11 16L13 12.5C13.8 11.1 14.7 11.1 15.5 12.5L16.5 14.3C17.3 15.7 18.2 15.7 19 14.3L20 12.5"
        stroke="#067647"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 20H20" stroke="#067647" strokeWidth="2" strokeLinecap="round" />
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

const styles: Record<string, React.CSSProperties> = {
  statusGridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 2,
  },
  stack: {
    display: "grid",
    gap: 12,
  },
  signatureBlock: {
    display: "grid",
    gap: 10,
  },
  signatureHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#101828",
  },
  signatureOk: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 12px",
    borderRadius: 999,
    background: "#EEF8F2",
    color: "#116032",
    border: "1px solid #CDE8D6",
    fontSize: 12.5,
    fontWeight: 800,
  },
  signaturePending: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 12px",
    borderRadius: 999,
    background: "#FFF7E8",
    color: "#B54708",
    border: "1px solid #F7D29A",
    fontSize: 12.5,
    fontWeight: 800,
  },
};
