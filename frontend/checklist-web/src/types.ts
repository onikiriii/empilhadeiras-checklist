export type ItemStatus = "NaoVerificado" | "OK" | "NOK" | "NA";

export type EquipamentoDto = {
  id: string;
  codigo: string;
  descricao: string;
  ativa: boolean;
  categoriaId: string;
  categoriaNome: string;
  qrId: string;
};

export type ChecklistItemTemplateDto = {
  id: string;
  categoriaId: string;
  ordem: number;
  descricao: string;
  instrucao?: string | null;
  ativo: boolean;
};

export type ChecklistDto = {
  id: string;
  equipamentoId: string;
  equipamentoCodigo: string;
  operadorId: string;
  operadorNome: string;
  dataRealizacao: string;
  aprovado: boolean;
  observacoesGerais?: string | null;
  status: string;
  itens: Array<{
    id: string;
    templateId: string;
    ordem: number;
    descricao: string;
    instrucao?: string | null;
    status: ItemStatus;
    observacao?: string | null;
  }>;
};