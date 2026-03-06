import "./styles/global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { ChecklistPage } from "./pages/ChecklistPage";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorChecklistDetail from "./pages/SupervisorChecklistDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import CategoriasPage from "./pages/admin/CategoriasPage";
import TemplatesPage from "./pages/admin/TemplatesPage";
import OperadoresPage from "./pages/admin/OperadoresPage";
import EquipamentosPage from "./pages/admin/EquipamentosPage";
import ChecklistsPage from "./pages/admin/ChecklistsPage";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/supervisor/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/supervisor/checklist/:id" element={<SupervisorChecklistDetail />} />
        <Route path="/checklist/:qrId" element={<ChecklistPage />} />
        
        {/* Rotas Administrativas */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SupervisorDashboard />} />
           <Route path="checklists" element={<ChecklistsPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="operadores" element={<OperadoresPage />} />
          <Route path="equipamentos" element={<EquipamentosPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);