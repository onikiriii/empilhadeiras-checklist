import { useState, ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/global.css";

const menuItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/admin/checklists", label: "Checklists", icon: "📋" },
  { path: "/admin/categorias", label: "Categorias", icon: "📁" },
  { path: "/admin/templates", label: "Templates", icon: "📝" },
  { path: "/admin/operadores", label: "Operadores", icon: "👷" },
  { path: "/admin/equipamentos", label: "Equipamentos", icon: "🚜" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 70 : 240,
        backgroundColor: "#0057B8",
        color: "white",
        transition: "width 0.3s ease",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? "20px 10px" : "20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>🏭</span>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Checklist</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Sistema de Gestão</div>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px 10px" : "12px 24px",
                color: isActive ? "white" : "rgba(255,255,255,0.7)",
                backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.2s ease",
                justifyContent: collapsed ? "center" : "flex-start",
                borderLeft: isActive ? "3px solid white" : "3px solid transparent",
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains("active")) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains("active")) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: 16,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? 70 : 240,
        transition: "margin-left 0.3s ease",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
      }}>
        {/* Top Bar */}
        <header style={{
          backgroundColor: "white",
          padding: "16px 24px",
          borderBottom: "1px solid #D9D9D9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "#6B7280", fontSize: 14 }}>Módulo Administrativo</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, color: "#6B7280" }}>
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "#0057B8",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
            }}>
              G
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}