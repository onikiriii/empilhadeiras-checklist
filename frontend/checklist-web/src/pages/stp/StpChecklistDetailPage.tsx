import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api } from "../../api";
import type { StpAreaChecklistDetailDto } from "../../types";

export default function StpChecklistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [checklist, setChecklist] = useState<StpAreaChecklistDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api.get<StpAreaChecklistDetailDto>(`/api/stp/checklists/${id}`);
        if (active) setChecklist(data);
      } catch (err) {
        if (active) setError(extractError(err, "Erro ao carregar a inspecao STP."));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div style={styles.emptyState}>Carregando inspecao STP...</div>;
  }

  if (!checklist) {
    return <div style={styles.emptyState}>{error || "Inspecao nao encontrada."}</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>{checklist.templateCodigo}</div>
          <h1 style={styles.title}>{checklist.templateNome}</h1>
          <p style={styles.subtitle}>
            Inspecao realizada em {new Date(checklist.dataRealizacao).toLocaleString("pt-BR")} por {checklist.inspetorNomeCompleto}.
          </p>
        </div>
        <Link to="/stp/checklists" style={styles.backButton}>
          Voltar ao historico
        </Link>
      </div>

      {error ? <div style={styles.errorBox}>{error}</div> : null}

      <section style={styles.card}>
        <div style={styles.metaGrid}>
          <Meta label="Responsavel presente" value={checklist.responsavelPresenteNome} />
          <Meta label="Cargo" value={checklist.responsavelPresenteCargo || "-"} />
          <Meta label="Inspetor" value={checklist.inspetorNomeCompleto} />
          <Meta label="Data" value={new Date(checklist.dataRealizacao).toLocaleString("pt-BR")} />
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionTitle}>Itens avaliados</div>
        <div style={styles.itemsList}>
          {checklist.itens.map((item) => (
            <article key={item.id} style={styles.itemCard}>
              <div style={styles.itemHeader}>
                <div style={styles.itemOrder}>{item.ordem}</div>
                <div style={styles.itemContent}>
                  <div style={styles.itemTitle}>{item.descricao}</div>
                  {item.instrucao ? <div style={styles.itemInstruction}>{item.instrucao}</div> : null}
                </div>
                <div style={item.resultado === "Check" ? styles.resultCheck : styles.resultX}>{item.resultado}</div>
              </div>
              {item.observacao ? (
                <div style={styles.itemObservation}>
                  <div style={styles.itemObservationLabel}>Observacao</div>
                  <div style={styles.itemObservationText}>{item.observacao}</div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionTitle}>Observacoes livres</div>
        <div style={styles.notesGrid}>
          <NoteBlock title="Comportamentos preventivos observados" value={checklist.comportamentosPreventivosObservados} />
          <NoteBlock title="Atos inseguros observados" value={checklist.atosInsegurosObservados} />
          <NoteBlock title="Condicoes inseguras constatadas" value={checklist.condicoesInsegurasConstatadas} />
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.sectionTitle}>Rubricas</div>
        <div style={styles.signaturesGrid}>
          <SignatureView title="Rubrica do inspetor" image={checklist.assinaturaInspetorBase64} />
          <SignatureView title="Rubrica do responsavel presente" image={checklist.assinaturaResponsavelPresenteBase64} />
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metaCard}>
      <div style={styles.metaLabel}>{label}</div>
      <div style={styles.metaValue}>{value}</div>
    </div>
  );
}

function NoteBlock({ title, value }: { title: string; value?: string | null }) {
  return (
    <div style={styles.noteBlock}>
      <div style={styles.noteTitle}>{title}</div>
      <div style={styles.noteText}>{value || "Sem registro."}</div>
    </div>
  );
}

function SignatureView({ title, image }: { title: string; image: string }) {
  return (
    <div style={styles.signatureCard}>
      <div style={styles.noteTitle}>{title}</div>
      <div style={styles.signatureFrame}>
        <img src={image} alt={title} style={styles.signatureImage} />
      </div>
    </div>
  );
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18 },
  header: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" },
  eyebrow: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0F766E" },
  title: { margin: "6px 0 0 0", fontSize: 30, color: "#052E2B" },
  subtitle: { margin: "10px 0 0 0", fontSize: 15, lineHeight: 1.65, color: "#365314", maxWidth: 820 },
  backButton: { textDecoration: "none", border: "1px solid #D0D5DD", borderRadius: 12, minHeight: 42, padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#344054", fontWeight: 700, background: "#FFFFFF" },
  errorBox: { border: "1px solid #F04438", background: "#FEF3F2", color: "#B42318", borderRadius: 14, padding: "12px 14px", fontSize: 14 },
  emptyState: { padding: 24, color: "#667085", fontSize: 14 },
  card: { background: "#FFFFFF", border: "1px solid #D0D5DD", borderRadius: 24, padding: 22, display: "grid", gap: 18 },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 },
  metaCard: { border: "1px solid #D0D5DD", borderRadius: 16, padding: 16, background: "#F8FAFC", display: "grid", gap: 6 },
  metaLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#667085" },
  metaValue: { fontSize: 15, fontWeight: 700, color: "#101828" },
  sectionTitle: { fontSize: 18, fontWeight: 800, color: "#101828" },
  itemsList: { display: "grid", gap: 14 },
  itemCard: { border: "1px solid #D0D5DD", borderRadius: 18, padding: 16, background: "#FCFCFD", display: "grid", gap: 12 },
  itemHeader: { display: "grid", gridTemplateColumns: "52px minmax(0,1fr) auto", gap: 14, alignItems: "start" },
  itemOrder: { width: 52, height: 52, borderRadius: 16, background: "#ECFDF3", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 },
  itemContent: { display: "grid", gap: 6 },
  itemTitle: { fontSize: 15, fontWeight: 700, color: "#101828", lineHeight: 1.5 },
  itemInstruction: { fontSize: 13, color: "#667085", lineHeight: 1.6 },
  resultCheck: { minWidth: 64, height: 34, borderRadius: 999, background: "#ECFDF3", color: "#027A48", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, padding: "0 12px" },
  resultX: { minWidth: 64, height: 34, borderRadius: 999, background: "#FEF3F2", color: "#B42318", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, padding: "0 12px" },
  itemObservation: { borderTop: "1px solid #EAECF0", paddingTop: 12, display: "grid", gap: 6 },
  itemObservationLabel: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#667085" },
  itemObservationText: { fontSize: 14, lineHeight: 1.6, color: "#344054" },
  notesGrid: { display: "grid", gap: 14 },
  noteBlock: { border: "1px solid #D0D5DD", borderRadius: 16, padding: 16, background: "#F8FAFC", display: "grid", gap: 8 },
  noteTitle: { fontSize: 14, fontWeight: 800, color: "#101828" },
  noteText: { fontSize: 14, lineHeight: 1.7, color: "#475467", whiteSpace: "pre-wrap" },
  signaturesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  signatureCard: { display: "grid", gap: 12 },
  signatureFrame: { border: "1px solid #D0D5DD", borderRadius: 14, background: "#FFFFFF", overflow: "hidden", minHeight: 180 },
  signatureImage: { display: "block", width: "100%", height: 180, objectFit: "contain" },
};
