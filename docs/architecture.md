# Architecture Overview

## Visão geral

O sistema está organizado em três blocos principais:

1. backend ASP.NET Core
2. frontend React + Vite
3. banco MySQL

## Backend

### Camadas principais

- `Controllers/`: entrada HTTP
- `Dtos/`: contratos de entrada e saída
- `Models/`: entidades do domínio
- `Data/`: `AppDbContext` e configurações do EF Core
- `Security/`: autenticação, claims e emissão de JWT
- `Support/`: helpers e componentes auxiliares
- `Options/`: binding de configuração

### Contextos principais

- checklist operacional
- supervisão operacional
- STP
- administração
- autenticação de operador

## Frontend

### Responsabilidades

- login administrativo
- login operacional
- módulos administrativos
- checklist operacional mobile-first
- módulo STP

### Estrutura principal

- `src/pages/`: páginas e fluxos
- `src/api.ts`: cliente HTTP principal
- `src/operator-api.ts`: cliente do fluxo operacional
- `src/types.ts`: tipos compartilhados

## Banco

### Entidades centrais

- `Checklist`
- `ChecklistItem`
- `ChecklistItemTemplate`
- `ChecklistItemAcao`
- `Operador`
- `Equipamento`
- `Setor`
- `UsuarioSupervisor`
- `StpAreaInspecao`
- `StpAreaChecklist`
- `StpDocumentoEmpresa`
- `StpDocumentoFuncionario`

## Fluxos relevantes

### Checklist operacional

1. operador autentica
2. operador acessa equipamento
3. sistema carrega template
4. respostas são enviadas
5. backend persiste checklist e itens

### Supervisão

1. supervisor acessa dashboard
2. visualiza histórico
3. acompanha itens não conformes
4. atribui e conclui tratativas

### STP

1. inspetor acessa áreas
2. inicia inspeção por área
3. responde checklist STP
4. consulta histórico
5. opera controle de documentos
