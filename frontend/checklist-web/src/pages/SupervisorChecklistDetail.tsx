import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

type ChecklistItem = {
  id: string;
  templateId: string;
  ordem: number;
  descricao: string;
  instrucao: string;
  status: "OK" | "NOK" | "NA";
  observacao: string;
};

type ChecklistDetail = {
  id: string;
  equipamentoId: string;
  equipamentoCodigo: string;
  operadorId: string;
  operadorNome: string;
  dataRealizacao: string;
  aprovado: boolean;
  observacoesGerais: string;
  status: string;
  assinaturaOperadorBase64?: string | null;
  itens: ChecklistItem[];
};

export default function SupervisorChecklistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const [checklist, setChecklist] = useState<ChecklistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    api.get<ChecklistDetail>(`/api/checklists/${id}`)
      .then(setChecklist)
      .catch((e) => setError(e.message ?? "Erro ao carregar checklist"))
      .finally(() => setLoading(false));
  }, [id]);

  const resumo = useMemo(() => {
    if (!checklist) {
      return { totalItens: 0, totalOk: 0, totalNok: 0, totalNa: 0 };
    }

    const totalItens = checklist.itens.length;
    const totalOk = checklist.itens.filter((i) => i.status === "OK").length;
    const totalNok = checklist.itens.filter((i) => i.status === "NOK").length;
    const totalNa = checklist.itens.filter((i) => i.status === "NA").length;

    return { totalItens, totalOk, totalNok, totalNa };
  }, [checklist]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>Carregando checklist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>{error}</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>Checklist não encontrado.</div>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      <div style={styles.page}>
        <div style={styles.topBarBlue} className="no-print">
          <div style={styles.topBarBlueInner}>
            <div style={styles.brandBlock}>
              <div style={styles.logoSlot}>
                <QrIcon />
              </div>

              <div>
                <div style={styles.brandName}>CheckFlow</div>
                <div style={styles.brandSubtitle}>Relatório de checklist</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.container}>
          <div style={styles.headerRow} className="no-print">
            <div>
              <div style={styles.breadcrumb}>Dashboard / Checklists</div>
              <h1 style={styles.pageTitle}>Detalhes do checklist</h1>
              <p style={styles.pageSubtitle}>
                Visualização completa da inspeção realizada.
              </p>
            </div>

            <div style={styles.headerActions}>
              <button type="button" style={styles.secondaryButton} onClick={() => navigate(-1)}>
                Voltar
              </button>

              <button type="button" onClick={handlePrint} style={styles.primaryButton}>
                <span style={styles.buttonIcon}>
                  <PrintIcon />
                </span>
                Imprimir / Exportar PDF
              </button>
            </div>
          </div>

          <div ref={printAreaRef} className="print-area">
            <section style={styles.heroCard}>
              <div style={styles.heroHeader}>
                <div>
                  <div style={styles.sectionEyebrow}>Relatório</div>
                  <div style={styles.heroTitle}>{checklist.equipamentoCodigo}</div>
                  <div style={styles.heroSubtitle}>
                    Checklist operacional registrado no sistema
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      ...styles.statusPill,
                      ...(checklist.aprovado ? styles.statusPillSuccess : styles.statusPillDanger),
                    }}
                  >
                    {checklist.aprovado ? "Aprovado" : "Reprovado"}
                  </span>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <span style={styles.infoLabel}>Equipamento</span>
                  <strong style={styles.infoValue}>{checklist.equipamentoCodigo}</strong>
                </div>

                <div style={styles.infoCard}>
                  <span style={styles.infoLabel}>Operador</span>
                  <strong style={styles.infoValue}>{checklist.operadorNome}</strong>
                </div>

                <div style={styles.infoCard}>
                  <span style={styles.infoLabel}>Data / Hora</span>
                  <strong style={styles.infoValue}>
                    {new Date(checklist.dataRealizacao).toLocaleString("pt-BR")}
                  </strong>
                </div>

                <div style={styles.infoCard}>
                  <span style={styles.infoLabel}>Status do fluxo</span>
                  <strong style={styles.infoValue}>{checklist.status}</strong>
                </div>
              </div>

              {checklist.observacoesGerais ? (
                <div style={styles.generalNotesCard}>
                  <span style={styles.infoLabel}>Observações gerais</span>
                  <div style={styles.generalNotesText}>{checklist.observacoesGerais}</div>
                </div>
              ) : null}
            </section>

            <section style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricNumberOk}>{resumo.totalOk}</div>
                <div style={styles.metricLabel}>Itens OK</div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricNumberNok}>{resumo.totalNok}</div>
                <div style={styles.metricLabel}>Itens NOK</div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricNumberNa}>{resumo.totalNa}</div>
                <div style={styles.metricLabel}>Itens N/A</div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricNumberTotal}>{resumo.totalItens}</div>
                <div style={styles.metricLabel}>Total de itens</div>
              </div>
            </section>

            {checklist.assinaturaOperadorBase64 ? (
              <section style={styles.sectionCard}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionHeaderLeft}>
                    <div style={styles.sectionIconBox}>
                      <SignatureIcon />
                    </div>
                    <div>
                      <h2 style={styles.sectionTitle}>Assinatura do operador</h2>
                      <p style={styles.sectionSubtitle}>
                        Rúbrica registrada no envio do checklist
                      </p>
                    </div>
                  </div>
                </div>

                <div style={styles.signatureCard}>
                  <img
                    src={checklist.assinaturaOperadorBase64}
                    alt="Assinatura do operador"
                    style={styles.signatureImage}
                  />
                </div>
              </section>
            ) : null}

            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionHeaderLeft}>
                  <div style={styles.sectionIconBox}>
                    <ChecklistIcon />
                  </div>
                  <div>
                    <h2 style={styles.sectionTitle}>Itens do checklist</h2>
                    <p style={styles.sectionSubtitle}>
                      {resumo.totalItens} {resumo.totalItens === 1 ? "item listado" : "itens listados"}
                    </p>
                  </div>
                </div>
              </div>

              <div style={styles.itemsWrap}>
                {checklist.itens.map((item, idx) => {
                  const isOk = item.status === "OK";
                  const isNok = item.status === "NOK";
                  const isNa = item.status === "NA";

                  return (
                    <div
                      key={item.id}
                      style={{
                        ...styles.itemCard,
                        ...(isOk
                          ? styles.itemCardOk
                          : isNok
                          ? styles.itemCardNok
                          : styles.itemCardNa),
                      }}
                    >
                      <div style={styles.itemTopRow}>
                        <div style={styles.itemOrder}>{idx + 1}</div>

                        <div style={{ flex: 1 }}>
                          <h3 style={styles.itemTitle}>{item.descricao}</h3>

                          {item.instrucao ? (
                            <p style={styles.itemText}>
                              <span style={styles.itemTextStrong}>Instrução:</span> {item.instrucao}
                            </p>
                          ) : null}

                          {item.observacao ? (
                            <p style={styles.itemText}>
                              <span style={styles.itemTextStrong}>Observação:</span> {item.observacao}
                            </p>
                          ) : null}
                        </div>

                        <div
                          style={{
                            ...styles.statusBadge,
                            ...(isOk
                              ? styles.statusBadgeOk
                              : isNok
                              ? styles.statusBadgeNok
                              : styles.statusBadgeNa),
                          }}
                        >
                          {isOk ? "✓ OK" : isNok ? "✗ NOK" : "– N/A"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
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

function PrintIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 8V4H17V8"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="6" y="14" width="12" height="6" rx="1.5" stroke="white" strokeWidth="2" />
      <rect x="4" y="8" width="16" height="8" rx="2" stroke="white" strokeWidth="2" />
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

function ChecklistIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="#0057B8" strokeWidth="2" />
      <path d="M9 9H15" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 13H15" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 17H13" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const printStyles = `
@media print {
  body {
    background: white !important;
  }

  .no-print {
    display: none !important;
  }

  .print-area {
    width: 100% !important;
  }

  .print-area * {
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .print-area img {
    max-width: 100% !important;
  }

  .print-area div,
  .print-area section,
  .print-area article {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    background: "linear-gradient(180deg, #E9F0F7 0%, #EEF3F8 42%, #F5F7FA 100%)",
    paddingBottom: 36,
  },
  topBarBlue: {
    width: "100%",
    background: "linear-gradient(90deg, #0057B8 0%, #0A6AD7 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 14px 30px rgba(0,87,184,0.18)",
    marginBottom: 24,
  },
  topBarBlueInner: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: "16px 28px",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  logoSlot: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
    flexShrink: 0,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#FFFFFF",
    lineHeight: 1.1,
  },
  brandSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.82)",
    marginTop: 4,
    fontWeight: 400,
  },
  container: {
    width: "100%",
    maxWidth: 1320,
    margin: "0 auto",
    padding: "0 28px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  breadcrumb: {
    fontSize: 12,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 600,
    marginBottom: 6,
  },
  pageTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    color: "#1F2937",
  },
  pageSubtitle: {
    marginTop: 6,
    marginBottom: 0,
    color: "#667085",
    fontSize: 14.5,
    fontWeight: 400,
  },
  headerActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  heroCard: {
    background: "#FFFFFF",
    border: "1px solid #DEE7F1",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 30px rgba(16,24,40,0.07)",
    marginBottom: 20,
  },
  heroHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  sectionEyebrow: {
    fontSize: 12,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: 600,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1F2937",
    lineHeight: 1.15,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#667085",
    fontWeight: 400,
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 112,
    padding: "8px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
  },
  statusPillSuccess: {
    background: "#EAF8EE",
    color: "#1E7E34",
    border: "1px solid #B7E1C0",
  },
  statusPillDanger: {
    background: "#FFF1F0",
    color: "#B42318",
    border: "1px solid #F2B8B5",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  infoCard: {
    background: "#F8FBFE",
    border: "1px solid #E3EBF5",
    borderRadius: 16,
    padding: 16,
  },
  infoLabel: {
    display: "block",
    fontSize: 12,
    color: "#667085",
    marginBottom: 6,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 15,
    color: "#1F2937",
    wordBreak: "break-word",
    fontWeight: 600,
  },
  generalNotesCard: {
    marginTop: 16,
    background: "#F8FBFE",
    border: "1px solid #E3EBF5",
    borderRadius: 16,
    padding: 16,
  },
  generalNotesText: {
    fontSize: 15,
    color: "#475467",
    lineHeight: 1.6,
    fontWeight: 400,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
    marginBottom: 20,
  },
  metricCard: {
    background: "#FFFFFF",
    border: "1px solid #DEE7F1",
    borderRadius: 20,
    padding: 18,
    textAlign: "center",
    boxShadow: "0 10px 24px rgba(16,24,40,0.06)",
  },
  metricNumberOk: {
    fontSize: 30,
    fontWeight: 700,
    color: "#1E7E34",
    lineHeight: 1,
  },
  metricNumberNok: {
    fontSize: 30,
    fontWeight: 700,
    color: "#B42318",
    lineHeight: 1,
  },
  metricNumberNa: {
    fontSize: 30,
    fontWeight: 700,
    color: "#1D4ED8",
    lineHeight: 1,
  },
  metricNumberTotal: {
    fontSize: 30,
    fontWeight: 700,
    color: "#0057B8",
    lineHeight: 1,
  },
  metricLabel: {
    marginTop: 8,
    fontSize: 13,
    color: "#667085",
    fontWeight: 500,
  },
  sectionCard: {
    background: "#FFFFFF",
    border: "1px solid #DEE7F1",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 10px 24px rgba(16,24,40,0.06)",
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  sectionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#EAF2FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#1F2937",
  },
  sectionSubtitle: {
    margin: "4px 0 0 0",
    fontSize: 13.5,
    color: "#667085",
    fontWeight: 400,
  },
  signatureCard: {
    background: "#FFFFFF",
    border: "1px solid #E4E7EC",
    borderRadius: 18,
    padding: 16,
  },
  signatureImage: {
    display: "block",
    maxWidth: "100%",
    width: 420,
    height: 180,
    objectFit: "contain",
    background: "#FFFFFF",
  },
  itemsWrap: {
    display: "grid",
    gap: 14,
  },
  itemCard: {
    borderRadius: 20,
    padding: 18,
    background: "#FFFFFF",
    boxShadow: "0 8px 20px rgba(16,24,40,0.05)",
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  itemCardOk: {
    border: "1px solid #D4E9D8",
    background: "#F8FCF9",
  },
  itemCardNok: {
    border: "1px solid #F3D1CE",
    background: "#FFF9F8",
  },
  itemCardNa: {
    border: "1px solid #D7E5FB",
    background: "#F8FBFF",
  },
  itemTopRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },
  itemOrder: {
    minWidth: 38,
    height: 38,
    borderRadius: 12,
    background: "#EAF2FF",
    color: "#0057B8",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    flexShrink: 0,
  },
  itemTitle: {
    margin: 0,
    color: "#1F2937",
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  itemText: {
    marginTop: 8,
    marginBottom: 0,
    color: "#475467",
    fontSize: 14,
    lineHeight: 1.55,
    fontWeight: 400,
  },
  itemTextStrong: {
    fontWeight: 600,
    color: "#344054",
  },
  statusBadge: {
    minWidth: 92,
    borderRadius: 14,
    padding: "10px 12px",
    textAlign: "center",
    fontSize: 13.5,
    fontWeight: 700,
    flexShrink: 0,
  },
  statusBadgeOk: {
    background: "#EAF8EE",
    border: "1px solid #34A853",
    color: "#1E7E34",
  },
  statusBadgeNok: {
    background: "#FFF1F0",
    border: "1px solid #D93025",
    color: "#B42318",
  },
  statusBadgeNa: {
    background: "#EFF6FF",
    border: "1px solid #3B82F6",
    color: "#1D4ED8",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 16,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(0,87,184,0.22)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondaryButton: {
    background: "#FFFFFF",
    color: "#344054",
    border: "1px solid #D0D5DD",
    borderRadius: 16,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    maxWidth: 520,
    margin: "80px auto",
    background: "#FFFFFF",
    border: "1px solid #D9D9D9",
    borderRadius: 20,
    padding: 24,
    textAlign: "center",
    fontWeight: 600,
    fontSize: 16,
    color: "#1F2937",
  },
  errorCard: {
    maxWidth: 620,
    margin: "80px auto",
    background: "#FFF1F0",
    border: "1px solid #F5C2C7",
    borderRadius: 20,
    padding: 24,
    color: "#B42318",
    fontWeight: 600,
    fontSize: 15,
  },
};