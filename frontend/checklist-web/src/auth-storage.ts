export type AccessModule = "supervisao-operacional" | "seguranca-trabalho" | "inspecao-materiais";
export type UserAccessType = "Supervisor" | "Inspetor";

export type SupervisorSessionUser = {
  id: string;
  nome: string;
  sobrenome: string;
  nomeCompleto: string;
  login: string;
  email?: string | null;
  ramal?: string | null;
  setorId: string;
  setorNome: string;
  forceChangePassword: boolean;
  isMaster: boolean;
  tipoUsuario: UserAccessType;
  modulosDisponiveis: AccessModule[];
};

export type AuthSession = {
  accessToken: string;
  expiresAtUtc: string;
  supervisor: SupervisorSessionUser;
};

const STORAGE_KEY = "checkflow.auth.session";
export const AUTH_UNAUTHORIZED_EVENT = "checkflow:auth-unauthorized";

export function getStoredAuthSession(): AuthSession | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.expiresAtUtc || !parsed?.supervisor) {
      clearStoredAuthSession();
      return null;
    }

    if (new Date(parsed.expiresAtUtc).getTime() <= Date.now()) {
      clearStoredAuthSession();
      return null;
    }

    return parsed;
  } catch {
    clearStoredAuthSession();
    return null;
  }
}

export function setStoredAuthSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}
