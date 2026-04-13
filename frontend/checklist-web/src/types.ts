export type ItemStatus = "NaoVerificado" | "OK" | "NOK" | "NA";

export type EquipamentoDto = {
  id: string;
  setorId: string;
  codigo: string;
  descricao: string;
  ativa: boolean;
  categoriaId: string;
  categoriaNome: string;
  qrId: string;
};

export type ChecklistItemTemplateDto = {
  id: string;
  setorId: string;
  categoriaId: string;
  ordem: number;
  descricao: string;
  instrucao?: string | null;
  ativo: boolean;
};

export type ChecklistDto = {
  id: string;
  setorId: string;
  equipamentoId: string;
  equipamentoCodigo: string;
  operadorId: string;
  operadorNome: string;
  dataRealizacao: string;
  aprovado: boolean;
  observacoesGerais?: string | null;
  status: string;
  assinaturaOperadorBase64?: string | null;
  itens: Array<{
    id: string;
    templateId: string;
    ordem: number;
    descricao: string;
    instrucao?: string | null;
    status: ItemStatus;
    observacao?: string | null;
    imagemNokBase64?: string | null;
    imagemNokNomeArquivo?: string | null;
    imagemNokMimeType?: string | null;
  }>;
};
