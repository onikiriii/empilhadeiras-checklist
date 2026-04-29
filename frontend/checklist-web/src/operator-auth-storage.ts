export type OperatorSessionUser = {
  id: string;
  nome: string;
  matricula: string;
  setorId: string;
  setorNome: string;
  forceChangePassword: boolean;
};

export type OperatorAuthSession = {
  accessToken: string;
  expiresAtUtc: string;
  operador: OperatorSessionUser;
};

const STORAGE_KEY = "checkflow.operator.auth.session";
export const OPERATOR_AUTH_UNAUTHORIZED_EVENT = "checkflow:operator-auth-unauthorized";

export function getStoredOperatorSession(): OperatorAuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OperatorAuthSession;
    if (!parsed?.accessToken || !parsed?.expiresAtUtc || !parsed?.operador) {
      clearStoredOperatorSession();
      return null;
    }

    if (new Date(parsed.expiresAtUtc).getTime() <= Date.now()) {
      clearStoredOperatorSession();
      return null;
    }

    return parsed;
  } catch {
    clearStoredOperatorSession();
    return null;
  }
}

export function setStoredOperatorSession(session: OperatorAuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredOperatorSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
