import { useEffect, useState } from "react";
import { api } from "../../api";

type Operador = {
  id: string;
  nome: string;
  matricula: string;
  ativo: boolean;
};

export default function OperadoresPage() {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", matricula: "", ativo: true });

  useEffect(() => { loadOperadores(); }, []);

  async function loadOperadores() {
    setLoading(true);
    try {
      const data = await api.get<Operador[]>("/api/operadores");
      setOperadores(data);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar operadores");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      if (editingId) {
        await api.put(`/api/operadores/${editingId}`, form);
      } else {
        await api.post("/api/operadores", form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ nome: "", matricula: "", ativo: true });
      loadOperadores();
    } catch (e: any) {
      setError(e.message ?? "Erro ao salvar operador");
    }
  }

  function handleEdit(operador: Operador) {
    setForm({ nome: operador.nome, matricula: operador.matricula, ativo: operador.ativo });
    setEditingId(operador.id);
    setShowForm(true);
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
              Operadores
            </h1>
            <p style={{ color: "#6B7280", fontSize: 14 }}>
              Gerencie os operadores que realizam os checklists
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ nome: "", matricula: "", ativo: true }); }}
            className="btn btn-primary"
          >
            {showForm ? "Cancelar" : "+ Novo Operador"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            {editingId ? "Editar Operador" : "Novo Operador"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 16, maxWidth: 600 }}>
                <div>
                  <label>Nome *</label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label>Matrícula *</label>
                  <input
                    value={form.matricula}
                    onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                    required
                    placeholder="Ex: 12345"
                  />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  id="ativo"
                  style={{ width: "auto" }}
                />
                <label htmlFor="ativo" style={{ margin: 0 }}>Operador ativo</label>
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
              <th>Nome</th>
              <th>Matrícula</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {operadores.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "#6B7280", padding: 40 }}>
                  Nenhum operador cadastrado
                </td>
              </tr>
            ) : (
              operadores.map((operador) => (
                <tr key={operador.id}>
                  <td style={{ fontWeight: 500 }}>{operador.nome}</td>
                  <td>
                    <span className="badge badge-gray">{operador.matricula}</span>
                  </td>
                  <td>
                    <span className={`badge ${operador.ativo ? "badge-success" : "badge-danger"}`}>
                      {operador.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(operador)} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }}>
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