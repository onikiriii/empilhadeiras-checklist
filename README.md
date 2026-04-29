# CheckFlow

Sistema corporativo para checklist operacional de empilhadeiras, supervisão de não conformidades, inspeções de segurança do trabalho e administração de catálogos operacionais.

## Escopo funcional

- checklist operacional autenticado por operador
- supervisão operacional por setor
- tratativa e histórico de itens não conformes
- inspeções STP por área
- controle documental STP por empresa e funcionário
- administração de setores, equipamentos, operadores, templates e acessos
- fechamento mensal de checklists

## Arquitetura

### Backend

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- MySQL
- JWT Bearer Authentication

Estrutura principal:

- `Controllers/`
- `Models/`
- `Dtos/`
- `Data/`
- `Security/`
- `Support/`
- `Options/`

### Frontend

- React 19
- Vite
- React Router
- TypeScript

Estrutura principal:

- `src/pages/`
- `src/types.ts`
- `src/api.ts`
- `src/operator-api.ts`

## Módulos

### Operacional

- autenticação de operador
- leitura de equipamento por QR Code
- checklist por categoria de equipamento
- assinatura e envio

### Supervisão

- dashboard por setor
- histórico de checklists
- painel de itens não conformes
- atribuição, andamento e conclusão de tratativas
- fechamento mensal

### STP

- catálogo de áreas de inspeção
- inspeção de área em tela operacional dedicada
- histórico STP
- controle de documentos

### Administração

- setores
- categorias de equipamento
- equipamentos
- operadores
- templates
- usuários supervisores
- usuários inspetores

## Perfis de acesso

- `Master`
- `Supervisor`
- `Inspetor`
- `Operador`

Policies principais:

- `MasterReady`
- `SectorSupervisorReady`
- `SafetyWorkReady`
- `MaterialsInspectionReady`
- `OperatorChecklistReady`

## Estrutura do repositório

```text
empilhadeiras-checklist/
|-- backend/
|   `-- Checklist.Api/
|-- frontend/
|   `-- checklist-web/
|-- docs/
|-- infra/
|-- DEPLOY.md
|-- empilhadeiras-checklist.sln
`-- README.md
```

## Banco de dados

Entidades centrais:

- `Setor`
- `UsuarioSupervisor`
- `UsuarioSupervisorModulo`
- `Operador`
- `CategoriaEquipamento`
- `Equipamento`
- `Checklist`
- `ChecklistItem`
- `ChecklistItemTemplate`
- `ChecklistItemAcao`
- `StpAreaInspecao`
- `StpAreaChecklist`
- `StpAreaChecklistItem`
- `StpDocumentoEmpresa`
- `StpDocumentoFuncionario`

## Configuração

Variáveis mínimas da API:

- `ConnectionStrings__Default`
- `Auth__JwtKey`
- `Auth__Issuer`
- `Auth__Audience`

Variáveis recomendadas:

- `Cors__AllowedOrigins`
- `ASPNETCORE_ENVIRONMENT`

Exemplo:

```env
ConnectionStrings__Default=Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;
Auth__JwtKey=CHAVE_FORTE_DA_APLICACAO
Auth__Issuer=CheckFlow.Api
Auth__Audience=CheckFlow.Web
```

Variável principal do frontend:

```env
VITE_API_BASE_URL=https://api.checkflow.empresa.com.br
```

## Execução local

### Backend

```powershell
$env:Auth__JwtKey='UMA_CHAVE_LOCAL_FORTE'
$env:ConnectionStrings__Default='Server=localhost;Port=3306;Database=CheckFlow;User ID=usuario;Password=senha;SslMode=Required;AllowPublicKeyRetrieval=True;'
dotnet run --no-build --project backend/Checklist.Api/Checklist.Api.csproj --urls http://localhost:5204
```

Healthcheck:

```text
http://localhost:5204/health
```

### Frontend

```powershell
cd frontend/checklist-web
$env:VITE_API_BASE_URL='http://localhost:5204'
npm ci
npm run dev
```

## Build

### Backend

```powershell
dotnet build backend/Checklist.Api/Checklist.Api.csproj
dotnet test backend/Checklist.Api.Tests/Checklist.Api.Tests.csproj
```

### Frontend

```powershell
cd frontend/checklist-web
npm run build
```

## Operação corporativa

- frontend e backend em infraestrutura corporativa ou homologada
- banco MySQL corporativo
- segredos fora do repositório
- SSL habilitado para conexão com banco
- CORS restrito a origens explícitas
- migrations controladas pelo processo de implantação

## Observabilidade

Endpoint exposto:

- `GET /health`

## Documentação complementar

- [DEPLOY.md](DEPLOY.md)
- [docs/mysql-corporate-migration-guide.md](docs/mysql-corporate-migration-guide.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api-overview.md](docs/api-overview.md)
