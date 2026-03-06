import { useRef, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import type { ChecklistDto, ChecklistItemTemplateDto, EquipamentoDto, ItemStatus } from "../types";
import { useNavigate } from "react-router-dom";

console.log("ChecklistPage carregou (NOVO)", new Date().toISOString());

type ItemForm = {
  templateId: string;
  status: ItemStatus;
  observacao?: string;
};

type OperadorSugestao = {
  id: string;
  nome: string;
  matricula: string;
};

type EquipSugestao = { id: string; codigo: string; descricao: string; qrId: string };

export function ChecklistPage() {
  const { qrId } = useParams();
  const [loading, setLoading] = useState(true);
  const [equipamento, setEquipamento] = useState<EquipamentoDto | null>(null);
  const [templates, setTemplates] = useState<ChecklistItemTemplateDto[]>([]);
  const [itens, setItens] = useState<Record<string, ItemForm>>({});
  const [operadorId, setOperadorId] = useState(""); // por enquanto manual
  const [operadorQuery, setOperadorQuery] = useState(""); // texto digitado (nome/matrícula)
  const [sugestoesOperador, setSugestoesOperador] = useState<OperadorSugestao[]>([]);
  const [loadingOperador, setLoadingOperador] = useState(false);
  const [obsGerais, setObsGerais] = useState("");
  const [qrIdDemo, setQrIdDemo] = useState("");
  const [result, setResult] = useState<ChecklistDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const operadorBoxRef = useRef<HTMLDivElement | null>(null);
  const [errosItem, setErrosItem] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [equipQuery, setEquipQuery] = useState("");
  const [equipId, setEquipId] = useState<string>("");
  const [equipQrId, setEquipQrId] = useState<string>("");
  const [equipSugestoes, setEquipSugestoes] = useState<EquipSugestao[]>([]);
  const [loadingEquip, setLoadingEquip] = useState(false);
  
  const equipBoxRef = useRef<HTMLDivElement | null>(null);
  
  const allAnswered = useMemo(() => {
    if (templates.length === 0) return false;
    return templates.every(t => itens[t.id]?.status && itens[t.id].status !== "NaoVerificado");
  }, [templates, itens]);

useEffect(() => {
  function handleClickOutside(ev: MouseEvent) {
    const el = equipBoxRef.current;
    if (!el) return;
    if (!el.contains(ev.target as Node)) setEquipSugestoes([]);
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

   useEffect(() => {
  const q = equipQuery.trim();
  if (equipId) return; // se já selecionou, não busca
  if (q.length < 2) {
    setEquipSugestoes([]);
    return;
  }

  const handle = setTimeout(async () => {
    setLoadingEquip(true);
    try {
      // MVP: buscar tudo e filtrar no front (se tiver poucos equipamentos)
      const lista = await api.get<any[]>("/api/equipamentos");

      const filtrado = lista
        .map((e) => ({
          id: e.id,
          codigo: e.codigo,
          descricao: e.descricao,
          qrId: e.qrId,
        }))
        .filter((e) => {
          const qq = q.toUpperCase();
          return (
            (e.codigo ?? "").toUpperCase().includes(qq) ||
            (e.descricao ?? "").toUpperCase().includes(qq) ||
            (e.qrId ?? "").toUpperCase().includes(qq)
          );
        })
        .slice(0, 8);

      setEquipSugestoes(filtrado);
    } catch {
      setEquipSugestoes([]);
    } finally {
      setLoadingEquip(false);
    }
  }, 250);

  return () => clearTimeout(handle);
}, [equipQuery, equipId]); 
  
  useEffect(() => {
        function handleClickOutside(ev: MouseEvent) {
        const el = operadorBoxRef.current;
        if (!el) return;

        const target = ev.target as Node;
            if (!el.contains(target)) {
            setSugestoesOperador([]);
        }
    }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const eq = await api.get<EquipamentoDto>(`/api/equipamentos/por-qr/${qrId}`);
        const tpl = await api.get<ChecklistItemTemplateDto[]>(
          `/api/supervisor/checklist-itens-template?categoriaId=${eq.categoriaId}&ativos=true`
        );

        if (!mounted) return;

        setEquipamento(eq);
        setTemplates(tpl);

        // inicializa itens como "NaoVerificado"
        const initial: Record<string, ItemForm> = {};
        for (const t of tpl) {
          initial[t.id] = { templateId: t.id, status: "NaoVerificado" };
        }
        setItens(initial);
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message ?? "Falha ao carregar");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    if (qrId) load();
    return () => { mounted = false; };
  }, [qrId]);

useEffect(() => {
  const q = operadorQuery.trim();

    if (operadorId) {
    setSugestoesOperador([]);
    setLoadingOperador(false);
    return;
    }

  // Se digitou pouco, não busca e limpa sugestões
  if (q.length < 2) {
    setSugestoesOperador([]);
    setLoadingOperador(false);
    setOperadorId(""); // força seleção válida da lista
    return;
  }

  // Debounce: espera o usuário parar de digitar
  const handle = window.setTimeout(async () => {
    try {
      setLoadingOperador(true);

      const data = await api.get<OperadorSugestao[]>(
        `/api/operadores/busca?query=${encodeURIComponent(q)}&take=10`
      );

      setSugestoesOperador(data);

      // Se o usuário digitou algo que não é uma opção selecionada,
      // mantenha operadorId vazio até ele clicar numa sugestão.
      setOperadorId("");
    } catch {
      setSugestoesOperador([]);
      setOperadorId("");
    } finally {
      setLoadingOperador(false);
    }
    }, 250);

    return () => window.clearTimeout(handle);
    }, [operadorQuery, operadorId]);

  function setStatus(templateId: string, status: ItemStatus) {
    setItens(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], templateId, status, observacao: status === "NOK" ? (prev[templateId]?.observacao ?? "") : "" }
    }));
  }

  function setObs(templateId: string, obs: string) {
    setItens(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], templateId, observacao: obs }
    }));
  }

