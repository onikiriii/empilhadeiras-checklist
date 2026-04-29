import React, { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "../../api";
import type {
  StpDocumentoArquivoDto,
  StpDocumentoEmpresaSummaryDto,
  StpDocumentoFuncionarioSummaryDto,
} from "../../types";

type Screen =
  | "companies"
  | "company-detail"
  | "company-documents"
  | "employees"
  | "employee-detail";

export default function StpDocumentControlPage() {
  const [screen, setScreen] = useState<Screen>("companies");
  const [companies, setCompanies] = useState<StpDocumentoEmpresaSummaryDto[]>([]);
  const [companyDocuments, setCompanyDocuments] = useState<StpDocumentoArquivoDto[]>([]);
  const [employees, setEmployees] = useState<StpDocumentoFuncionarioSummaryDto[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<StpDocumentoArquivoDto[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCompanyDocuments, setLoadingCompanyDocuments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingEmployeeDocuments, setLoadingEmployeeDocuments] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [uploadingCompanyDocument, setUploadingCompanyDocument] = useState(false);
  const [uploadingEmployeeDocument, setUploadingEmployeeDocument] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [companyForm, setCompanyForm] = useState({ nome: "", ativa: true });
  const [employeeForm, setEmployeeForm] = useState({ nome: "", cargo: "", ativo: true });
  const [companyDocumentForm, setCompanyDocumentForm] = useState({ nome: "", arquivo: null as File | null });
  const [employeeDocumentForm, setEmployeeDocumentForm] = useState({ nome: "", arquivo: null as File | null });

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId],
  );

  useEffect(() => {
    void loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoadingCompanies(true);
    setError("");

    try {
      const loadedCompanies = await api.get<StpDocumentoEmpresaSummaryDto[]>("/api/stp/document-control/companies");
      setCompanies(loadedCompanies);

      setSelectedCompanyId((current) => {
        if (current && loadedCompanies.some((company) => company.id === current)) return current;
        return "";
      });
    } catch (err) {
      setError(extractError(err, "Erro ao carregar empresas."));
    } finally {
      setLoadingCompanies(false);
    }
  }

  async function loadCompanyDocuments(companyId: string) {
    setLoadingCompanyDocuments(true);
    setError("");

    try {
      const loadedDocuments = await api.get<StpDocumentoArquivoDto[]>(
        `/api/stp/document-control/companies/${companyId}/documents`,
      );
      setCompanyDocuments(loadedDocuments);
    } catch (err) {
      setError(extractError(err, "Erro ao carregar documentos da empresa."));
    } finally {
      setLoadingCompanyDocuments(false);
    }
  }

  async function loadEmployees(companyId: string) {
    setLoadingEmployees(true);
    setError("");

    try {
      const loadedEmployees = await api.get<StpDocumentoFuncionarioSummaryDto[]>(
        `/api/stp/document-control/companies/${companyId}/employees`,
      );
      setEmployees(loadedEmployees);

      setSelectedEmployeeId((current) => {
        if (current && loadedEmployees.some((employee) => employee.id === current)) return current;
        return "";
      });
    } catch (err) {
      setError(extractError(err, "Erro ao carregar funcionarios."));
    } finally {
      setLoadingEmployees(false);
    }
  }

  async function loadEmployeeDocuments(employeeId: string) {
    setLoadingEmployeeDocuments(true);
    setError("");

    try {
      const loadedDocuments = await api.get<StpDocumentoArquivoDto[]>(
        `/api/stp/document-control/employees/${employeeId}/documents`,
      );
      setEmployeeDocuments(loadedDocuments);
    } catch (err) {
      setError(extractError(err, "Erro ao carregar documentos do funcionario."));
    } finally {
      setLoadingEmployeeDocuments(false);
    }
  }

  async function handleCreateCompany(event: React.FormEvent) {
    event.preventDefault();
    setSavingCompany(true);
    setError("");
    setSuccess("");

    try {
      const created = await api.post<StpDocumentoEmpresaSummaryDto>("/api/stp/document-control/companies", companyForm);
      const updatedCompanies = [...companies, created].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      setCompanies(updatedCompanies);
      setSelectedCompanyId(created.id);
      setCompanyForm({ nome: "", ativa: true });
      setSuccess(`Empresa ${created.nome} cadastrada.`);
    } catch (err) {
      setError(extractError(err, "Erro ao cadastrar empresa."));
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleCreateEmployee(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCompanyId) return;

    setSavingEmployee(true);
    setError("");
    setSuccess("");

    try {
      const created = await api.post<StpDocumentoFuncionarioSummaryDto>(
        `/api/stp/document-control/companies/${selectedCompanyId}/employees`,
        employeeForm,
      );

      const updatedEmployees = [...employees, created].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      setEmployees(updatedEmployees);
      setSelectedEmployeeId(created.id);
      setEmployeeForm({ nome: "", cargo: "", ativo: true });
      setSuccess(`Funcionario ${created.nome} cadastrado.`);
    } catch (err) {
      setError(extractError(err, "Erro ao cadastrar funcionario."));
    } finally {
      setSavingEmployee(false);
    }
  }

  async function handleUploadCompanyDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCompanyId || !companyDocumentForm.arquivo) return;

    setUploadingCompanyDocument(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("nome", companyDocumentForm.nome);
      formData.append("arquivo", companyDocumentForm.arquivo);

      const created = await api.postForm<StpDocumentoArquivoDto>(
        `/api/stp/document-control/companies/${selectedCompanyId}/documents`,
        formData,
      );

      setCompanyDocuments((current) => [created, ...current]);
      setCompanyDocumentForm({ nome: "", arquivo: null });
      setCompanies((current) =>
        current.map((company) =>
          company.id === selectedCompanyId
            ? { ...company, totalDocumentos: company.totalDocumentos + 1 }
            : company,
        ),
      );
      setSuccess(`Documento ${created.nome} enviado para a empresa.`);
    } catch (err) {
      setError(extractError(err, "Erro ao enviar documento da empresa."));
    } finally {
      setUploadingCompanyDocument(false);
    }
  }

  async function handleUploadEmployeeDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedEmployeeId || !employeeDocumentForm.arquivo) return;

    setUploadingEmployeeDocument(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("nome", employeeDocumentForm.nome);
      formData.append("arquivo", employeeDocumentForm.arquivo);

      const created = await api.postForm<StpDocumentoArquivoDto>(
        `/api/stp/document-control/employees/${selectedEmployeeId}/documents`,
        formData,
      );

      setEmployeeDocuments((current) => [created, ...current]);
      setEmployeeDocumentForm({ nome: "", arquivo: null });
      setEmployees((current) =>
        current.map((employee) =>
          employee.id === selectedEmployeeId
            ? { ...employee, totalDocumentos: employee.totalDocumentos + 1 }
            : employee,
        ),
      );
      setSuccess(`Documento ${created.nome} enviado para o funcionario.`);
    } catch (err) {
      setError(extractError(err, "Erro ao enviar documento do funcionario."));
    } finally {
      setUploadingEmployeeDocument(false);
    }
  }

  async function handleViewDocument(path: string, suggestedName: string) {
    try {
      const blob = await api.getBlob(path);
      const url = window.URL.createObjectURL(blob);
      const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!openedWindow) {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.download = suggestedName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }

      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(extractError(err, "Erro ao visualizar documento."));
    }
  }

  async function openCompany(company: StpDocumentoEmpresaSummaryDto) {
    setSelectedCompanyId(company.id);
    setSelectedEmployeeId("");
    setEmployees([]);
    setEmployeeDocuments([]);
    setCompanyDocuments([]);
    setScreen("company-detail");
  }

  async function openCompanyDocuments() {
    if (!selectedCompanyId) return;
    await loadCompanyDocuments(selectedCompanyId);
    setScreen("company-documents");
  }

  async function openEmployees() {
    if (!selectedCompanyId) return;
    await loadEmployees(selectedCompanyId);
    setScreen("employees");
  }

  async function openEmployee(employee: StpDocumentoFuncionarioSummaryDto) {
    setSelectedEmployeeId(employee.id);
    await loadEmployeeDocuments(employee.id);
    setScreen("employee-detail");
  }

  function backToCompanies() {
    setScreen("companies");
    setSelectedCompanyId("");
    setSelectedEmployeeId("");
    setCompanyDocuments([]);
    setEmployees([]);
    setEmployeeDocuments([]);
  }

  function backToCompanyDetail() {
    setScreen("company-detail");
    setSelectedEmployeeId("");
    setEmployeeDocuments([]);
  }

  function backToEmployees() {
    setScreen("employees");
    setSelectedEmployeeId("");
    setEmployeeDocuments([]);
  }

  return (
    <div className="cf-page">
      <header className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Controle de documentos</h1>
          <p className="cf-page-subtitle">
            Empresas, funcionarios e documentacoes organizados por fluxo.
          </p>
        </div>
      </header>

      {error ? <div className="cf-alert cf-alert-error">{error}</div> : null}
      {success ? <div className="cf-alert cf-alert-success">{success}</div> : null}

      <section className="cf-surface cf-surface-padded" style={styles.pageShell}>
        <Breadcrumb
          screen={screen}
          companyName={selectedCompany?.nome ?? ""}
          employeeName={selectedEmployee?.nome ?? ""}
          onBackToCompanies={backToCompanies}
          onBackToCompanyDetail={backToCompanyDetail}
          onBackToEmployees={backToEmployees}
        />

        {screen === "companies" ? (
          <div style={styles.pageGrid}>
            <section className="cf-surface cf-surface-padded" style={styles.leftPanel}>
              <div style={styles.blockHeader}>
                <h2 className="cf-surface-title" style={styles.noMargin}>Cadastrar empresa</h2>
              </div>

              <form className="cf-form" onSubmit={handleCreateCompany}>
                <div>
                  <label className="cf-field-label">Nome da empresa</label>
                  <input
                    value={companyForm.nome}
                    onChange={(e) => setCompanyForm((current) => ({ ...current, nome: e.target.value }))}
                    placeholder="Ex.: ABC Servicos Industriais"
                  />
                </div>

                <label className="cf-checkbox">
                  <input
                    type="checkbox"
                    checked={companyForm.ativa}
                    onChange={(e) => setCompanyForm((current) => ({ ...current, ativa: e.target.checked }))}
                  />
                  Empresa ativa
                </label>

                <button type="submit" className="cf-button cf-button-primary" style={styles.primaryAction} disabled={savingCompany}>
                  {savingCompany ? "Salvando..." : "Cadastrar empresa"}
                </button>
              </form>
            </section>

            <section className="cf-surface" style={styles.rightPanel}>
              <div className="cf-surface-header">
                <h2 className="cf-surface-title">Empresas cadastradas</h2>
                <span className="cf-count" style={styles.countBadge}>{companies.length}</span>
              </div>

              {loadingCompanies ? (
                <div className="cf-loading">Carregando empresas...</div>
              ) : companies.length === 0 ? (
                <div className="cf-empty">Nenhuma empresa cadastrada.</div>
              ) : (
                <div style={styles.companyGrid}>
                  {companies.map((company) => (
                    <button key={company.id} type="button" style={styles.companyCard} onClick={() => void openCompany(company)}>
                      <div style={styles.companyCardTop}>
                        <strong style={styles.companyName}>{company.nome}</strong>
                        <span className={`cf-badge ${company.ativa ? "cf-badge-success" : "cf-badge-danger"}`}>
                          {company.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                      <div style={styles.companyMeta}>
                        {company.totalDocumentos} documento(s) · {company.totalFuncionarios} funcionario(s)
                      </div>
                      <div style={styles.companyAction}>Abrir detalhes</div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {screen === "company-detail" && selectedCompany ? (
          <section style={styles.stageStack}>
            <section className="cf-surface cf-surface-padded">
              <div style={styles.detailHeader}>
                <div>
                  <h2 className="cf-surface-title" style={styles.noMargin}>{selectedCompany.nome}</h2>
                  <div style={styles.sectionSubtitle}>Detalhes da empresa selecionada.</div>
                </div>
                <span className={`cf-badge ${selectedCompany.ativa ? "cf-badge-success" : "cf-badge-danger"}`}>
                  {selectedCompany.ativa ? "Ativa" : "Inativa"}
                </span>
              </div>
            </section>

            <div style={styles.choiceGrid}>
              <ChoiceCard
                title="Documentos da empresa"
                text="Acesse upload e visualizacao dos documentos institucionais desta empresa."
                meta={`${selectedCompany.totalDocumentos} documento(s)`}
                actionLabel="Abrir documentos da empresa"
                onClick={() => void openCompanyDocuments()}
              />
              <ChoiceCard
                title="Funcionarios"
                text="Acesse a lista de funcionarios da empresa e as documentacoes individuais."
                meta={`${selectedCompany.totalFuncionarios} funcionario(s)`}
                actionLabel="Abrir funcionarios"
                onClick={() => void openEmployees()}
              />
            </div>
          </section>
        ) : null}

        {screen === "company-documents" && selectedCompany ? (
          <section style={styles.stageStack}>
            <section className="cf-surface cf-surface-padded">
              <div style={styles.detailHeader}>
                <div>
                  <h2 className="cf-surface-title" style={styles.noMargin}>Documentos da empresa</h2>
                  <div style={styles.sectionSubtitle}>{selectedCompany.nome}</div>
                </div>
                <span className="cf-count" style={styles.countBadge}>{selectedCompany.totalDocumentos}</span>
              </div>
            </section>

            <section className="cf-surface cf-surface-padded">
              <h3 style={styles.sectionTitle}>Upload de documentos</h3>
              <form className="cf-form" onSubmit={handleUploadCompanyDocument}>
                <div style={styles.uploadGrid}>
                  <div>
                    <label className="cf-field-label">Nome do documento</label>
                    <input
                      value={companyDocumentForm.nome}
                      onChange={(e) => setCompanyDocumentForm((current) => ({ ...current, nome: e.target.value }))}
                      placeholder="Ex.: Contrato social"
                    />
                  </div>
                  <div>
                    <label className="cf-field-label">Arquivo</label>
                    <input
                      type="file"
                      onChange={(e) =>
                        setCompanyDocumentForm((current) => ({
                          ...current,
                          arquivo: e.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="cf-form-actions">
                  <button
                    type="submit"
                    className="cf-button cf-button-primary"
                    style={styles.primaryAction}
                    disabled={uploadingCompanyDocument || !companyDocumentForm.arquivo}
                  >
                    {uploadingCompanyDocument ? "Enviando..." : "Enviar documento"}
                  </button>
                </div>
              </form>
            </section>

            <section className="cf-surface cf-surface-padded">
              <h3 style={styles.sectionTitle}>Documentos ja enviados</h3>
              {loadingCompanyDocuments ? (
                <div className="cf-loading">Carregando documentos...</div>
              ) : companyDocuments.length === 0 ? (
                <div className="cf-empty">Nenhum documento da empresa cadastrado.</div>
              ) : (
                <DocumentList
                  documents={companyDocuments}
                  onView={(document) =>
                    void handleViewDocument(
                      `/api/stp/document-control/company-documents/${document.id}/file`,
                      document.nomeArquivoOriginal,
                    )
                  }
                />
              )}
            </section>
          </section>
        ) : null}

        {screen === "employees" && selectedCompany ? (
          <section style={styles.stageStack}>
            <section className="cf-surface cf-surface-padded">
              <div style={styles.detailHeader}>
                <div>
                  <h2 className="cf-surface-title" style={styles.noMargin}>Funcionarios</h2>
                  <div style={styles.sectionSubtitle}>{selectedCompany.nome}</div>
                </div>
                <span className="cf-count" style={styles.countBadge}>{employees.length}</span>
              </div>
            </section>

            <div style={styles.pageGrid}>
              <section className="cf-surface cf-surface-padded" style={styles.leftPanel}>
                <h3 style={styles.sectionTitle}>Cadastrar funcionario</h3>
                <form className="cf-form" onSubmit={handleCreateEmployee}>
                  <div>
                    <label className="cf-field-label">Nome</label>
                    <input
                      value={employeeForm.nome}
                      onChange={(e) => setEmployeeForm((current) => ({ ...current, nome: e.target.value }))}
                      placeholder="Ex.: Joao da Silva"
                    />
                  </div>

                  <div>
                    <label className="cf-field-label">Cargo</label>
                    <input
                      value={employeeForm.cargo}
                      onChange={(e) => setEmployeeForm((current) => ({ ...current, cargo: e.target.value }))}
                      placeholder="Ex.: Soldador"
                    />
                  </div>

                  <label className="cf-checkbox">
                    <input
                      type="checkbox"
                      checked={employeeForm.ativo}
                      onChange={(e) => setEmployeeForm((current) => ({ ...current, ativo: e.target.checked }))}
                    />
                    Funcionario ativo
                  </label>

                  <button type="submit" className="cf-button cf-button-primary" style={styles.primaryAction} disabled={savingEmployee}>
                    {savingEmployee ? "Salvando..." : "Cadastrar funcionario"}
                  </button>
                </form>
              </section>

              <section className="cf-surface" style={styles.rightPanel}>
                <div className="cf-surface-header">
                  <h3 className="cf-surface-title">Lista de funcionarios</h3>
                  <span className="cf-count" style={styles.countBadge}>{employees.length}</span>
                </div>

                {loadingEmployees ? (
                  <div className="cf-loading">Carregando funcionarios...</div>
                ) : employees.length === 0 ? (
                  <div className="cf-empty">Nenhum funcionario cadastrado.</div>
                ) : (
                  <div style={styles.employeeGrid}>
                    {employees.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        style={styles.employeeCard}
                        onClick={() => void openEmployee(employee)}
                      >
                        <div style={styles.employeeCardTop}>
                          <strong style={styles.companyName}>{employee.nome}</strong>
                          <span className={`cf-badge ${employee.ativo ? "cf-badge-success" : "cf-badge-danger"}`}>
                            {employee.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div style={styles.companyMeta}>
                          {employee.cargo || "Cargo nao informado"} · {employee.totalDocumentos} documento(s)
                        </div>
                        <div style={styles.companyAction}>Abrir detalhes do funcionario</div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        ) : null}

        {screen === "employee-detail" && selectedCompany && selectedEmployee ? (
          <section style={styles.stageStack}>
            <section className="cf-surface cf-surface-padded">
              <div style={styles.detailHeader}>
                <div>
                  <h2 className="cf-surface-title" style={styles.noMargin}>{selectedEmployee.nome}</h2>
                  <div style={styles.sectionSubtitle}>{selectedCompany.nome}</div>
                </div>
                <span className={`cf-badge ${selectedEmployee.ativo ? "cf-badge-success" : "cf-badge-danger"}`}>
                  {selectedEmployee.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div style={styles.infoGrid}>
                <InfoBlock label="Funcionario" value={selectedEmployee.nome} />
                <InfoBlock label="Cargo" value={selectedEmployee.cargo || "Nao informado"} />
                <InfoBlock label="Empresa" value={selectedCompany.nome} />
                <InfoBlock label="Documentos" value={`${selectedEmployee.totalDocumentos}`} />
              </div>
            </section>

            <section className="cf-surface cf-surface-padded">
              <h3 style={styles.sectionTitle}>Documentacoes do funcionario</h3>
              <form className="cf-form" onSubmit={handleUploadEmployeeDocument}>
                <div style={styles.uploadGrid}>
                  <div>
                    <label className="cf-field-label">Nome do documento</label>
                    <input
                      value={employeeDocumentForm.nome}
                      onChange={(e) => setEmployeeDocumentForm((current) => ({ ...current, nome: e.target.value }))}
                      placeholder="Ex.: ASO"
                    />
                  </div>
                  <div>
                    <label className="cf-field-label">Arquivo</label>
                    <input
                      type="file"
                      onChange={(e) =>
                        setEmployeeDocumentForm((current) => ({
                          ...current,
                          arquivo: e.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="cf-form-actions">
                  <button
                    type="submit"
                    className="cf-button cf-button-primary"
                    style={styles.primaryAction}
                    disabled={uploadingEmployeeDocument || !employeeDocumentForm.arquivo}
                  >
                    {uploadingEmployeeDocument ? "Enviando..." : "Enviar documento"}
                  </button>
                </div>
              </form>
            </section>

            <section className="cf-surface cf-surface-padded">
              <h3 style={styles.sectionTitle}>Documentos ja enviados</h3>
              {loadingEmployeeDocuments ? (
                <div className="cf-loading">Carregando documentos...</div>
              ) : employeeDocuments.length === 0 ? (
                <div className="cf-empty">Nenhum documento do funcionario cadastrado.</div>
              ) : (
                <DocumentList
                  documents={employeeDocuments}
                  onView={(document) =>
                    void handleViewDocument(
                      `/api/stp/document-control/employee-documents/${document.id}/file`,
                      document.nomeArquivoOriginal,
                    )
                  }
                />
              )}
            </section>
          </section>
        ) : null}
      </section>
    </div>
  );
}

function Breadcrumb({
  screen,
  companyName,
  employeeName,
  onBackToCompanies,
  onBackToCompanyDetail,
  onBackToEmployees,
}: {
  screen: Screen;
  companyName: string;
  employeeName: string;
  onBackToCompanies: () => void;
  onBackToCompanyDetail: () => void;
  onBackToEmployees: () => void;
}) {
  return (
    <div style={styles.breadcrumb}>
      <button type="button" className="cf-button cf-button-secondary cf-button-small" onClick={onBackToCompanies}>
        Empresas
      </button>

      {screen !== "companies" ? <span style={styles.breadcrumbSeparator}>/</span> : null}

      {screen !== "companies" ? (
        <button type="button" className="cf-button cf-button-secondary cf-button-small" onClick={onBackToCompanyDetail}>
          {companyName || "Detalhes da empresa"}
        </button>
      ) : null}

      {screen === "employee-detail" || screen === "employees" ? (
        <>
          <span style={styles.breadcrumbSeparator}>/</span>
          <button type="button" className="cf-button cf-button-secondary cf-button-small" onClick={onBackToEmployees}>
            Funcionarios
          </button>
        </>
      ) : null}

      {screen === "employee-detail" ? (
        <>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>{employeeName}</span>
        </>
      ) : null}

      {screen === "company-documents" ? (
        <>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbCurrent}>Documentos da empresa</span>
        </>
      ) : null}
    </div>
  );
}

function ChoiceCard({
  title,
  text,
  meta,
  actionLabel,
  onClick,
}: {
  title: string;
  text: string;
  meta: string;
  actionLabel: string;
  onClick: () => void;
}) {
  return (
    <button type="button" style={styles.choiceCard} onClick={onClick}>
      <div style={styles.choiceCardBody}>
        <strong style={styles.choiceTitle}>{title}</strong>
        <div style={styles.choiceText}>{text}</div>
        <div style={styles.choiceMeta}>{meta}</div>
      </div>
      <div style={styles.companyAction}>{actionLabel}</div>
    </button>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoBlock}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function DocumentList({
  documents,
  onView,
}: {
  documents: StpDocumentoArquivoDto[];
  onView: (document: StpDocumentoArquivoDto) => void;
}) {
  return (
    <div className="cf-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Arquivo</th>
            <th>Enviado em</th>
            <th>Tamanho</th>
            <th style={{ width: 140 }}>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="cf-data-row">
              <td>{document.nome}</td>
              <td>{document.nomeArquivoOriginal}</td>
              <td>{formatDateTime(document.criadoEm)}</td>
              <td>{formatBytes(document.tamanhoBytes)}</td>
              <td>
                <button
                  type="button"
                  className="cf-button cf-button-secondary cf-button-small"
                  onClick={() => onView(document)}
                >
                  Visualizar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  pageShell: {
    display: "grid",
    gap: 18,
  },
  pageGrid: {
    display: "grid",
    gridTemplateColumns: "340px minmax(0, 1fr)",
    gap: 20,
    alignItems: "start",
  },
  leftPanel: {
    display: "grid",
    gap: 16,
  },
  rightPanel: {
    overflow: "hidden",
  },
  stageStack: {
    display: "grid",
    gap: 18,
  },
  noMargin: {
    margin: 0,
  },
  countBadge: {
    background: "#ECFDF3",
    border: "1px solid #B7E4C7",
    color: "#055a36",
  },
  blockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
    flexWrap: "wrap",
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#667085",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#101828",
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  breadcrumbSeparator: {
    color: "#98A2B3",
    fontWeight: 700,
  },
  breadcrumbCurrent: {
    fontSize: 13,
    fontWeight: 800,
    color: "#055a36",
  },
  primaryAction: {
    background: "linear-gradient(135deg, #055a36 0%, #067647 100%)",
    color: "#FFFFFF",
  },
  companyGrid: {
    display: "grid",
    gap: 14,
    padding: 18,
  },
  companyCard: {
    border: "1px solid #cfe0d5",
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(180deg, #FFFFFF 0%, #F6FBF8 100%)",
    textAlign: "left",
    display: "grid",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 14px 24px rgba(5, 90, 54, 0.05)",
  },
  companyCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  companyName: {
    color: "#101828",
  },
  companyMeta: {
    fontSize: 13,
    color: "#667085",
  },
  companyAction: {
    fontSize: 13,
    fontWeight: 800,
    color: "#055a36",
  },
  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
  },
  choiceCard: {
    border: "1px solid #cfe0d5",
    borderRadius: 24,
    background: "linear-gradient(180deg, #FFFFFF 0%, #F4FBF6 100%)",
    padding: 22,
    textAlign: "left",
    display: "grid",
    gap: 18,
    cursor: "pointer",
    boxShadow: "0 18px 28px rgba(5, 90, 54, 0.06)",
  },
  choiceCardBody: {
    display: "grid",
    gap: 8,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#101828",
  },
  choiceText: {
    fontSize: 14,
    color: "#475467",
    lineHeight: 1.5,
  },
  choiceMeta: {
    fontSize: 13,
    color: "#667085",
    fontWeight: 700,
  },
  uploadGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) minmax(220px, 1fr)",
    gap: 16,
  },
  employeeGrid: {
    display: "grid",
    gap: 14,
    padding: 18,
  },
  employeeCard: {
    border: "1px solid #cfe0d5",
    borderRadius: 22,
    padding: 16,
    background: "linear-gradient(180deg, #FFFFFF 0%, #F6FBF8 100%)",
    textAlign: "left",
    display: "grid",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 14px 24px rgba(5, 90, 54, 0.05)",
  },
  employeeCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  infoGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  infoBlock: {
    border: "1px solid #d8e6dc",
    borderRadius: 18,
    padding: 14,
    background: "#F8FCF9",
    display: "grid",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#667085",
    fontWeight: 700,
  },
  infoValue: {
    fontSize: 15,
    color: "#101828",
    fontWeight: 700,
  },
};
