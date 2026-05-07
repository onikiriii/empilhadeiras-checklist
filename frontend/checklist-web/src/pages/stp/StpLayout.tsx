import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

const navItems = [
  { to: "/stp/dashboard", label: "Dashboard" },
  { to: "/stp/areas", label: "Areas" },
  { to: "/stp/controle-documentos", label: "Controle de documentos" },
  { to: "/stp/checklists", label: "Historico" },
];

export default function StpLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandEyebrow}>Modulo</div>
          <div style={styles.brandTitle}>Seguranca do Trabalho</div>
          <div style={styles.brandSubtitle}>Inspecoes de area com fluxo proprio para inspetores.</div>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userBlock}>
            <div style={styles.userLabel}>Usuario</div>
            <div style={styles.userName}>{session?.supervisor.nomeCompleto}</div>
            <div style={styles.userMeta}>{session?.supervisor.setorNome}</div>
          </div>

          <Link to="/modulos" style={styles.switchLink}>
            Trocar modulo
          </Link>
          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            Sair
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    background: "linear-gradient(180deg, #ECFDF3 0%, #F8FAFC 100%)",
  },
  sidebar: {
    borderRight: "1px solid rgba(15,23,42,0.08)",
    background: "#082F2D",
    color: "#FFFFFF",
    padding: 22,
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    gap: 24,
  },
  brand: {
    display: "grid",
    gap: 8,
  },
  brandEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
  },
  brandTitle: {
    fontSize: 26,
    lineHeight: 1.08,
    fontWeight: 800,
  },
  brandSubtitle: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.76)",
  },
  nav: {
    display: "grid",
    gap: 8,
    alignContent: "start",
  },
  navItem: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.88)",
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 14,
    background: "transparent",
  },
  navItemActive: {
    background: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
  },
  sidebarFooter: {
    display: "grid",
    gap: 10,
  },
  userBlock: {
    display: "grid",
    gap: 4,
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.08)",
  },
  userLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.66)",
  },
  userName: {
    fontSize: 15,
    fontWeight: 800,
  },
  userMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.74)",
  },
  switchLink: {
    textDecoration: "none",
    color: "#FFFFFF",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    background: "rgba(255,255,255,0.08)",
  },
  logoutButton: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    minHeight: 42,
    background: "rgba(255,255,255,0.08)",
    color: "#FFFFFF",
    fontWeight: 700,
    cursor: "pointer",
  },
  main: {
    padding: 28,
    display: "grid",
    alignContent: "start",
  },
};
