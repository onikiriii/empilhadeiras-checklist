import { useEffect, useState } from "react";
import { api } from "../../api";

type Categoria = {
  id: string;
  nome: string;
  ativa: boolean;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", ativa: true });

  useEffect(() => {
    loadCategorias();
  }, []);

  async function loadCategorias() {
    setLoading(true);
    try {
      const data = await api.get<Categoria[]>("/api/supervisor/categorias-equipamento");
      setCategorias(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const payload = { nome: form.nome, ativa: form.ativa };

      if (editingId) {
        await api.put(`/api/supervisor/categorias-equipamento/${editingId}`, payload);
      } else {
        await api.post("/api/supervisor/categorias-equipamento", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ nome: "", ativa: true });
      loadCategorias();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar categoria");
    }
  }

  function handleEdit(categoria: Categoria) {
    setForm({ nome: categoria.nome, ativa: categoria.ativa });
    setEditingId(categoria.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      await api.delete(`/api/supervisor/categorias-equipamento/${id}`);
      loadCategorias();
    } catch (e: any) {
      setError(e.message ?? "Erro ao excluir categoria");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <a href="/" className="link" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          ← Voltar ao Início
        </a>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              Categorias de Checklist
            </h1>
            <p style={{ color: "#6B7280", fontSize: 14 }}>
              Gerencie as categorias de equipamentos para os checklists
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm({ nome: "", ativa: true });
            }}
            className="btn btn-primary"
          >
            {showForm ? "Cancelar" : "+ Nova Categoria"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            {editingId ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ maxWidth: 400 }}>
                <label>Nome *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  placeholder="Ex: Empilhadeiras Elétricas"
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
                <label htmlFor="ativa" style={{ margin: 0 }}>Categoria ativa</label>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-success">
                  {editingId ? "Atualizar" : "Criar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="btn btn-secondary"
                >
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
              <th>Nome</th>
              <th>Status</th>
              <th style={{ width: 150 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "#6B7280", padding: 40 }}>
                  Nenhuma categoria cadastrada
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td style={{ fontWeight: 500 }}>{categoria.nome}</td>
                  <td>
                    <span className={`badge ${categoria.ativa ? "badge-success" : "badge-danger"}`}>
                      {categoria.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleEdit(categoria)}
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: 13 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(categoria.id)}
                        className="btn btn-danger"
                        style={{ padding: "6px 12px", fontSize: 13 }}
                      >
                        Excluir
                      </button>
                    </div>
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