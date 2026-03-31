import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth";
import "../../styles/global.css";

const supervisorMenuItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { path: "/admin/checklists", label: "Checklists", icon: <ChecklistIcon /> },
  { path: "/admin/categorias", label: "Categorias", icon: <FolderIcon /> },
  { path: "/admin/templates", label: "Templates", icon: <TemplateIcon /> },
  { path: "/admin/operadores", label: "Operadores", icon: <WorkerIcon /> },
  { path: "/admin/equipamentos", label: "Equipamentos", icon: <EquipmentIcon /> },
];

const masterMenuItems = [
  { path: "/admin/setores", label: "Setores", icon: <LayersIcon /> },
  { path: "/admin/supervisores", label: "Supervisores", icon: <ShieldIcon /> },
];

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Visão Geral",
  "/admin/checklists": "Checklists",
  "/admin/categorias": "Categorias",
  "/admin/templates": "Templates",
  "/admin/operadores": "Operadores",
  "/admin/equipamentos": "Equipamentos",
  "/admin/setores": "",
  "/admin/supervisores": "Supervisores",
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [sidebarTextVisible, setSidebarTextVisible] = useState(true);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { session, logout } = useAuth();

  const isMaster = !!session?.supervisor.isMaster;
  const menuItems = isMaster ? masterMenuItems : supervisorMenuItems;
  const currentTitle = pageTitles[location.pathname] || "Painel Administrativo";
  const userInitial = useMemo(() => session?.supervisor.nome?.trim()?.charAt(0)?.toUpperCase() || "C", [session]);
  const scopeLabel = isMaster ? "CheckFlow" : (session?.supervisor.setorNome ?? "Setor");
  const userScope = isMaster ? "Admin" : (session?.supervisor.setorNome ?? "Setor");

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      window.addEventListener("mousedown", handleOutsideClick);
      return () => window.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      setUserMenuVisible(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setUserMenuVisible(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [menuOpen]);

  useEffect(() => {
    if (collapsed) {
      setSidebarTextVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setSidebarTextVisible(true);
    }, 160);

    return () => window.clearTimeout(timer);
  }, [collapsed]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    window.location.replace("/login");
  }

  return (
    <div style={styles.wrapper}>
      <aside
        style={{
          ...styles.sidebar,
          width: collapsed ? 78 : 252,
        }}
      >
        <div
          style={{
            ...styles.logoArea,
            padding: collapsed ? "22px 12px" : "22px 20px",
          }}
        >
          <div style={styles.logoBox}>
            <QrIcon />
          </div>

          <div
            style={{
              ...styles.logoCopy,
              ...(!sidebarTextVisible ? styles.logoCopyCollapsed : {}),
            }}
          >
            <div style={styles.logoTitle}>CheckFlow</div>
            <div style={styles.logoSubtitle}>{isMaster ? "admin" : "Painel por setor"}</div>
          </div>
        </div>

        <div
          style={{
            ...styles.scopeCardWrap,
            ...(collapsed ? styles.scopeCardWrapCollapsed : {}),
          }}
        >
          <div
            style={{
              ...styles.scopeCard,
              ...(collapsed ? styles.scopeCardCollapsed : {}),
            }}
          >
            <div style={styles.scopeLabel}>{isMaster ? "Modo de acesso" : "Setor ativo"}</div>
            <div style={styles.scopeTitle}>{userScope}</div>
            {isMaster ? <div style={styles.scopeMeta}>Setores, acessos e estrutura.</div> : null}
          </div>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              className="cf-admin-nav-item"
              to={item.path}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(collapsed ? styles.navItemCollapsed : {}),
                ...(isActive ? styles.navItemActive : {}),
              })}
              title={collapsed ? item.label : undefined}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span
                style={{
                  ...styles.navText,
                  ...(!sidebarTextVisible ? styles.navTextCollapsed : {}),
                }}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={styles.toggleButton}
            type="button"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
      </aside>

      <main
        style={{
          ...styles.main,
          marginLeft: collapsed ? 78 : 252,
        }}
      >
        <header style={styles.topbar}>
          <div style={styles.topbarCard}>
            <div style={styles.topbarContext}>
              <div style={styles.topbarLabel}>{scopeLabel}</div>
              <div style={styles.topbarTitle}>{currentTitle}</div>
            </div>

            <div style={styles.topbarRight} ref={menuRef}>
              <div style={styles.datePill}>
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              <div style={styles.avatarCluster}>
              <button
                type="button"
                style={{
                  ...styles.avatarButton,
                  ...(menuOpen ? styles.avatarButtonActive : {}),
                }}
                onClick={() => setMenuOpen((current) => !current)}
                aria-label="Abrir menu do usuário"
              >
                <div style={styles.avatar}>{userInitial}</div>
              </button>

              {userMenuVisible ? (
                <div
                  style={{
                    ...styles.userMenu,
                    ...(menuOpen ? styles.userMenuOpen : styles.userMenuClosed),
                  }}
                >
                  <div style={styles.userMenuConnector} />
                  <div style={styles.userMenuHeader}>
                    <div style={styles.userMenuName}>{session?.supervisor.nomeCompleto}</div>
                    <div style={styles.userMenuMeta}>{session?.supervisor.login}</div>
                  </div>

                  <div style={styles.userMenuInfo}>
                    <div style={styles.userMenuRow}>
                      <span style={styles.userMenuLabel}>Perfil</span>
                      <span style={styles.userMenuValue}>{isMaster ? "Master" : "Supervisor"}</span>
                    </div>
                    <div style={styles.userMenuRow}>
                      <span style={styles.userMenuLabel}>Escopo</span>
                      <span style={styles.userMenuValue}>{userScope}</span>
                    </div>
                  </div>

                  <button onClick={handleLogout} type="button" style={styles.userMenuLogout}>
                    Sair
                  </button>
                </div>
              ) : null}
              </div>
            </div>
          </div>
        </header>

        <div style={styles.pageContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function QrIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7C3 5.9 3.9 5 5 5H9L11 7H19C20.1 7 21 7.9 21 9V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WorkerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 19C6.3 16.7 8.73 15.5 12 15.5C15.27 15.5 17.7 16.7 19 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EquipmentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 16V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L19 6V11.4C19 15.6 16.3 19.4 12 21C7.7 19.4 5 15.6 5 11.4V6L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9.5 12L11.2 13.7L14.8 10.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4L20 8L12 12L4 8L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 12L12 16L4 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 16L12 20L4 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#F5F7FA",
  },
  sidebar: {
    background: "linear-gradient(180deg, #0057B8 0%, #044A98 100%)",
    color: "white",
    transition: "width 360ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms ease",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    height: "100vh",
    zIndex: 100,
    boxShadow: "8px 0 24px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  logoArea: {
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    display: "flex",
    alignItems: "center",
    gap: 12,
    minHeight: 88,
    position: "relative",
    transition: "padding 360ms cubic-bezier(0.22, 1, 0.36, 1), gap 280ms ease",
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "rgba(255,255,255,0.14)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  logoCopy: {
    position: "absolute",
    left: 76,
    right: 20,
    top: "50%",
    opacity: 1,
    transform: "translateY(-50%) translateX(0)",
    transition: "opacity 180ms ease, transform 240ms ease",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logoCopyCollapsed: {
    opacity: 0,
    transform: "translateY(-50%) translateX(-8px)",
    pointerEvents: "none",
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  logoSubtitle: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.78,
    fontWeight: 400,
  },
  scopeCardWrap: {
    padding: "14px 14px 0 14px",
    overflow: "hidden",
    transition: "padding 320ms cubic-bezier(0.22, 1, 0.36, 1), max-height 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease",
    maxHeight: 148,
    opacity: 1,
  },
  scopeCardWrapCollapsed: {
    padding: "0 14px",
    maxHeight: 0,
    opacity: 0,
  },
  scopeCard: {
    borderRadius: 18,
    padding: 16,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
    transform: "translateY(0)",
    transition: "transform 280ms ease, opacity 180ms ease",
  },
  scopeCardCollapsed: {
    transform: "translateY(-10px)",
    opacity: 0,
  },
  scopeLabel: {
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: 0.36,
    color: "rgba(255,255,255,0.72)",
    fontWeight: 700,
  },
  scopeTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 700,
    color: "#FFFFFF",
  },
  scopeMeta: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.74)",
  },
  nav: {
    flex: 1,
    padding: "18px 10px",
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
    minHeight: 48,
    padding: "12px 14px",
    color: "rgba(255,255,255,0.78)",
    textDecoration: "none",
    fontSize: 14.5,
    fontWeight: 500,
    borderRadius: 14,
    marginBottom: 6,
    transition: "background-color 180ms ease, border-color 180ms ease, color 180ms ease, padding 320ms cubic-bezier(0.22, 1, 0.36, 1), gap 320ms cubic-bezier(0.22, 1, 0.36, 1)",
    border: "1px solid transparent",
    overflow: "hidden",
    position: "relative",
  },
  navItemCollapsed: {
    justifyContent: "center",
    padding: "12px 12px",
  },
  navItemActive: {
    color: "#FFFFFF",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navText: {
    position: "absolute",
    left: 46,
    right: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    opacity: 1,
    transform: "translateX(0)",
    transition: "opacity 160ms ease, transform 220ms ease",
  },
  navTextCollapsed: {
    opacity: 0,
    transform: "translateX(-8px)",
    pointerEvents: "none",
  },
  sidebarFooter: {
    padding: 14,
    borderTop: "1px solid rgba(255,255,255,0.10)",
  },
  toggleButton: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    transition: "margin-left 360ms cubic-bezier(0.22, 1, 0.36, 1)",
    minHeight: "100vh",
  },
  topbar: {
    padding: "18px 24px 0 24px",
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "linear-gradient(180deg, rgba(245,247,250,0.96) 0%, rgba(245,247,250,0.88) 100%)",
    backdropFilter: "blur(10px)",
  },
  topbarCard: {
    borderRadius: 22,
    background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.96) 100%)",
    border: "1px solid #E1E7EF",
    boxShadow: "0 14px 30px rgba(15,23,42,0.05)",
    padding: "16px 18px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 14,
    alignItems: "center",
  },
  topbarContext: {
    minWidth: 0,
  },
  topbarLabel: {
    fontSize: 11.5,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: 0.34,
    fontWeight: 700,
    marginBottom: 4,
  },
  topbarTitle: {
    fontSize: 22,
    color: "#162033",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    position: "relative",
  },
  avatarCluster: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  datePill: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid #E2E8F0",
    background: "#FFFFFF",
    color: "#667085",
    fontSize: 13.5,
    fontWeight: 600,
    textTransform: "capitalize",
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(0,87,184,0.12)",
    background: "linear-gradient(180deg, #FFFFFF 0%, #F4F8FD 100%)",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform 200ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease",
  },
  avatarButtonActive: {
    border: "1px solid rgba(0,87,184,0.22)",
    background: "linear-gradient(180deg, #EFF5FD 0%, #E4EEFB 100%)",
    boxShadow: "0 10px 24px rgba(0,87,184,0.14)",
    transform: "translateY(-1px)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #0057B8 0%, #0A6AD7 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
  },
  userMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    width: 260,
    borderRadius: 18,
    background: "linear-gradient(180deg, #0057B8 0%, #044A98 100%)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 20px 44px rgba(0,50,120,0.24)",
    padding: 14,
    display: "grid",
    gap: 12,
    transformOrigin: "top right",
    backdropFilter: "blur(12px)",
    transition: "opacity 200ms ease, transform 240ms cubic-bezier(0.22, 1, 0.36, 1), filter 240ms ease",
    overflow: "visible",
  },
  userMenuOpen: {
    opacity: 1,
    transform: "translateY(0) scale(1)",
    filter: "blur(0)",
    pointerEvents: "auto",
  },
  userMenuClosed: {
    opacity: 0,
    transform: "translateY(-6px) scale(0.985)",
    filter: "blur(2px)",
    pointerEvents: "none",
  },
  userMenuConnector: {
    position: "absolute",
    top: -8,
    right: 14,
    width: 16,
    height: 16,
    borderTopLeftRadius: 4,
    background: "linear-gradient(180deg, #0057B8 0%, #044A98 100%)",
    borderTop: "1px solid rgba(255,255,255,0.14)",
    borderLeft: "1px solid rgba(255,255,255,0.14)",
    transform: "rotate(45deg)",
    boxSizing: "border-box",
  },
  userMenuHeader: {
    paddingBottom: 12,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },
  userMenuName: {
    fontSize: 15,
    fontWeight: 800,
    color: "#FFFFFF",
  },
  userMenuMeta: {
    marginTop: 4,
    fontSize: 12.5,
    color: "rgba(255,255,255,0.76)",
    fontWeight: 600,
  },
  userMenuInfo: {
    display: "grid",
    gap: 8,
  },
  userMenuRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  userMenuLabel: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.72)",
    fontWeight: 600,
  },
  userMenuValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: 700,
    textAlign: "right",
  },
  userMenuLogout: {
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: 800,
    cursor: "pointer",
    transition: "background-color 180ms ease, border-color 180ms ease",
  },
  pageContent: {
    padding: 24,
  },
};
