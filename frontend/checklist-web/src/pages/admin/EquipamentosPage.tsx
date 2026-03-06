import { useEffect, useState } from "react";
import { api } from "../../api";

type Categoria = { id: string; nome: string };
type Equipamento = {
  id: string;
  codigo: string;
  descricao: string;
  qrId: string;
  categoriaId: string;
  categoriaNome: string;
  ativa: boolean;
};

export default function EquipamentosPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ codigo: "", descricao: "", categoriaId: "", ativa: true });

  useEffect(() => { loadCategorias(); loadEquipamentos(); }, []);

  async function loadCategorias() {
    try {
      const data = await api.get<Categoria[]>("/api/supervisor/categorias-equipamento");
      setCategorias(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar categorias");
    }
  }

  async function loadEquipamentos() {
    setLoading(true);
    try {
      const data = await api.get<Equipamento[]>("/api/equipamentos");
      setEquipamentos(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar equipamentos");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/api/equipamentos/${editingId}`, form);
      } else {
        await api.post("/api/equipamentos", form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ codigo: "", descricao: "", categoriaId: "", ativa: true });
      loadEquipamentos();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar equipamento");
    }
  }

  function handleEdit(equipamento: Equipamento) {
    setForm({
      codigo: equipamento.codigo,
      descricao: equipamento.descricao,
      categoriaId: equipamento.categoriaId,
      ativa: equipamento.ativa,
    });
    setEditingId(equipamento.id);
    setShowForm(true);
  }

  function generateQrId() {
    const qrId = crypto.randomUUID();
    setForm({ ...form, codigo: qrId.substring(0, 8).toUpperCase() });
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Carregando...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              Equipamentos
            </h1>
            <p style={{ color: "#6B7280", fontSize: 14 }}>
              Gerencie os equipamentos que serão inspecionados nos checklists
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ codigo: "", descricao: "", categoriaId: "", ativa: true }); }}
            className="btn btn-primary"
          >
            {showForm ? "Cancelar" : "+ Novo Equipamento"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            {editingId ? "Editar Equipamento" : "Novo Equipamento"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, maxWidth: 800 }}>
                <div>
                  <label>Código *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={form.codigo}
                      onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                      required
                      placeholder="Ex: EMP001"
                      disabled={!!editingId}
                      style={{ background: editingId ? "#F5F7FA" : "white" }}
                    />
                    {!editingId && (
                      <button type="button" onClick={generateQrId} className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                        Gerar
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label>Categoria *</label>
                  <select
                    value={form.categoriaId}
                    onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ maxWidth: 600 }}>
                <label>Descrição *</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  required
                  placeholder="Ex: Empilhadeira Toyota 2.5 toneladas"
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.ativa}
                  onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
                  id="ativa"
                  style={{ width: "auto" }}
                />
                <label htmlFor="ativa" style={{ margin: 0 }}>Equipamento ativo</label>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-success">
                  {editingId ? "Atualizar" : "Criar"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {equipamentos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#6B7280", padding: 40 }}>
                  Nenhum equipamento cadastrado
                </td>
              </tr>
            ) : (
              equipamentos.map((equipamento) => (
                <tr key={equipamento.id}>
                  <td>
                    <span className="badge badge-primary">{equipamento.codigo}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{equipamento.descricao}</td>
                  <td>{equipamento.categoriaNome}</td>
                  <td>
                    <span className={`badge ${equipamento.ativa ? "badge-success" : "badge-danger"}`}>
                      {equipamento.ativa ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(equipamento)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}