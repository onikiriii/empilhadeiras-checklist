import React, { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../../api";
import type { StpAreaChecklistTemplateSummaryDto, StpAreaChecklistTemplateDetailDto, StpAreaChecklistResultado, StpAreaChecklistDetailDto } from "../../types";

type ItemForm = {
  templateItemId: string;
  resultado: StpAreaChecklistResultado;
  observacao: string;
};

export default function StpChecklistCreatePage() {
  const navigate = useNavigate();
  const inspetorSignatureRef = useRef<SignatureCanvas | null>(null);
  const responsavelSignatureRef = useRef<SignatureCanvas | null>(null);

  const [templates, setTemplates] = useState<StpAreaChecklistTemplateSummaryDto[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [template, setTemplate] = useState<StpAreaChecklistTemplateDetailDto | null>(null);
  const [itens, setItens] = useState<Record<string, ItemForm>>({});
  const [responsavelPresenteNome, setResponsavelPresenteNome] = useState("");
  const [responsavelPresenteCargo, setResponsavelPresenteCargo] = useState("");
  const [comportamentosPreventivosObservados, setComportamentosPreventivosObservados] = useState("");
  const [atosInsegurosObservados, setAtosInsegurosObservados] = useState("");
  const [condicoesInsegurasConstatadas, setCondicoesInsegurasConstatadas] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allAnswered = useMemo(() => {
    if (!template) return false;
    return template.itens.every((item) => !!itens[item.id]);
  }, [itens, template]);

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      setLoading(true);
      setError("");
      try {
        const loaded = await api.get<StpAreaChecklistTemplateSummaryDto[]>("/api/stp/templates");
        if (!active) return;

        setTemplates(loaded);
        setSelectedTemplateId(loaded[0]?.id ?? "");
      } catch (err) {
        if (active) setError(extractError(err, "Erro ao carregar templates STP."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTemplates();
    return () => {
      active = false;
    };
  }, []);

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
        const initialItems: Record<string, ItemForm> = {};
        for (const item of detail.itens) {
          initialItems[item.id] = {
            templateItemId: item.id,
            resultado: "Check",
            observacao: "",
          };
        }
        setItens(initialItems);
      } catch (err) {
        if (active) setError(extractError(err, "Erro ao carregar o template selecionado."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTemplate();
    return () => {
      active = false;
    };
  }, [selectedTemplateId]);

  function setResultado(templateItemId: string, resultado: StpAreaChecklistResultado) {
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
    setItens((current) => ({
      ...current,
      [templateItemId]: {
        ...current[templateItemId],
        templateItemId,
        observacao,
      },
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!template) {
      setError("Selecione um template STP valido.");
      return;
    }

    const assinaturaInspetorBase64 = captureSignature(inspetorSignatureRef.current);
    const assinaturaResponsavelPresenteBase64 = captureSignature(responsavelSignatureRef.current);

    if (!assinaturaInspetorBase64 || !assinaturaResponsavelPresenteBase64) {
      setError("As duas assinaturas sao obrigatorias.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await api.post<StpAreaChecklistDetailDto>("/api/stp/checklists", {
        templateId: template.id,
        responsavelPresenteNome,
        responsavelPresenteCargo,
        comportamentosPreventivosObservados,
        atosInsegurosObservados,
        condicoesInsegurasConstatadas,
        assinaturaInspetorBase64,
        assinaturaResponsavelPresenteBase64,
        itens: template.itens.map((item) => ({
          templateItemId: item.id,
          resultado: itens[item.id]?.resultado ?? "OK",
          observacao: itens[item.id]?.resultado === "X" ? itens[item.id]?.observacao ?? "" : null,
        })),
      });

      navigate(`/stp/checklists/${created.id}`, { replace: true });
    } catch (err) {
      setError(extractError(err, "Erro ao salvar a inspecao STP."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.eyebrow}></div>
        <h1 style={styles.title}>Checklist de Área - STP</h1>
        <p style={styles.subtitle}>
        </p>
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <form onSubmit={handleSubmit} style={styles.formShell}>
        <section style={styles.card}>
          <div style={styles.sectionTitle}>Contexto da inspeçõo</div>
          <div style={styles.formGrid}>
            <Field label="Template">
              <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} style={styles.input}>
                <option value="">Selecione</option>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.codigo} - {item.nome}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Responsável presente">
              <input value={responsavelPresenteNome} onChange={(e) => setResponsavelPresenteNome(e.target.value)} style={styles.input} />
            </Field>

            <Field label="Cargo do responsável presente">
              <input value={responsavelPresenteCargo} onChange={(e) => setResponsavelPresenteCargo(e.target.value)} style={styles.input} />
            </Field>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>Itens do checklist</div>
          {loading ? (
            <div style={styles.emptyState}>Carregando template STP...</div>
          ) : !template ? (
            <div style={styles.emptyState}>Nenhum template STP disponível para este setor.</div>
          ) : (
            <div style={styles.itemsList}>
              {template.itens.map((item) => {
                const current = itens[item.id];
                return (
                  <article key={item.id} style={styles.itemCard}>
                    <div style={styles.itemHeader}>
                      <div style={styles.itemOrder}>{item.ordem}</div>
                      <div style={styles.itemCopy}>
                        <div style={styles.itemTitle}>{item.descricao}</div>
                        {item.instrucao ? <div style={styles.itemInstruction}>{item.instrucao}</div> : null}
                      </div>
                    </div>

                    <div style={styles.resultRow}>
                      <button
                        type="button"
                        onClick={() => setResultado(item.id, "Check")}
                        style={{
                          ...styles.choiceButton,
                          ...(current?.resultado === "Check" ? styles.choiceButtonActiveCheck : {}),
                        }}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setResultado(item.id, "X")}
                        style={{
                          ...styles.choiceButton,
                          ...(current?.resultado === "X" ? styles.choiceButtonActiveX : {}),
                        }}
                      >
                        N OK
                      </button>
                    </div>

                    {current?.resultado === "X" ? (
                      <div>
                        <label style={styles.label}>Observacao do item</label>
                        <textarea
                          value={current.observacao}
                          onChange={(e) => setObservacao(item.id, e.target.value)}
                          rows={3}
                          style={styles.textarea}
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>Observações livres</div>
          <div style={styles.textareaGrid}>
            <Field label="Comportamentos preventivos observados">
              <textarea value={comportamentosPreventivosObservados} onChange={(e) => setComportamentosPreventivosObservados(e.target.value)} rows={4} style={styles.textarea} />
            </Field>
            <Field label="Atos inseguros observados">
              <textarea value={atosInsegurosObservados} onChange={(e) => setAtosInsegurosObservados(e.target.value)} rows={4} style={styles.textarea} />
            </Field>
            <Field label="Condições inseguras constatadas">
              <textarea value={condicoesInsegurasConstatadas} onChange={(e) => setCondicoesInsegurasConstatadas(e.target.value)} rows={4} style={styles.textarea} />
            </Field>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionTitle}>Rubricas</div>
          <div style={styles.signatureGrid}>
            <SignatureBlock label="Rubrica do inspetor" signatureRef={inspetorSignatureRef} />
            <SignatureBlock label="Rubrica do responsável presente" signatureRef={responsavelSignatureRef} />
          </div>
        </section>

        <div style={styles.footer}>
          <button type="submit" disabled={submitting || !allAnswered || !template} style={styles.primaryButton}>
            {submitting ? "Salvando..." : "Salvar inspeção"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function SignatureBlock({
  label,
  signatureRef,
}: {
  label: string;
  signatureRef: React.RefObject<SignatureCanvas | null>;
}) {
  return (
    <div style={styles.signatureCard}>
      <div style={styles.signatureLabel}>{label}</div>
      <div style={styles.signatureFrame}>
        <SignatureCanvas
          ref={signatureRef}
          penColor="#101828"
          canvasProps={{
            width: 420,
            height: 180,
            style: { width: "100%", height: 180, borderRadius: 12 },
          }}
        />
      </div>
      <button type="button" onClick={() => signatureRef.current?.clear()} style={styles.secondaryButton}>
        Limpar
      </button>
    </div>
  );
}

function captureSignature(signatureCanvas: SignatureCanvas | null) {
  if (!signatureCanvas || signatureCanvas.isEmpty()) {
    return "";
  }

  return signatureCanvas.toDataURL("image/png");
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 20 },
  header: { display: "grid", gap: 10 },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0F766E" },
  title: { margin: 0, fontSize: 32, lineHeight: 1.08, color: "#052E2B" },
  subtitle: { margin: 0, fontSize: 15, lineHeight: 1.65, color: "#365314", maxWidth: 820 },
  errorBox: { border: "1px solid #F04438", background: "#FEF3F2", color: "#B42318", borderRadius: 14, padding: "12px 14px", fontSize: 14 },
  formShell: { display: "grid", gap: 18 },
  card: { background: "#FFFFFF", border: "1px solid #D0D5DD", borderRadius: 24, padding: 22, display: "grid", gap: 18 },
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#101828" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 },
  field: { display: "grid", gap: 8 },
  label: { fontSize: 13, fontWeight: 700, color: "#344054" },
  input: { width: "100%", boxSizing: "border-box", minHeight: 44, borderRadius: 12, border: "1px solid #D0D5DD", padding: "10px 12px", fontSize: 14, background: "#FFFFFF", color: "#101828" },
  textarea: { width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid #D0D5DD", padding: "12px 14px", fontSize: 14, lineHeight: 1.6, resize: "vertical", background: "#FFFFFF", color: "#101828" },
  emptyState: { fontSize: 14, color: "#667085" },
  itemsList: { display: "grid", gap: 14 },
  itemCard: { border: "1px solid #D0D5DD", borderRadius: 18, padding: 16, display: "grid", gap: 14, background: "#FCFCFD" },
  itemHeader: { display: "grid", gridTemplateColumns: "52px minmax(0, 1fr)", gap: 14, alignItems: "start" },
  itemOrder: { width: 52, height: 52, borderRadius: 16, background: "#ECFDF3", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 },
  itemCopy: { display: "grid", gap: 6 },
  itemTitle: { fontSize: 15, fontWeight: 700, lineHeight: 1.5, color: "#101828" },
  itemInstruction: { fontSize: 13, lineHeight: 1.6, color: "#667085" },
  resultRow: { display: "flex", gap: 10 },
  choiceButton: { minWidth: 90, minHeight: 38, borderRadius: 999, border: "1px solid #D0D5DD", background: "#FFFFFF", color: "#344054", fontWeight: 800, cursor: "pointer" },
  choiceButtonActiveCheck: { background: "#0F766E", color: "#FFFFFF", border: "1px solid #0F766E" },
  choiceButtonActiveX: { background: "#B42318", color: "#FFFFFF", border: "1px solid #B42318" },
  textareaGrid: { display: "grid", gap: 14 },
  signatureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  signatureCard: { border: "1px solid #D0D5DD", borderRadius: 18, padding: 16, display: "grid", gap: 12, background: "#FCFCFD" },
  signatureLabel: { fontSize: 14, fontWeight: 700, color: "#101828" },
  signatureFrame: { border: "1px dashed #98A2B3", borderRadius: 14, background: "#FFFFFF", overflow: "hidden" },
  secondaryButton: { width: "fit-content", border: "1px solid #D0D5DD", borderRadius: 10, background: "#FFFFFF", color: "#344054", fontWeight: 700, minHeight: 38, padding: "0 12px", cursor: "pointer" },
  footer: { display: "flex", justifyContent: "flex-end" },
  primaryButton: { border: "none", borderRadius: 12, minHeight: 46, padding: "0 18px", background: "#0F766E", color: "#FFFFFF", fontWeight: 800, cursor: "pointer" },
};
