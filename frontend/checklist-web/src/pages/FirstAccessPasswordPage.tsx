import React, { useState } from "react";
import { ApiError, api } from "../api";
import { useAuth } from "../auth";
import type { AuthSession } from "../auth-storage";

export default function FirstAccessPasswordPage() {
  const { session, login } = useAuth();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const updatedSession = await api.post<AuthSession>("/api/auth/definir-nova-senha", {
        novaSenha,
        confirmacaoSenha,
      });

      login(updatedSession);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body || err.message);
      } else {
        setError(err instanceof Error ? err.message : "Não foi possível atualizar a senha.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.eyebrow}>Primeiro acesso</div>
        <h1 style={styles.title}>Defina sua nova senha</h1>

        <div style={styles.infoBlock}>
          <div style={styles.infoLabel}>Login</div>
          <div style={styles.infoValue}>{session?.supervisor.login}</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Confirmar senha</label>
            <input
              type="password"
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              style={styles.input}
            />
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.primaryButton,
              ...(loading ? styles.primaryButtonDisabled : {}),
            }}
          >
            {loading ? "Salvando..." : "Atualizar senha e continuar"}
          </button>
        </form>
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
    background: "linear-gradient(180deg, #EEF4FB 0%, #F5F7FA 100%)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 28,
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(217,217,217,0.96)",
    boxShadow: "0 18px 42px rgba(16,24,40,0.08)",
    padding: 30,
  },
  eyebrow: {
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: 0.36,
    textTransform: "uppercase",
    color: "#0057B8",
  },
  title: {
    margin: "12px 0 0 0",
    fontSize: 30,
    lineHeight: 1.08,
    fontWeight: 700,
    color: "#1F2937",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14.5,
    lineHeight: 1.6,
    color: "#667085",
  },
  infoBlock: {
    marginTop: 18,
    borderRadius: 18,
    background: "#F8FAFC",
    border: "1px solid #E4E7EC",
    padding: 16,
  },
  infoLabel: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 700,
    color: "#1F2937",
  },
  form: {
    display: "grid",
    gap: 18,
    marginTop: 22,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#344054",
  },
  input: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    border: "1px solid #C9D2DC",
    background: "#FFFFFF",
    color: "#1F2937",
    fontSize: 15,
    padding: "0 16px",
    boxSizing: "border-box",
    outline: "none",
  },
  errorBox: {
    borderRadius: 16,
    border: "1px solid #F3C9C5",
    background: "#FFF4F2",
    color: "#912018",
    padding: "13px 14px",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.45,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    border: "none",
    background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)",
    color: "#FFFFFF",
    fontSize: 15.5,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(0,87,184,0.20)",
  },
  primaryButtonDisabled: {
    opacity: 0.62,
    cursor: "not-allowed",
    boxShadow: "none",
  },
};
