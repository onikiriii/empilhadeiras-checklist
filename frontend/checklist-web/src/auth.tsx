import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./api";
import {
  AUTH_UNAUTHORIZED_EVENT,
  type AuthSession,
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from "./auth-storage";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function getDefaultAdminPath(session: AuthSession | null | undefined) {
  return session?.supervisor.isMaster ? "/admin/setores" : "/admin/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession());
  const [isBootstrapping, setIsBootstrapping] = useState(() => !!getStoredAuthSession());

  useEffect(() => {
    const existingSession = getStoredAuthSession();

    if (!existingSession) {
      setIsBootstrapping(false);
      return;
    }

    api.get<AuthSession>("/api/auth/me")
      .then((freshSession) => {
        setStoredAuthSession(freshSession);
        setSession(freshSession);
      })
      .catch(() => {
        clearStoredAuthSession();
        setSession(null);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredAuthSession();
      setSession(null);
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    isAuthenticated: !!session,
    isBootstrapping,
    login(nextSession) {
      setStoredAuthSession(nextSession);
      setSession(nextSession);
    },
    logout() {
      clearStoredAuthSession();
      setSession(null);
    },
  }), [session, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  return context;
}

function FullscreenState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={stateStyles.page}>
      <div style={stateStyles.card}>
        <div style={stateStyles.title}>{title}</div>
        {subtitle ? <div style={stateStyles.subtitle}>{subtitle}</div> : null}
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { session, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullscreenState title="Validando acesso" subtitle="Conferindo a sessao do supervisor." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (session?.supervisor.forceChangePassword && location.pathname !== "/primeiro-acesso") {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  return <>{children}</>;
}

export function RequirePasswordChange({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullscreenState title="Preparando primeiro acesso" subtitle="Carregando o fluxo de troca de senha." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!session?.supervisor.forceChangePassword) {
    return <Navigate to={getDefaultAdminPath(session)} replace />;
  }

  return <>{children}</>;
}

export function RequireMaster({ children }: { children: React.ReactNode }) {
  const { session, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullscreenState title="Carregando estrutura" subtitle="Preparando o ambiente mestre." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.supervisor.forceChangePassword) {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  if (!session.supervisor.isMaster) {
    return <Navigate to={getDefaultAdminPath(session)} replace />;
  }

  return <>{children}</>;
}

export function RequireSectorSupervisor({ children }: { children: React.ReactNode }) {
  const { session, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullscreenState title="Carregando operacao" subtitle="Preparando o ambiente do setor." />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.supervisor.forceChangePassword) {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  if (session.supervisor.isMaster) {
    return <Navigate to={getDefaultAdminPath(session)} replace />;
  }

  return <>{children}</>;
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { session, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullscreenState title="Carregando acesso" subtitle="Preparando o ambiente do supervisor." />;
  }

  if (isAuthenticated) {
    return <Navigate to={session?.supervisor.forceChangePassword ? "/primeiro-acesso" : getDefaultAdminPath(session)} replace />;
  }

  return <>{children}</>;
}

const stateStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #EEF4FB 0%, #F5F7FA 100%)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    background: "rgba(255,255,255,0.94)",
    border: "1px solid rgba(217,217,217,0.96)",
    boxShadow: "0 16px 40px rgba(16,24,40,0.08)",
    padding: 28,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1F2937",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14.5,
    lineHeight: 1.5,
    color: "#667085",
  },
};
