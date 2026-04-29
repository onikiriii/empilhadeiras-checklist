# Architecture

Visão estrutural do CheckFlow.

## Visão geral

A solução está organizada em três blocos principais:

1. backend ASP.NET Core
2. frontend React
3. banco MySQL

## Backend

### Stack

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- JWT Bearer Authentication

### Organização

- `Controllers/`: entrada HTTP
- `Dtos/`: contratos de entrada e saída
- `Models/`: entidades do domínio
- `Data/`: `AppDbContext` e configurações do EF Core
- `Security/`: autenticação, claims e emissão de token
- `Support/`: componentes auxiliares
- `Options/`: binding de configuração

### Contextos funcionais

- checklist operacional
- supervisão operacional
- STP
- administração
- autenticação de operador

## Frontend

### Stack

- React 19
- Vite
- React Router
- TypeScript

### Estrutura

- `src/pages/`: páginas e fluxos
- `src/api.ts`: cliente HTTP principal
- `src/operator-api.ts`: cliente do fluxo operacional
- `src/types.ts`: tipos compartilhados

### Responsabilidades

- autenticação administrativa
- autenticação operacional
- administração de catálogos
- checklist operacional mobile-first
- operação STP

## Banco de dados

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

### Padrão de persistência

- modelo relacional em MySQL
- mapeamento via Entity Framework Core
- migrations versionadas no repositório

## Fluxos arquiteturais

### Checklist operacional

1. operador autentica
2. frontend consulta equipamento e template
3. checklist é enviado ao backend
4. backend persiste checklist e itens

### Supervisão operacional

1. supervisor acessa dashboard setorial
2. backend agrega histórico e status operacionais
3. tratativas de não conformidade são registradas e auditadas

### STP

1. inspetor opera catálogo de áreas
2. inspeções são executadas em tela operacional dedicada
3. histórico e documentos permanecem vinculados ao domínio STP

## Diretrizes

- separação entre catálogo e evento operacional
- autenticação distinta para contexto administrativo e contexto operacional
- dependência explícita de configuração externa para segredos e conexão
- evolução de esquema controlada por migrations
