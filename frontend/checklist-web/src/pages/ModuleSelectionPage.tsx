import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getDefaultAdminPath, useAuth } from "../auth";

const moduleCards = [
  {
    key: "supervisao-operacional",
    title: "Supervisao Operacional",
    subtitle: "Checklists operacionais, itens nao OK, templates, equipamentos e fechamento mensal.",
    href: "/admin/dashboard",
    color: "#0A6AD7",
  },
  {
    key: "seguranca-trabalho",
    title: "Segurança do Trabalho",
    subtitle: "",
    href: "/stp/dashboard",
    color: "#0F766E",
  },
  {
    key: "inspecao-materiais",
    title: "Inspeção de Materiais",
    subtitle: "",
    href: "/materiais/dashboard",
    color: "#175CD3",
  },
] as const;

export default function ModuleSelectionPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.supervisor.forceChangePassword) {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  if (session.supervisor.isMaster) {
    return <Navigate to={getDefaultAdminPath(session)} replace />;
  }

  const availableModules = moduleCards.filter((module) => session.supervisor.modulosDisponiveis.includes(module.key));

  if (availableModules.length <= 1) {
    return <Navigate to={getDefaultAdminPath(session)} replace />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.eyebrow}>Seleção de módulo</div>
          <h1 style={styles.title}>Escolha o ambiente de trabalho</h1>
          <p style={styles.subtitle}>
            Seu acesso foi autenticado. Agora selecione o módulo correspondente ao fluxo que deseja operar.
          </p>
        </div>

        <div style={styles.grid}>
          {availableModules.map((module) => (
            <button
              key={module.key}
              type="button"
              onClick={() => navigate(module.href)}
              style={{
                ...styles.card,
                borderColor: module.color,
              }}
            >
              <div style={{ ...styles.cardAccent, background: module.color }} />
              <div style={styles.cardBody}>
                <div style={styles.cardTitle}>{module.title}</div>
                <div style={styles.cardSubtitle}>{module.subtitle}</div>
              </div>
              <span style={styles.cardAction}>Entrar</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "linear-gradient(180deg, #EEF4FB 0%, #F8FAFC 100%)",
  },
  shell: {
    width: "100%",
    maxWidth: 980,
    display: "grid",
    gap: 28,
  },
  header: {
    display: "grid",
    gap: 10,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#0A6AD7",
  },
  title: {
    margin: 0,
    fontSize: 36,
    lineHeight: 1.1,
    color: "#0F172A",
  },
  subtitle: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.6,
    color: "#475467",
    maxWidth: 720,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },
  card: {
    position: "relative",
    borderRadius: 24,
    border: "1px solid #D0D5DD",
    background: "#FFFFFF",
    padding: 24,
    display: "grid",
    gap: 18,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
  },
  cardAccent: {
    width: 56,
    height: 6,
    borderRadius: 999,
  },
  cardBody: {
    display: "grid",
    gap: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#101828",
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 1.6,
    color: "#475467",
  },
  cardAction: {
    fontSize: 14,
    fontWeight: 800,
    color: "#101828",
  },
};
