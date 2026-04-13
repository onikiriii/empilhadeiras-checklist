import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

type ChecklistItem = {
  id: string;
  templateId: string;
  ordem: number;
  descricao: string;
  instrucao: string;
  status: "OK" | "NOK" | "NA";
  observacao: string;
  imagemNokBase64?: string | null;
  imagemNokNomeArquivo?: string | null;
  imagemNokMimeType?: string | null;
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
  const [signatureSrc, setSignatureSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    api.get<ChecklistDetail>(`/api/checklists/${id}`)
      .then(setChecklist)
      .catch((e) => setError(e.message ?? "Erro ao carregar checklist"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const source = checklist?.assinaturaOperadorBase64;
    if (!source) {
      setSignatureSrc(null);
      return;
    }

    let cancelled = false;

    trimSignatureDataUrl(source)
      .then((trimmed) => {
        if (!cancelled) {
          setSignatureSrc(trimmed);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSignatureSrc(source);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [checklist?.assinaturaOperadorBase64]);

  const resumo = useMemo(() => {
    if (!checklist) {
      return { totalItens: 0, totalOk: 0, totalNok: 0, totalNa: 0 };
    }

    return {
      totalItens: checklist.itens.length,
      totalOk: checklist.itens.filter((item) => item.status === "OK").length,
      totalNok: checklist.itens.filter((item) => item.status === "NOK").length,
      totalNa: checklist.itens.filter((item) => item.status === "NA").length,
    };
  }, [checklist]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.feedbackCard}>Carregando checklist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.feedbackCard, ...styles.errorCard }}>{error}</div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.feedbackCard, ...styles.errorCard }}>Checklist nao encontrado.</div>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.commandBar} className="no-print">
            <div style={styles.commandBrand}>
              <div style={styles.commandBrandLogo}>
                <QrIcon />
              </div>
              <div>
                <div style={styles.commandBarEyebrow}>CheckFlow</div>
                <h1 style={styles.commandBarTitle}>Checklist concluido</h1>
              </div>
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

          <div ref={printAreaRef} className="print-area document-sheet" style={styles.documentShell}>
            <section style={styles.documentHeader}>
              <div style={styles.documentHeadingRow}>
                <div style={styles.documentBrandBlock}>
                  <div style={styles.documentHeaderLogo}>
                    <QrIcon />
                  </div>
                  <div>
                    <div style={styles.documentKicker}>CheckFlow</div>
                    <h2 style={styles.documentTitle}>Checklist concluido</h2>
                    <div style={styles.documentType}>{checklist.equipamentoCodigo}</div>
                  </div>
                </div>

                <div style={styles.documentIssuedBlock}>
                  <div style={styles.documentIssuedLabel}>Emitido em</div>
                  <div style={styles.documentIssuedValue}>{formatDateTime(checklist.dataRealizacao)}</div>
                </div>
              </div>
            </section>

            <section style={styles.documentSection}>
              <div style={styles.documentBand}>Dados gerais</div>
              <div
                style={{
                  ...styles.documentInfoGrid,
                  ...(checklist.assinaturaOperadorBase64 ? styles.documentInfoGridWithSignature : {}),
                }}
              >
                <div style={styles.documentInfoCell}>
                  <div style={styles.documentInfoLabel}>Equipamento</div>
                  <div style={styles.documentInfoValue}>{checklist.equipamentoCodigo}</div>
                </div>
                <div style={{ ...styles.documentInfoCell, ...styles.documentInfoCellNarrow }}>
                  <div style={styles.documentInfoLabel}>Operador</div>
                  <div style={styles.documentInfoValue}>{checklist.operadorNome}</div>
                </div>
                {checklist.assinaturaOperadorBase64 ? (
                  <div style={styles.documentInfoSignatureCell}>
                    <div style={styles.documentInfoSignatureLabel}>Rubrica</div>
                    <img
                      src={signatureSrc ?? checklist.assinaturaOperadorBase64}
                      alt="Assinatura do operador"
                      style={styles.documentInfoSignatureImage}
                    />
                  </div>
                ) : null}
                <div style={styles.documentInfoCell}>
                  <div style={styles.documentInfoLabel}>Data e hora</div>
                  <div style={styles.documentInfoValue}>{formatDateTime(checklist.dataRealizacao)}</div>
                </div>
                <div style={{ ...styles.documentInfoCell, ...styles.documentInfoCellNarrow }}>
                  <div style={styles.documentInfoLabel}>Status</div>
                  <div style={styles.documentInfoValue}>
                    {checklist.aprovado ? "Aprovado" : "Reprovado"} / {checklist.status}
                  </div>
                </div>
              </div>
            </section>

            <section style={styles.documentSection}>
              <div style={styles.documentBand}>Resumo</div>
              <div style={styles.documentSummaryGrid}>
                <div style={styles.documentSummaryCell}>
                  <span style={styles.documentSummaryLabel}>Itens OK</span>
                  <strong style={{ ...styles.documentSummaryValue, color: "#067647" }}>{resumo.totalOk}</strong>
                </div>

                <div style={styles.documentSummaryCell}>
                  <span style={styles.documentSummaryLabel}>Itens NOK</span>
                  <strong style={{ ...styles.documentSummaryValue, color: "#B42318" }}>{resumo.totalNok}</strong>
                </div>

                <div style={styles.documentSummaryCell}>
                  <span style={styles.documentSummaryLabel}>Itens N/A</span>
                  <strong style={{ ...styles.documentSummaryValue, color: "#1D4ED8" }}>{resumo.totalNa}</strong>
                </div>

                <div style={styles.documentSummaryCell}>
                  <span style={styles.documentSummaryLabel}>Total de itens</span>
                  <strong style={{ ...styles.documentSummaryValue, color: "#0F172A" }}>{resumo.totalItens}</strong>
                </div>
              </div>
            </section>

            {checklist.observacoesGerais ? (
              <section style={styles.documentSection}>
                <div style={styles.documentBand}>Observacoes gerais</div>
                <div style={styles.documentNotesBox}>{checklist.observacoesGerais}</div>
              </section>
            ) : null}

            <section style={styles.documentSection}>
              <div style={styles.documentBand}>Itens inspecionados</div>
              <div style={styles.documentTableMeta}>
                {resumo.totalItens} {resumo.totalItens === 1 ? "item listado" : "itens listados"}
              </div>

              <div style={styles.documentTableWrap}>
                <table style={styles.documentTable}>
                  <thead>
                    <tr>
                      <th style={styles.documentTableHeadCellSmall}>#</th>
                      <th style={styles.documentTableHeadCell}>Item verificado</th>
                      <th style={styles.documentTableHeadCellStatus}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist.itens.map((item, idx) => {
                      const statusStyle =
                        item.status === "OK"
                          ? styles.documentStatusCellOk
                          : item.status === "NOK"
                            ? styles.documentStatusCellNok
                            : styles.documentStatusCellNa;

                      return (
                        <tr key={item.id}>
                          <td style={styles.documentTableCellOrder}>{idx + 1}</td>
                          <td style={styles.documentTableCell}>
                            <div style={styles.documentItemTitle}>{item.descricao}</div>
                            {item.instrucao ? (
                              <div style={styles.documentItemInstruction}>
                                Instrucao: {item.instrucao}
                              </div>
                            ) : null}
                            {item.observacao ? (
                              <div style={styles.documentObservationBlock}>
                                <span style={styles.documentObservationText}>{item.observacao}</span>
                              </div>
                            ) : null}
                            {item.imagemNokBase64 ? (
                              <div style={styles.documentEvidenceBlock}>
                                <div style={styles.documentEvidenceLabel}>
                                  Evidencia visual{item.imagemNokNomeArquivo ? ` - ${item.imagemNokNomeArquivo}` : ""}
                                </div>
                                <img
                                  src={item.imagemNokBase64}
                                  alt={`Imagem do item ${item.ordem}`}
                                  style={styles.documentEvidenceImage}
                                />
                              </div>
                            ) : null}
                          </td>
                          <td style={styles.documentTableCellStatus}>
                            <span style={{ ...styles.documentStatusCell, ...statusStyle }}>
                              {item.status === "OK" ? "Conforme" : item.status === "NOK" ? "Nao conforme" : "N/A"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}

function trimSignatureDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;

      const context = canvas.getContext("2d");
      if (!context) {
        resolve(dataUrl);
        return;
      }

      context.drawImage(image, 0, 0);

      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      const whiteThreshold = 245;

      let top = height;
      let left = width;
      let right = -1;
      let bottom = -1;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const offset = (y * width + x) * 4;
          const alpha = data[offset + 3];
          const red = data[offset];
          const green = data[offset + 1];
          const blue = data[offset + 2];
          const isInkPixel =
            alpha > 0 && (red < whiteThreshold || green < whiteThreshold || blue < whiteThreshold);

          if (!isInkPixel) {
            continue;
          }

          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }

      if (right < left || bottom < top) {
        resolve(dataUrl);
        return;
      }

      const padding = 8;
      const cropLeft = Math.max(0, left - padding);
      const cropTop = Math.max(0, top - padding);
      const cropWidth = Math.min(width - cropLeft, right - left + 1 + padding * 2);
      const cropHeight = Math.min(height - cropTop, bottom - top + 1 + padding * 2);

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;

      const croppedContext = croppedCanvas.getContext("2d");
      if (!croppedContext) {
        resolve(dataUrl);
        return;
      }

      croppedContext.drawImage(
        canvas,
        cropLeft,
        cropTop,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      resolve(croppedCanvas.toDataURL("image/png"));
    };

    image.onerror = () => reject(new Error("Nao foi possivel processar a assinatura"));
    image.src = dataUrl;
  });
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

function QrIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

const printStyles = `
@media print {
  @page {
    size: A4 portrait;
    margin: 6mm;
  }

  html,
  body {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print {
    display: none !important;
  }

  .document-sheet {
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    width: 100% !important;
    max-width: none !important;
    min-height: auto !important;
    border-radius: 0 !important;
  }

  .print-area,
  .print-area * {
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .print-area section,
  .print-area table,
  .print-area tr,
  .print-area td,
  .print-area th {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    background: "#EEF2F6",
    padding: "24px 0 36px",
  },
  container: {
    width: "100%",
    maxWidth: 860,
    margin: "0 auto",
    padding: "0 28px",
  },
  commandBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
    flexWrap: "wrap",
    padding: "0 2px",
  },
  commandBrand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  commandBrandLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 20px rgba(0, 87, 184, 0.18)",
    flexShrink: 0,
  },
  commandBarEyebrow: {
    fontSize: 12,
    color: "#526071",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: 700,
    marginBottom: 4,
  },
  commandBarTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#1E293B",
    letterSpacing: -0.2,
  },
  commandBarText: {
    marginTop: 4,
    marginBottom: 0,
    color: "#64748B",
    fontSize: 13.5,
    fontWeight: 400,
  },
  headerActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  documentShell: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    borderRadius: 0,
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
    width: "100%",
    maxWidth: 794,
    margin: "0 auto",
  },
  documentHeader: {
    padding: "16px 18px 10px",
    borderBottom: "1px solid #CBD5E1",
  },
  documentHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  documentBrandBlock: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  documentHeaderLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "none",
  },
  documentKicker: {
    fontSize: 11,
    color: "#476C97",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    fontWeight: 700,
    marginBottom: 2,
  },
  documentType: {
    fontSize: 15,
    fontWeight: 500,
    color: "#334155",
  },
  documentTitle: {
    margin: "0 0 3px 0",
    fontSize: 22,
    fontWeight: 700,
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  documentIssuedBlock: {
    textAlign: "right",
    minWidth: 150,
  },
  documentIssuedLabel: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  documentIssuedValue: {
    marginTop: 4,
    fontSize: 12.5,
    color: "#0F172A",
    fontWeight: 600,
  },
  documentSection: {
    padding: "8px 18px 0",
  },
  documentBand: {
    background: "#88c4f1",
    border: "1px solid #88c4f1",
    borderBottom: "none",
    color: "#0F172A",
    fontSize: 11.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    padding: "6px 10px",
  },
  documentInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    border: "1px solid #CBD5E1",
    borderTop: "none",
  },
  documentInfoGridWithSignature: {
    gridTemplateColumns: "1.15fr 0.95fr 0.72fr",
  },
  documentInfoCell: {
    padding: "9px 10px 10px",
    borderRight: "1px solid #CBD5E1",
    borderBottom: "1px solid #CBD5E1",
    background: "#FFFFFF",
  },
  documentInfoCellNarrow: {
    paddingLeft: 9,
    paddingRight: 8,
  },
  documentInfoLabel: {
    fontSize: 10.5,
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  documentInfoValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: 600,
    lineHeight: 1.25,
  },
  documentInfoSignatureCell: {
    gridRow: "1 / span 2",
    gridColumn: 3,
    borderBottom: "1px solid #CBD5E1",
    background: "#FFFFFF",
    padding: "0",
    display: "flex",
    flexDirection: "column",
  },
  documentInfoSignatureLabel: {
    width: "100%",
    padding: "6px 8px",
    borderBottom: "1px solid #CBD5E1",
    fontSize: 10.5,
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    boxSizing: "border-box",
  },
  documentInfoSignatureImage: {
    display: "block",
    width: "100%",
    maxWidth: 170,
    maxHeight: 88,
    height: "auto",
    margin: "8px auto",
    objectFit: "contain",
    objectPosition: "center center",
  },
  documentSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    border: "1px solid #CBD5E1",
    borderTop: "none",
    background: "#FFFFFF",
  },
  documentSummaryCell: {
    padding: "9px 10px",
    borderRight: "1px solid #CBD5E1",
    display: "grid",
    gap: 3,
  },
  documentSummaryLabel: {
    fontSize: 10.5,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: 700,
  },
  documentSummaryValue: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
  },
  documentNotesBox: {
    padding: "10px 12px",
    border: "1px solid #CBD5E1",
    borderTop: "none",
    background: "#FFFFFF",
    fontSize: 12.5,
    lineHeight: 1.45,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  documentTableMeta: {
    border: "1px solid #CBD5E1",
    borderTop: "none",
    borderBottom: "none",
    padding: "6px 10px",
    background: "#F8FAFC",
    fontSize: 11,
    color: "#475569",
  },
  documentTableWrap: {
    border: "1px solid #CBD5E1",
    borderTop: "none",
    overflow: "hidden",
  },
  documentTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  documentTableHeadCellSmall: {
    width: 58,
    padding: "7px 8px",
    borderBottom: "1px solid #CBD5E1",
    background: "#F1F5F9",
    color: "#334155",
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  documentTableHeadCell: {
    padding: "7px 8px",
    borderBottom: "1px solid #CBD5E1",
    background: "#F1F5F9",
    color: "#334155",
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "left",
  },
  documentTableHeadCellStatus: {
    width: 156,
    padding: "7px 8px",
    borderBottom: "1px solid #CBD5E1",
    background: "#F1F5F9",
    color: "#334155",
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  documentTableCellOrder: {
    padding: "7px 8px",
    borderBottom: "1px solid #000000",
    fontSize: 11.5,
    color: "#334155",
    fontWeight: 700,
    verticalAlign: "top",
    textAlign: "center",
  },
  documentTableCell: {
    padding: "7px 8px",
    borderBottom: "1px solid #000000",
    fontSize: 12,
    color: "#334155",
    verticalAlign: "top",
  },
  documentTableCellStatus: {
    padding: "7px 8px",
    borderBottom: "1px solid #000000",
    textAlign: "center",
    verticalAlign: "top",
  },
  documentItemTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0F172A",
  },
  documentItemInstruction: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748B",
    lineHeight: 1.25,
  },
  documentStatusCell: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    padding: 0,
  },
  documentStatusCellOk: {
    color: "#067647",
  },
  documentStatusCellNok: {
    color: "#B42318",
  },
  documentStatusCellNa: {
    color: "#1D4ED8",
  },
  documentObservationText: {
    fontSize: 11.5,
    color: "#334155",
    lineHeight: 1.3,
  },
  documentObservationBlock: {
    marginTop: 4,
    display: "block",
  },
  documentEvidenceBlock: {
    marginTop: 8,
    display: "grid",
    gap: 6,
  },
  documentEvidenceLabel: {
    fontSize: 10.5,
    color: "#475569",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  documentEvidenceImage: {
    display: "block",
    width: "100%",
    maxWidth: 220,
    maxHeight: 180,
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid #CBD5E1",
    background: "#FFFFFF",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow: "0 12px 24px rgba(0, 87, 184, 0.18)",
  },
  secondaryButton: {
    background: "#FFFFFF",
    color: "#344054",
    border: "1px solid #D0D5DD",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackCard: {
    maxWidth: 620,
    margin: "80px auto",
    background: "#FFFFFF",
    border: "1px solid #D9D9D9",
    borderRadius: 16,
    padding: 24,
    textAlign: "center",
    fontWeight: 600,
    fontSize: 16,
    color: "#1F2937",
  },
  errorCard: {
    background: "#FFF1F0",
    border: "1px solid #F5C2C7",
    color: "#B42318",
  },
};
