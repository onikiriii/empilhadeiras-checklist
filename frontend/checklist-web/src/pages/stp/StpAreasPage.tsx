import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../api";
import type { StpAreaInspecaoDto, StpAreaResponsavelSupervisorDto } from "../../types";

export default function StpAreasPage() {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<StpAreaInspecaoDto[]>([]);
  const [responsaveis, setResponsaveis] = useState<StpAreaResponsavelSupervisorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    responsavelSupervisorId: "",
    ativa: true,
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [loadedAreas, loadedResponsaveis] = await Promise.all([
        api.get<StpAreaInspecaoDto[]>("/api/stp/areas"),
        api.get<StpAreaResponsavelSupervisorDto[]>("/api/stp/areas/responsaveis"),
      ]);

      setAreas(loadedAreas);
      setResponsaveis(loadedResponsaveis);
      setForm((current) => ({
        ...current,
        responsavelSupervisorId: current.responsavelSupervisorId || loadedResponsaveis[0]?.id || "",
      }));
    } catch (err) {
      setError(extractError(err, "Erro ao carregar areas de inspecao."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        nome: form.nome,
        responsavelSupervisorId: form.responsavelSupervisorId,
        ativa: form.ativa,
      };

      if (editingId) {
        const updated = await api.put<StpAreaInspecaoDto>(`/api/stp/areas/${editingId}`, payload);
        setAreas((current) =>
          current
            .map((area) => (area.id === updated.id ? updated : area))
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        );
        setSuccess(`Area ${updated.nome} atualizada.`);
      } else {
        const created = await api.post<StpAreaInspecaoDto>("/api/stp/areas", payload);
        setAreas((current) => [...current, created].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setSuccess(`Area ${created.nome} criada.`);
      }

      resetForm();
    } catch (err) {
      setError(extractError(err, editingId ? "Erro ao atualizar area." : "Erro ao criar area."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(area: StpAreaInspecaoDto) {
    setEditingId(area.id);
    setShowForm(true);
    setForm({
      nome: area.nome,
      responsavelSupervisorId: area.responsavelSupervisorId,
      ativa: area.ativa,
    });
    setError("");
    setSuccess("");
  }

  async function handleToggle(area: StpAreaInspecaoDto) {
    const ativa = !area.ativa;
    const confirmar = window.confirm(`Tem certeza que deseja ${ativa ? "ativar" : "inativar"} esta area?`);
    if (!confirmar) return;

    try {
      const updated = await api.put<StpAreaInspecaoDto>(`/api/stp/areas/${area.id}`, {
        nome: area.nome,
        responsavelSupervisorId: area.responsavelSupervisorId,
        ativa,
      });

      setAreas((current) =>
        current
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      );
    } catch (err) {
      setError(extractError(err, "Erro ao atualizar status da area."));
    }
  }

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm({
      nome: "",
      responsavelSupervisorId: responsaveis[0]?.id || "",
      ativa: true,
    });
  }

  return (
    <div className="cf-page">
      <header className="cf-page-header">
        <div>
          <h1 className="cf-page-title">Areas de inspecao</h1>
          <p className="cf-page-subtitle">Cadastre as areas que aparecerao no dashboard do STP.</p>
        </div>

        <button
          type="button"
          className="cf-button cf-button-primary"
          onClick={() => {
            setShowForm((current) => !current);
            if (showForm) resetForm();
          }}
        >
          {showForm ? "Cancelar" : "Nova area"}
        </button>
      </header>

      {error ? <div className="cf-alert cf-alert-error">{error}</div> : null}
      {success ? <div className="cf-alert cf-alert-success">{success}</div> : null}

      <div className="cf-layout-2-wide">
        {showForm ? (
          <section className="cf-surface cf-surface-padded">
            <h2 className="cf-surface-title">{editingId ? "Editar area" : "Nova area"}</h2>

            <form className="cf-form" onSubmit={handleSubmit}>
              <div>
                <label className="cf-field-label">Nome da area</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))}
                  placeholder="Ex.: Almoxarifado de embalagens"
                />
              </div>

              <div>
                <label className="cf-field-label">Supervisor responsavel</label>
                <select
                  value={form.responsavelSupervisorId}
                  onChange={(e) => setForm((current) => ({ ...current, responsavelSupervisorId: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  {responsaveis.map((responsavel) => (
                    <option key={responsavel.id} value={responsavel.id}>
                      {responsavel.nomeCompleto}
                    </option>
                  ))}
                </select>
              </div>

              <label className="cf-checkbox">
                <input
                  type="checkbox"
                  checked={form.ativa}
                  onChange={(e) => setForm((current) => ({ ...current, ativa: e.target.checked }))}
                />
                Area ativa
              </label>

              <div className="cf-form-actions">
                {editingId ? (
                  <button type="button" className="cf-button cf-button-secondary" onClick={resetForm}>
                    Cancelar
                  </button>
                ) : null}

                <button type="submit" className="cf-button cf-button-primary" disabled={submitting || responsaveis.length === 0}>
                  {submitting ? (editingId ? "Salvando..." : "Criando...") : editingId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <section className="cf-surface">
          <div className="cf-surface-header">
            <h2 className="cf-surface-title">Catalogo</h2>
            <span className="cf-count">{areas.length}</span>
          </div>

          {loading ? (
            <div className="cf-loading">Carregando areas...</div>
          ) : areas.length === 0 ? (
            <div className="cf-empty">Nenhuma area cadastrada.</div>
          ) : (
            <div style={styles.catalogGrid}>
              {areas.map((area) => (
                <article key={area.id} style={styles.catalogCard}>
                  <div style={styles.catalogTop}>
                    <div style={styles.catalogTitleBlock}>
                      <div className="cf-name" style={styles.catalogName}>{area.nome}</div>
                      <div style={styles.catalogMetaLabel}>Responsavel</div>
                      <div style={styles.catalogMetaValue}>{area.responsavelSupervisorNomeCompleto}</div>
                    </div>

                    <span className={`cf-badge ${area.ativa ? "cf-badge-success" : "cf-badge-danger"}`}>
                      {area.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="cf-inline-actions">
                    <button type="button" className="cf-button cf-button-secondary cf-button-small" onClick={() => handleEdit(area)}>
                      Editar
                    </button>
                    {area.ativa ? (
                      <button
                        type="button"
                        className="cf-button cf-button-success cf-button-small"
                        onClick={() => navigate(`/stp/areas/${area.id}/nova-inspecao`)}
                      >
                        Iniciar inspecao
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={`cf-button ${area.ativa ? "cf-button-danger" : "cf-button-success"} cf-button-small`}
                      onClick={() => void handleToggle(area)}
                    >
                      {area.ativa ? "Inativar" : "Ativar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function extractError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.body || error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  catalogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 16,
    padding: 18,
  },
  catalogCard: {
    border: "1px solid #D0E5D8",
    borderRadius: 22,
    background: "linear-gradient(180deg, #FFFFFF 0%, #F7FCF8 100%)",
    minHeight: 182,
    padding: 20,
    display: "grid",
    gap: 16,
    alignContent: "space-between",
    boxShadow: "0 14px 24px rgba(6, 118, 71, 0.05)",
  },
  catalogTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "start",
    flexWrap: "wrap",
  },
  catalogTitleBlock: {
    display: "grid",
    gap: 6,
  },
  catalogName: {
    fontSize: 19,
    lineHeight: 1.15,
  },
  catalogMetaLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#667085",
    fontWeight: 700,
  },
  catalogMetaValue: {
    fontSize: 14.5,
    color: "#344054",
    fontWeight: 600,
  },
};