async function submit() {
  if (!equipamento) return;

  setError(null);
  setResult(null);

  if (!operadorId) {
    setError("Selecione um operador na lista antes de enviar.");
    return;
  }

  if (!allAnswered) {
    setError("Responda todos os itens (OK/NOK/NA) antes de enviar.");
    return;
  }

  const payload = {
    equipamentoId: equipamento.id,
    operadorId: operadorId.trim(),
    itens: templates.map(t => ({
      templateId: t.id,
      status: itens[t.id].status,
      observacao: itens[t.id].status === "NOK" ? (itens[t.id].observacao ?? "") : null
    })),
    observacoesGerais: obsGerais || null
  };

  console.log("PAYLOAD =>", JSON.stringify(payload, null, 2));

  try {
    const created = await api.post<ChecklistDto>("/api/checklists", payload);
    setResult(created);
    
    // REDIRECIONA PARA HOME COM MENSAGEM DE SUCESSO
    setTimeout(() => {
      navigate("/?sucesso=1");
    }, 1500);
  } catch (e: any) {
    setError(e.message ?? "Falha ao enviar");
  }
}

  if (loading) return <div>Carregando...</div>;
  if (error) return <div style={{ color: "crimson" }}>Erro: {error}</div>;
  if (!equipamento) return <div>Equipamento não encontrado.</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Checklist - {equipamento.codigo}</h2>
      <div><b>Descrição:</b> {equipamento.descricao}</div>
      <div><b>Categoria:</b> {equipamento.categoriaNome}</div>
      <div><b>QR:</b> {equipamento.qrId}</div>

      <hr />

      <div ref={operadorBoxRef} style={{ position: "relative", maxWidth: 520 }}>
  <label>
    <b>Operador (digite nome ou matrícula):</b>{" "}
    <input
    value={operadorQuery}
    onChange={(e) => {
        setOperadorQuery(e.target.value);
        setOperadorId(""); // só clique salva o ID
    }}
    style={{
  width: 420,
    border: operadorId ? "2px solid #1f6f3d" : "1px solid #ccc",
    background: operadorId ? "#e8f5e9" : "white",
    color: "#111",
    borderRadius: 6,
    padding: "8px 10px",
    outline: "none",
    opacity: operadorId ? 0.85 : 1,
    cursor: operadorId ? "not-allowed" : "text",
}}
    placeholder=""
    autoComplete="off"
    />

    {operadorId ? (
  <button
    type="button"
    onClick={() => {
      setOperadorId("");
      setOperadorQuery("");
      setSugestoesOperador([]);
    }}
    style={{
      marginLeft: 8,
      padding: "8px 10px",
      borderRadius: 6,
      border: "1px solid #ccc",
      background: "white",
      cursor: "pointer",
    }}
  >
    Trocar
  </button>
) : null}

  </label>

  {loadingOperador ? (
    <div style={{ marginTop: 6, color: "#666" }}>Buscando...</div>
  ) : null}

  {sugestoesOperador.length > 0 ? (
    <div
      style={{
        position: "absolute",
        zIndex: 10,
        top: 44,
        left: 0,
        width: 520,
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "white",
        boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {sugestoesOperador.map((op) => (
        <button
          key={op.id}
          type="button"
          onClick={() => {
        console.log("CLIQUEI NO OPERADOR =>", op);
        setOperadorId(op.id);
        setOperadorQuery(`${op.nome} (${op.matricula})`);
        setSugestoesOperador([]);
        }}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            background: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          <b>{op.nome}</b> — {op.matricula}
        </button>
      ))}
    </div>
  ) : null}

</div>

      <div style={{ marginTop: 12 }}>
        <label>
          <b>Observações gerais:</b><br />
          <textarea value={obsGerais} onChange={e => setObsGerais(e.target.value)} rows={3} style={{ width: "100%" }} />
        </label>
      </div>

      <hr />

      {templates.map(t => {
        const current = itens[t.id]?.status ?? "NaoVerificado";
        return (
          <div key={t.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, marginBottom: 10 }}>
            <div><b>{t.ordem}.</b> {t.descricao}</div>
            {t.instrucao ? <div style={{ color: "#555" }}><i>{t.instrucao}</i></div> : null}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => setStatus(t.id, "OK")} style={{ background: current === "OK" ? "#c7f9cc" : undefined }}>OK</button>
              <button onClick={() => setStatus(t.id, "NOK")} style={{ background: current === "NOK" ? "#ffd6a5" : undefined }}>NOK</button>
              <button onClick={() => setStatus(t.id, "NA")} style={{ background: current === "NA" ? "#bde0fe" : undefined }}>NA</button>
            </div>

            {current === "NOK" ? (
              <div style={{ marginTop: 10 }}>
                <label>
                  Observação (obrigatória se NOK):
                  <input
                    value={itens[t.id]?.observacao ?? ""}
                    onChange={e => setObs(t.id, e.target.value)}
                    style={{ width: "100%" }}
                  />
                </label>
              </div>
            ) : null}
          </div>
        );
      })}

      <button onClick={submit} disabled={!allAnswered} style={{ padding: "10px 14px" }}>
        Enviar checklist
      </button>

      {result ? (
  <div style={{ textAlign: "center", padding: 40 }}>
    <div style={{
      background: "#e8f5e9",
      border: "2px solid #1f6f3d",
      borderRadius: 16,
      padding: 32,
      marginBottom: 24,
    }}>
      <h1 style={{ color: "#1f6f3d", margin: "0 0 8px 0" }}>✓ Checklist Enviado</h1>
      <p style={{ color: "#2e7d32", fontSize: 16, margin: 0 }}>
        Equipamento: <b>{result.equipamentoCodigo}</b>
      </p>
      <p style={{ color: "#2e7d32", fontSize: 14, margin: "4px 0 0 0" }}>
        {new Date(result.dataRealizacao).toLocaleString("pt-BR")}
      </p>
    </div>

    <div style={{
      background: "white",
      border: "1px solid #ddd",
      borderRadius: 12,
      padding: 24,
    }}>
      <h3>Preencher outro checklist</h3>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <input
          value={qrIdDemo}
          onChange={(e) => setQrIdDemo(e.target.value)}
          placeholder="Digite o QR ID do equipamento"
          style={{
            width: 300,
            padding: "12px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />
        <button
          type="button"
          onClick={async () => {
            const val = qrIdDemo.trim();
            if (!val) {
              setError("Digite um QR ID válido.");
              return;
            }

            setLoading(true);
            try {
              const eq = await api.get<EquipamentoDto>(`/api/equipamentos/por-qr/${val}`);
              setEquipamento(eq);
              setResult(null);
              setQrIdDemo("");
              setItens({});
              setOperadorId("");
              setOperadorQuery("");
              setError("");
              setErrosItem({});
            } catch (e: any) {
              setError(e?.message ?? "QR ID inválido ou equipamento não encontrado.");
            } finally {
              setLoading(false);
            }
          }}
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
          {loading ? "Carregando..." : "Carregar"}
        </button>
      </div>
    </div>
  </div>
) : null}
    </div>
  );
}