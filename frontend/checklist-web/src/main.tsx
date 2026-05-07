import "./styles/global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { OperatorAuthProvider, RequireOperatorAuth } from "./operator-auth";
import {
  AuthProvider,
  getDefaultAdminPath,
  GuestOnly,
  RequireAuth,
  RequireMaster,
  RequireMaterialsInspectionModule,
  RequirePasswordChange,
  RequireSectorSupervisor,
  RequireSafetyWorkModule,
  useAuth,
} from "./auth";
import HomePage from "./pages/HomePage";
import { ChecklistPage } from "./pages/ChecklistPage";
import FirstAccessPasswordPage from "./pages/FirstAccessPasswordPage";
import LoginPage from "./pages/LoginPage";
import ModuleSelectionPage from "./pages/ModuleSelectionPage";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorChecklistDetail from "./pages/SupervisorChecklistDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import CategoriasPage from "./pages/admin/CategoriasPage";
import ChecklistsPage from "./pages/admin/ChecklistsPage";
import EquipamentosPage from "./pages/admin/EquipamentosPage";
import FechamentosMensaisPage from "./pages/admin/FechamentosMensaisPage";
import ItemNaoOkDetailPage from "./pages/admin/ItemNaoOkDetailPage";
import ItensNaoOkPage from "./pages/admin/ItensNaoOkPage";
import OperadoresPage from "./pages/admin/OperadoresPage";
import SetoresPage from "./pages/admin/SetoresPage";
import InspetoresPage from "./pages/admin/InspetoresPage";
import SupervisoresPage from "./pages/admin/SupervisoresPage";
import TemplatesPage from "./pages/admin/TemplatesPage";
import ItensNaoOkDashboardPage from "./pages/admin/ItensNaoOkDashboardPage";
import StpLayout from "./pages/stp/StpLayout";
import StpDashboardPage from "./pages/stp/StpDashboardPage";
import StpAreasPage from "./pages/stp/StpAreasPage";
import StpChecklistCreatePage from "./pages/stp/StpChecklistCreatePage";
import StpChecklistsPage from "./pages/stp/StpChecklistsPage";
import StpChecklistDetailPage from "./pages/stp/StpChecklistDetailPage";
import StpDocumentControlPage from "./pages/stp/StpDocumentControlPage";
import MaterialsLayout from "./pages/materials/MaterialsLayout";
import MaterialsDashboardPage from "./pages/materials/MaterialsDashboardPage";
import OperatorLoginPage from "./pages/OperatorLoginPage";
import OperatorFirstAccessPasswordPage from "./pages/OperatorFirstAccessPasswordPage";

function AdminIndexRedirect() {
  const { session } = useAuth();
  return <Navigate to={getDefaultAdminPath(session)} replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OperatorAuthProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/operador/login" element={<OperatorLoginPage />} />
            <Route path="/operador/primeiro-acesso" element={<OperatorFirstAccessPasswordPage />} />
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
            <Route
              path="/modulos"
              element={(
                <RequireAuth>
                  <ModuleSelectionPage />
                </RequireAuth>
              )}
            />
            <Route
              path="/materiais"
              element={(
                <RequireMaterialsInspectionModule>
                  <MaterialsLayout />
                </RequireMaterialsInspectionModule>
              )}
            >
              <Route index element={<Navigate to="/materiais/dashboard" replace />} />
              <Route path="dashboard" element={<MaterialsDashboardPage />} />
            </Route>
            <Route
              path="/stp"
              element={(
                <RequireSafetyWorkModule>
                  <StpLayout />
                </RequireSafetyWorkModule>
              )}
            >
              <Route index element={<Navigate to="/stp/dashboard" replace />} />
              <Route path="dashboard" element={<StpDashboardPage />} />
              <Route path="areas" element={<StpAreasPage />} />
              <Route path="controle-documentos" element={<StpDocumentControlPage />} />
              <Route path="checklists" element={<StpChecklistsPage />} />
              <Route path="checklists/:id" element={<StpChecklistDetailPage />} />
            </Route>
            <Route
              path="/stp/checklists/nova"
              element={(
                <RequireSafetyWorkModule>
                  <StpChecklistCreatePage />
                </RequireSafetyWorkModule>
              )}
            />
            <Route
              path="/stp/areas/:areaId/nova-inspecao"
              element={(
                <RequireSafetyWorkModule>
                  <StpChecklistCreatePage />
                </RequireSafetyWorkModule>
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
            <Route
              path="/checklist/:qrId"
              element={(
                <RequireOperatorAuth>
                  <ChecklistPage />
                </RequireOperatorAuth>
              )}
            />

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
                    <ItensNaoOkDashboardPage />
                  </RequireSectorSupervisor>
                )}
              />
              <Route
                path="itens-nao-ok/lista"
                element={(
                  <RequireSectorSupervisor>
                      <ItensNaoOkPage />
                  </RequireSectorSupervisor>
                )}
              />
              <Route
                path="itens-nao-ok/item/:id"
                element={(
                  <RequireSectorSupervisor>
                    <ItemNaoOkDetailPage />
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
                path="inspetores"
                element={(
                  <RequireMaster>
                    <InspetoresPage />
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
        </HashRouter>
      </AuthProvider>
    </OperatorAuthProvider>
  </React.StrictMode>,
);
