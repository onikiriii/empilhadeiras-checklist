import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import "../styles/global.css";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [qrId, setQrId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sucesso = searchParams.get("sucesso");

  useEffect(() => {
    if (sucesso !== "1") return;

    const timer = window.setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [navigate, sucesso]);

  async function handleBuscar() {
    const value = qrId.trim();

    if (!value) {
      setError("Digite um QR ID válido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.get<EquipamentoDto>(`/api/equipamentos/por-qr/${value}`);
      navigate(`/checklist/${value}`);
    } catch (e: any) {
      setError(e?.message ?? "Equipamento não encontrado para este QR ID.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCamera() {
    fileInputRef.current?.click();
  }

  function handleCameraFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("Câmera aberta com sucesso. Falta integrar a leitura automática do QR code.");
    event.target.value = "";
  }

  return (
    <div className="cf-mobile-page">
      <div className="cf-mobile-backdrop cf-mobile-backdrop-top" />
      <div className="cf-mobile-backdrop cf-mobile-backdrop-bottom" />

      <div className="cf-mobile-shell">
        <section className="cf-mobile-brand-surface">
          <div className="cf-mobile-brand-row">
            <div className="cf-mobile-logo">
              <QrIcon />
            </div>

            <div>
              <div className="cf-mobile-brand-name">CheckFlow</div>
              <div className="cf-mobile-brand-meta">Operação de checklist</div>
            </div>
          </div>

          <div className="cf-mobile-brand-actions">
            <button
              type="button"
              className="cf-mobile-toplink"
              onClick={() => navigate("/login")}
            >
              Acesso administrativo
            </button>
          </div>
        </section>

        {sucesso === "1" ? (
          <div className="cf-alert cf-alert-success">
            Checklist enviado com sucesso. Você já pode iniciar uma nova inspeção.
          </div>
        ) : null}

        <section className="cf-mobile-surface cf-mobile-surface-attached">
          <div className="cf-mobile-panel-header">
            <div className="cf-mobile-panel-icon">
              <ScanIcon />
            </div>

            <div>
              <h1 className="cf-mobile-panel-title">Iniciar checklist</h1>
              <p className="cf-mobile-panel-text">Leia ou digite o QR ID do equipamento.</p>
            </div>
          </div>

          <div className="cf-mobile-field-stack">
            <div>
              <label className="cf-field-label">QR ID</label>
              <div className="cf-mobile-input-shell">
                <span className="cf-mobile-input-icon">
                  <QrSmallIcon />
                </span>

                <input
                  value={qrId}
                  onChange={(e) => setQrId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleBuscar()}
                  placeholder="Digite o código"
                  className="cf-mobile-input with-leading with-trailing"
                />

                <button
                  type="button"
                  className="cf-mobile-icon-button"
                  onClick={handleOpenCamera}
                  aria-label="Abrir câmera"
                  title="Abrir câmera"
                >
                  <CameraIcon />
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraFileChange}
              style={{ display: "none" }}
            />

            {error ? <div className="cf-alert cf-alert-error">{error}</div> : null}

            <button
              type="button"
              className="cf-button cf-button-primary cf-mobile-submit"
              onClick={() => void handleBuscar()}
              disabled={loading}
            >
              <span className="cf-mobile-button-icon">
                <ArrowRightIcon />
              </span>
              {loading ? "Validando..." : "Continuar"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function QrIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1.2" stroke="white" strokeWidth="2" />
      <rect x="15" y="3" width="6" height="6" rx="1.2" stroke="white" strokeWidth="2" />
      <rect x="3" y="15" width="6" height="6" rx="1.2" stroke="white" strokeWidth="2" />
      <path d="M15 15H18V18H15V15Z" fill="white" />
      <path d="M18 18H21V21H18V18Z" fill="white" />
      <path d="M18 12H21V15H18V12Z" fill="white" />
      <path d="M12 18H15V21H12V18Z" fill="white" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4H5C4.45 4 4 4.45 4 5V7" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 4H19C19.55 4 20 4.45 20 5V7" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 20H5C4.45 20 4 19.55 4 19V17" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 20H19C19.55 20 20 19.55 20 19V17" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 12H17" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function QrSmallIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="#0057B8" strokeWidth="2" />
      <rect x="16" y="3" width="5" height="5" rx="1" stroke="#0057B8" strokeWidth="2" />
      <rect x="3" y="16" width="5" height="5" rx="1" stroke="#0057B8" strokeWidth="2" />
      <path d="M16 16H18.5V18.5H16V16Z" fill="#0057B8" />
      <path d="M18.5 18.5H21V21H18.5V18.5Z" fill="#0057B8" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5L10.2 3.5C10.5 3.18 10.9 3 11.32 3H12.68C13.1 3 13.5 3.18 13.8 3.5L15 5H18C19.66 5 21 6.34 21 8V17C21 18.66 19.66 20 18 20H6C4.34 20 3 18.66 3 17V8C3 6.34 4.34 5 6 5H9Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.5" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
