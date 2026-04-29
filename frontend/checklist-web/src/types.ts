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

export type StpAreaChecklistResultado = "Check" | "X";

export type StpAreaChecklistTemplateSummaryDto = {
  id: string;
  setorId: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  totalItens: number;
};

export type StpAreaChecklistTemplateItemDto = {
  id: string;
  ordem: number;
  descricao: string;
  instrucao?: string | null;
  ativo: boolean;
};

export type StpAreaChecklistTemplateDetailDto = {
  id: string;
  setorId: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  itens: StpAreaChecklistTemplateItemDto[];
};

export type StpAreaResponsavelSupervisorDto = {
  id: string;
  nomeCompleto: string;
};

export type StpAreaInspecaoDto = {
  id: string;
  setorId: string;
  nome: string;
  responsavelSupervisorId: string;
  responsavelSupervisorNomeCompleto: string;
  ativa: boolean;
};

export type StpAreaChecklistItemDto = {
  id: string;
  templateItemId: string;
  ordem: number;
  descricao: string;
  instrucao?: string | null;
  resultado: StpAreaChecklistResultado;
  observacao?: string | null;
};

export type StpAreaChecklistListItemDto = {
  id: string;
  templateId: string;
  templateCodigo: string;
  templateNome: string;
  dataRealizacao: string;
  inspetorNomeCompleto: string;
  areaInspecaoId?: string | null;
  areaInspecaoNome: string;
  responsavelAreaSupervisorId?: string | null;
  responsavelAreaNomeCompleto: string;
  totalItens: number;
  totalCheck: number;
  totalX: number;
};

export type StpAreaChecklistDetailDto = {
  id: string;
  setorId: string;
  areaInspecaoId?: string | null;
  areaInspecaoNome: string;
  templateId: string;
  templateCodigo: string;
  templateNome: string;
  dataRealizacao: string;
  dataReferencia: string;
  inspetorSupervisorId: string;
  inspetorNomeCompleto: string;
  responsavelAreaSupervisorId?: string | null;
  responsavelAreaNomeCompleto: string;
  comportamentosPreventivosObservados?: string | null;
  atosInsegurosObservados?: string | null;
  condicoesInsegurasConstatadas?: string | null;
  assinaturaInspetorBase64: string;
  assinaturaResponsavelPresenteBase64: string;
  itens: StpAreaChecklistItemDto[];
};

export type StpDocumentoEmpresaSummaryDto = {
  id: string;
  setorId: string;
  nome: string;
  ativa: boolean;
  totalDocumentos: number;
  totalFuncionarios: number;
};

export type StpDocumentoFuncionarioSummaryDto = {
  id: string;
  empresaId: string;
  nome: string;
  cargo?: string | null;
  ativo: boolean;
  totalDocumentos: number;
};

export type StpDocumentoArquivoDto = {
  id: string;
  nome: string;
  nomeArquivoOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  criadoEm: string;
};
