import "./styles/global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  AuthProvider,
  getDefaultAdminPath,
  GuestOnly,
  RequireAuth,
  RequireMaster,
  RequirePasswordChange,
  RequireSectorSupervisor,
  useAuth,
} from "./auth";
import HomePage from "./pages/HomePage";
import { ChecklistPage } from "./pages/ChecklistPage";
import FirstAccessPasswordPage from "./pages/FirstAccessPasswordPage";
import LoginPage from "./pages/LoginPage";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorChecklistDetail from "./pages/SupervisorChecklistDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import CategoriasPage from "./pages/admin/CategoriasPage";
import ChecklistsPage from "./pages/admin/ChecklistsPage";
import EquipamentosPage from "./pages/admin/EquipamentosPage";
import FechamentosMensaisPage from "./pages/admin/FechamentosMensaisPage";
import ItensNaoOkPage from "./pages/admin/ItensNaoOkPage";
import OperadoresPage from "./pages/admin/OperadoresPage";
import SetoresPage from "./pages/admin/SetoresPage";
import SupervisoresPage from "./pages/admin/SupervisoresPage";
import TemplatesPage from "./pages/admin/TemplatesPage";

function AdminIndexRedirect() {
  const { session } = useAuth();
  return <Navigate to={getDefaultAdminPath(session)} replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={(
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            )}
          />
          <Route
            path="/primeiro-acesso"
            element={(
              <RequirePasswordChange>
                <FirstAccessPasswordPage />
              </RequirePasswordChange>
            )}
          />
          <Route path="/supervisor/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/supervisor/checklist/:id"
            element={(
              <RequireSectorSupervisor>
                <SupervisorChecklistDetail />
              </RequireSectorSupervisor>
            )}
          />
          <Route path="/checklist/:qrId" element={<ChecklistPage />} />

          <Route
            path="/admin"
            element={(
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            )}
          >
            <Route index element={<AdminIndexRedirect />} />
            <Route
              path="dashboard"
              element={(
                <RequireSectorSupervisor>
                  <SupervisorDashboard />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="checklists"
              element={(
                <RequireSectorSupervisor>
                  <ChecklistsPage />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="itens-nao-ok"
              element={(
                <RequireSectorSupervisor>
                  <ItensNaoOkPage />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="fechamentos-mensais"
              element={(
                <RequireSectorSupervisor>
                  <FechamentosMensaisPage />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="categorias"
              element={(
                <RequireSectorSupervisor>
                  <CategoriasPage />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="templates"
              element={(
                <RequireSectorSupervisor>
                  <TemplatesPage />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="operadores"
              element={(
                <RequireSectorSupervisor>
                  <OperadoresPage />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="equipamentos"
              element={(
                <RequireSectorSupervisor>
                  <EquipamentosPage />
                </RequireSectorSupervisor>
              )}
            />
            <Route
              path="setores"
              element={(
                <RequireMaster>
                  <SetoresPage />
                </RequireMaster>
              )}
            />
            <Route
              path="supervisores"
              element={(
                <RequireMaster>
                  <SupervisoresPage />
                </RequireMaster>
              )}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
