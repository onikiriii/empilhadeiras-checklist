import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { operatorApi } from "./operator-api";
import {
  OPERATOR_AUTH_UNAUTHORIZED_EVENT,
  type OperatorAuthSession,
  clearStoredOperatorSession,
  getStoredOperatorSession,
  setStoredOperatorSession,
} from "./operator-auth-storage";

type OperatorAuthContextValue = {
  session: OperatorAuthSession | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (session: OperatorAuthSession) => void;
  logout: () => void;
};

const OperatorAuthContext = createContext<OperatorAuthContextValue | null>(null);

export function OperatorAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<OperatorAuthSession | null>(() => getStoredOperatorSession());
  const [isBootstrapping, setIsBootstrapping] = useState(() => !!getStoredOperatorSession());

  useEffect(() => {
    const existingSession = getStoredOperatorSession();

    if (!existingSession) {
      setIsBootstrapping(false);
      return;
    }

    operatorApi.get<OperatorAuthSession>("/api/operadores-auth/me")
      .then((freshSession) => {
        setStoredOperatorSession(freshSession);
        setSession(freshSession);
      })
      .catch(() => {
        clearStoredOperatorSession();
        setSession(null);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredOperatorSession();
      setSession(null);
    }

    window.addEventListener(OPERATOR_AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(OPERATOR_AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const value = useMemo<OperatorAuthContextValue>(() => ({
    session,
    isAuthenticated: !!session,
    isBootstrapping,
    login(nextSession) {
      setStoredOperatorSession(nextSession);
      setSession(nextSession);
    },
    logout() {
      clearStoredOperatorSession();
      setSession(null);
    },
  }), [session, isBootstrapping]);

  return <OperatorAuthContext.Provider value={value}>{children}</OperatorAuthContext.Provider>;
}

export function useOperatorAuth() {
  const context = useContext(OperatorAuthContext);
  if (!context) throw new Error("useOperatorAuth precisa ser usado dentro de OperatorAuthProvider.");
  return context;
}

export function RequireOperatorAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { session, isAuthenticated, isBootstrapping } = useOperatorAuth();

  if (isBootstrapping) {
    return <FullscreenState title="Validando operador" subtitle="Conferindo a sessao operacional." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/operador/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (session?.operador.forceChangePassword) {
    return <Navigate to="/operador/primeiro-acesso" replace />;
  }

  return <>{children}</>;
}

function FullscreenState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.title}>{title}</div>
        {subtitle ? <div style={styles.subtitle}>{subtitle}</div> : null}
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
