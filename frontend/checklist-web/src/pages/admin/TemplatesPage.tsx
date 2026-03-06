import { useEffect, useState } from "react";
import { api } from "../../api";

type Categoria = { id: string; nome: string };
type TemplateItem = {
  id: string;
  categoriaId: string;
  ordem: number;
  descricao: string;
  instrucao: string;
  ativo: boolean;
};

export default function TemplatesPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ordem: 1, descricao: "", instrucao: "", ativo: true });

  useEffect(() => { loadCategorias(); }, []);

  useEffect(() => {
    if (selectedCategoria) loadTemplates(selectedCategoria);
  }, [selectedCategoria]);

  async function loadCategorias() {
    try {
      const data = await api.get<Categoria[]>("/api/supervisor/categorias-equipamento");
      setCategorias(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar categorias");
    }
  }

  async function loadTemplates(categoriaId: string) {
    setLoading(true);
    try {
      const data = await api.get<TemplateItem[]>(
        `/api/supervisor/checklist-itens-template?categoriaId=${categoriaId}`
      );
      setTemplates(data.sort((a, b) => a.ordem - b.ordem));
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const payload = {
        categoriaId: selectedCategoria,
        ordem: form.ordem,
        descricao: form.descricao,
        instrucao: form.instrucao || null,
        ativo: form.ativo,
      };

      if (editingId) {
        await api.put(`/api/supervisor/checklist-itens-template/${editingId}`, payload);
      } else {
        await api.post("/api/supervisor/checklist-itens-template", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ ordem: templates.length + 1, descricao: "", instrucao: "", ativo: true });
      loadTemplates(selectedCategoria);
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar template");
    }
  }

  function handleEdit(template: TemplateItem) {
    setForm({
      ordem: template.ordem,
      descricao: template.descricao,
      instrucao: template.instrucao || "",
      ativo: template.ativo,
    });
    setEditingId(template.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    try {
      await api.delete(`/api/supervisor/checklist-itens-template/${id}`);
      loadTemplates(selectedCategoria);
    } catch (e: any) {
      setError(e.message ?? "Erro ao excluir template");
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              Itens do Template
            </h1>
            <p style={{ color: "#6B7280", fontSize: 14 }}>
              Configure os itens de verificação para cada categoria de equipamento
            </p>
          </div>
          {selectedCategoria && (
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ordem: templates.length + 1, descricao: "", instrucao: "", ativo: true }); }} className="btn btn-primary">
              + Novo Item
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Category Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <label style={{ marginBottom: 8 }}>Selecionar Categoria</label>
        <select
          value={selectedCategoria}
          onChange={(e) => setSelectedCategoria(e.target.value)}
          style={{ maxWidth: 400 }}
        >
          <option value="">Selecione uma categoria...</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            {editingId ? "Editar Item" : "Novo Item"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 16 }}>
                <div>
                  <label>Ordem *</label>
                  <input
                    type="number"
                    value={form.ordem}
                    onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    id="ativo"
                    style={{ width: "auto" }}
                  />
                  <label htmlFor="ativo" style={{ margin: 0 }}>Item ativo</label>
                </div>
              </div>
              <div style={{ maxWidth: 600 }}>
                <label>Descrição *</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  required
                  placeholder="Ex: Pneus estão em bom estado?"
                />
              </div>
              <div style={{ maxWidth: 600 }}>
                <label>Instrução</label>
                <textarea
                  value={form.instrucao}
                  onChange={(e) => setForm({ ...form, instrucao: e.target.value })}
                  rows={2}
                  placeholder="Ex: Verifique se não há cortes ou desgaste excessivo"
                />
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
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>Carregando...</div>
      ) : !selectedCategoria ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>
          Selecione uma categoria para ver os itens do template
        </div>
      ) : templates.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "#6B7280" }}>
          Nenhum item cadastrado para esta categoria. Clique em "+ Novo Item" para adicionar.
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Ordem</th>
                <th>Descrição</th>
                <th>Instrução</th>
                <th style={{ width: 100 }}>Status</th>
                <th style={{ width: 150 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id}>
                  <td>
                    <span className="badge badge-primary">#{template.ordem}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{template.descricao}</td>
                  <td style={{ color: "#6B7280", fontSize: 13 }}>{template.instrucao || "-"}</td>
                  <td>
                    <span className={`badge ${template.ativo ? "badge-success" : "badge-danger"}`}>
                      {template.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleEdit(template)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(template.id)} className="btn btn-danger" style={{ padding: "6px 12px", fontSize: 13 }}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}