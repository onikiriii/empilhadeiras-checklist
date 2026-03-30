import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api";
import { getDefaultAdminPath, useAuth } from "../auth";
import type { AuthSession } from "../auth-storage";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [loginValue, setLoginValue] = useState("AdministradorCheckFlow");
  const [senha, setSenha] = useState("CheckFlow@2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await api.post<AuthSession>("/api/auth/login", {
        login: loginValue,
        senha,
      });

      login(session);
      navigate(
        session.supervisor.forceChangePassword ? "/primeiro-acesso" : (redirectTo || getDefaultAdminPath(session)),
        { replace: true },
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Login ou senha inválidos.");
      } else {
        setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <button type="button" className="cf-login-page-back" onClick={() => navigate("/")}>
        <ArrowLeftIcon />
        <span>Voltar</span>
      </button>

      <div className="cf-login-shell">
        <div className="cf-login-brand">
          <div className="cf-login-brand-row">
            <div className="cf-login-logo">
              <QrIcon />
            </div>
            <div>
              <h1 className="cf-login-brand-name">CheckFlow</h1>
              <div className="cf-login-brand-subtitle">Acesso administrativo</div>
            </div>
          </div>
        </div>

        <div className="cf-login-card">
          <form className="cf-form" onSubmit={handleSubmit}>
            <div>
              <label className="cf-field-label">Login</label>
              <input
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
                placeholder="NomeSobrenome"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="cf-field-label">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
            </div>

            {error ? <div className="cf-alert cf-alert-error">{error}</div> : null}

            <button className="cf-button cf-button-primary" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
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

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 6L5 12L11 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};
