import { useState } from "react";

const API_BASE = "http://localhost:5204";

export default function App() {
  const [qrId, setQrId] = useState("");
  const [equipamento, setEquipamento] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [operadorId, setOperadorId] = useState("");
  const [status, setStatus] = useState("");
  const [erro, setErro] = useState("");

  async function buscarPorQr() {
    setErro("");
    setStatus("Buscando equipamento...");
    setEquipamento(null);
    setTemplates([]);

    const qr = (qrId ?? "").trim();
    if (!qr) {
      setStatus("");
      setErro("Informe um QR ID válido.");
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/equipamentos/por-qr/${encodeURIComponent(qr)}`);

      if (resp.status === 404) {
        setStatus("");
        setErro(`Equipamento com QR '${qr}' não encontrado.`);
        return;
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        setStatus("");
        setErro(`Erro ao buscar equipamento (${resp.status}): ${text}`);
        return;
      }

      const data = await resp.json();
      setEquipamento(data);

      // Buscar templates da categoria
      const respTpl = await fetch(`${API_BASE}/api/supervisor/checklist-itens-template?categoriaId=${encodeURIComponent(data.categoriaId)}&ativos=true`);
      if (respTpl.ok) {
        const tplData = await respTpl.json();
        setTemplates(tplData);
      }

      setStatus("Equipamento e templates carregados.");
    } catch (e) {
      setStatus("");
      setErro(`Falha de rede: ${e?.message ?? e}`);
    }
  }

  async function enviarChecklist() {
    setErro("");
    setStatus("Enviando checklist...");

    if (!equipamento || templates.length === 0) {
      setStatus("");
      setErro("Busque o equipamento primeiro.");
      return;
    }

    if (!operadorId.trim()) {
      setStatus("");
      setErro("Informe o OperadorId.");
      return;
    }

    const body = {
      equipamentoId: equipamento.id,
      operadorId: operadorId.trim(),
      itens: templates.map(t => ({
        templateId: t.id,
        status: "OK", // simplificado: todos OK
        observacao: null
      })),
      observacoesGerais: null
    };

    try {
      const resp = await fetch(`${API_BASE}/api/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        setStatus("");
        setErro(`Erro ao enviar (${resp.status}): ${text}`);
        return;
      }

      const data = await resp.json();
      setStatus(`Checklist enviado. Id: ${data.id} | Status: ${data.status}`);
    } catch (e) {
      setStatus("");
      setErro(`Falha de rede: ${e?.message ?? e}`);
    }
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Checklist Empilhadeira (NOVO MODELO)</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={qrId}
          onChange={(e) => setQrId(e.target.value)}
          placeholder="QR ID (GUID)"
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={buscarPorQr} style={{ padding: "10px 14px" }}>
          Buscar por QR
        </button>
      </div>

      {equipamento && (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <div><b>Código:</b> {equipamento.codigo}</div>
          <div><b>Descrição:</b> {equipamento.descricao}</div>
          <div><b>Categoria:</b> {equipamento.categoriaNome}</div>
          <div><b>QR ID:</b> {equipamento.qrId}</div>
        </div>
      )}

      {templates.length > 0 && (
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <div><b>Templates da categoria ({templates.length}):</b></div>
          <ul>
            {templates.map(t => (
              <li key={t.id}>{t.ordem}. {t.descricao}</li>
            ))}
          </ul>
        </div>
      )}

      <h2>Enviar checklist</h2>

      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <input value={operadorId} onChange={(e) => setOperadorId(e.target.value)} disabled={!!operadorId} placeholder="OperadorId (GUID)" style={{ padding: 10 }} />

        <button onClick={enviarChecklist} disabled={!equipamento} style={{ padding: "10px 14px" }}>
          Enviar checklist
        </button>
      </div>

      {status && (
        <div style={{ background: "#118a3b", color: "#ffffff", padding: 10, borderRadius: 6, marginBottom: 8 }}>
          {status}
        </div>
      )}

      {erro && (
        <div style={{ background: "#e41414", color: "#ffffff", padding: 10, borderRadius: 6 }}>
          {erro}
        </div>
      )}
    </div>
  );
}