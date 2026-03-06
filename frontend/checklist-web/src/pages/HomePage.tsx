import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

type EquipamentoDto = {
  id: string;
  codigo: string;
  descricao: string;
  categoriaNome: string;
  qrId: string;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [qrId, setQrId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verifica se veio mensagem de sucesso na URL
  const sucesso = searchParams.get("sucesso");

  async function handleBuscar() {
    const val = qrId.trim();
    if (!val) {
      setError("Digite um QR ID válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Valida se o QR ID existe
      await api.get<EquipamentoDto>(`/api/equipamentos/por-qr/${val}`);
      // Se existe, redireciona para a página do checklist
      navigate(`/checklist/${val}`);
    } catch (e: any) {
      setError(e?.message ?? "QR ID inválido ou equipamento não encontrado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: 600,
      margin: "0 auto",
      padding: 40,
      textAlign: "center"
    }}>
      <h1>Checklist Empilhadeira</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Digite o QR ID do equipamento para iniciar o checklist
      </p>

      {/* MENSAGEM DE SUCESSO */}
      {sucesso === "1" && (
        <div style={{
          background: "#e8f5e9",
          border: "2px solid #1f6f3d",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}>
          <span style={{ color: "#1f6f3d", fontWeight: 700, fontSize: 16 }}>
            ✓ Checklist enviado com sucesso!
          </span>
        </div>
      )}

      {/* CAMPO QR ID */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 24,
      }}>
        <label style={{ display: "block", marginBottom: 12, fontWeight: 700 }}>
          QR ID do Equipamento:
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <input
            value={qrId}
            onChange={(e) => setQrId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            placeholder="Ex.: 1f0997ac-f894-4fd9-8710-449beeb9349b"
            style={{
              width: 320,
              padding: "12px 12px",
              borderRadius: 10,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />
          <button
            onClick={handleBuscar}
            disabled={loading}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {error && (
          <div style={{ color: "crimson", marginTop: 12 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}