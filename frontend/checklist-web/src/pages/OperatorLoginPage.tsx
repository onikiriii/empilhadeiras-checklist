import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { operatorApi, OperatorApiError } from "../operator-api";
import { useOperatorAuth } from "../operator-auth";
import type { OperatorAuthSession } from "../operator-auth-storage";

export default function OperatorLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, login } = useOperatorAuth();
  const [form, setForm] = useState({ login: "", senha: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const nextSession = await operatorApi.post<OperatorAuthSession>("/api/operadores-auth/login", form);
      login(nextSession);

      const nextPath = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(extractError(err, "Nao foi possivel autenticar o operador."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.eyebrow}>Acesso operacional</div>
        <h1 style={styles.title}>Login do operador</h1>
        <p style={styles.subtitle}>
          Use seu login e senha para iniciar a inspecao do equipamento com rastreabilidade de auditoria.
        </p>

        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Login</label>
            <input
              value={form.login}
              onChange={(e) => setForm((current) => ({ ...current, login: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => setForm((current) => ({ ...current, senha: e.target.value }))}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={submitting} style={styles.primaryButton}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof OperatorApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
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
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(217,217,217,0.96)",
    boxShadow: "0 16px 40px rgba(16,24,40,0.08)",
    padding: 28,
    display: "grid",
    gap: 14,
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
    fontSize: 30,
    color: "#0F172A",
  },
  subtitle: {
    margin: 0,
    fontSize: 14.5,
    lineHeight: 1.6,
    color: "#475467",
  },
  errorBox: {
    border: "1px solid #F04438",
    background: "#FEF3F2",
    color: "#B42318",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
  },
  form: {
    display: "grid",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#344054",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid #D0D5DD",
    padding: "10px 12px",
    fontSize: 14,
    background: "#FFFFFF",
    color: "#101828",
  },
  primaryButton: {
    border: "none",
    borderRadius: 12,
    minHeight: 46,
    padding: "0 16px",
    background: "#0A6AD7",
    color: "#FFFFFF",
    fontWeight: 800,
    cursor: "pointer",
  },
};
