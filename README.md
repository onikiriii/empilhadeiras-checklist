# CheckFlow

Sistema corporativo para checklist operacional de empilhadeiras, supervisão de itens não conformes, inspeções de segurança do trabalho e controles auxiliares de operação.

## Visão geral

O projeto atende quatro frentes principais:

1. checklist operacional de equipamentos por operador autenticado
2. supervisão operacional por setor
3. segurança do trabalho com inspeções de área
4. administração de catálogos, acessos e fechamentos mensais

O repositório contém:

- `backend/Checklist.Api`: API ASP.NET Core
- `frontend/checklist-web`: SPA React + Vite
- `infra/`: apoio para execução local
- `docs/`: guias complementares

## Módulos funcionais

### Checklist operacional

Fluxo principal:

1. operador faz login operacional
2. operador acessa o equipamento por QR Code
3. sistema carrega o checklist da categoria do equipamento
4. operador responde os itens
5. item `NOK` exige observação e pode receber imagem
6. operador assina e envia

Resultado:

- checklist salvo por equipamento
- checklist vinculado ao operador autenticado
- histórico disponível para supervisão

### Supervisão operacional

Responsabilidades:

- dashboard de equipamentos por setor
- histórico de checklists
- painel de itens não conformes
- atribuição, acompanhamento e conclusão de tratativas
- fechamento mensal de checklists

### Segurança do trabalho

Responsabilidades:

- cadastro de áreas de inspeção
- templates STP
- nova inspeção de área em tela operacional dedicada
- histórico de inspeções
- controle de documentos por empresa e funcionário

### Administração

Responsabilidades:

- setores
- categorias de equipamento
- equipamentos
- operadores
- templates de checklist
- usuários supervisores
- usuários inspetores

## Perfis de acesso

### Master

- administra setores
- cria e edita supervisores
- cria e edita inspetores

### Supervisor

- acessa supervisão operacional
- visualiza dashboard do setor
- acompanha checklists
- trata itens não conformes
- executa fechamento mensal

### Inspetor

- acessa segurança do trabalho
- acessa inspeção de materiais
- executa fluxos técnicos conforme os módulos liberados

### Operador

- faz login operacional próprio
- executa checklist de equipamento
- não acessa o backoffice administrativo

## Arquitetura da aplicação

### Backend

Stack principal:

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- MySQL
- JWT Bearer Authentication

Organização principal:

- `Controllers/`: endpoints HTTP
- `Models/`: entidades do domínio
- `Dtos/`: contratos de entrada e saída
- `Data/`: `AppDbContext` e configurações do EF
- `Security/`: JWT, hash de senha e leitura de claims
- `Support/`: helpers e componentes auxiliares

### Frontend

Stack principal:

- React 19
- Vite
- React Router
- TypeScript

Responsabilidades:

- login administrativo
- login operacional do operador
- páginas de administração
- checklist mobile-first
- módulo STP

## Estrutura do repositório

```text
empilhadeiras-checklist/
|-- backend/
|   `-- Checklist.Api/
|-- docs/
|-- frontend/
|   `-- checklist-web/
|-- infra/
|-- DEPLOY.md
|-- empilhadeiras-checklist.sln
`-- README.md
```

## Domínios principais do banco

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

## Autenticação e autorização

### Autenticação administrativa

Usada por:

- master
- supervisor
- inspetor

Base:

- JWT
- claims de usuário
- claims de setor
- claims de módulos liberados

### Autenticação operacional

Usada por:

- operador

Base:

- login e senha próprios do operador
- token JWT independente do fluxo administrativo
- checklist vinculado ao operador autenticado

### Policies principais

O backend usa policies para proteger cada contexto:

- `MasterReady`
- `SectorSupervisorReady`
- `SafetyWorkReady`
- `MaterialsInspectionReady`
- `OperatorChecklistReady`

## Fluxos principais do sistema

### Fluxo 1. Checklist de equipamento

1. operador autentica
2. operador acessa equipamento por QR
3. sistema carrega itens do checklist
4. operador responde itens
5. assinatura e envio
6. supervisão passa a enxergar o registro

### Fluxo 2. Tratativa de item não conforme

1. supervisor abre painel de itens não conformes
2. supervisor atribui responsável
3. registra andamento da tratativa
4. conclui item
5. histórico fica registrado

### Fluxo 3. Inspeção STP

1. inspetor acessa módulo STP
2. escolhe área cadastrada
3. abre tela dedicada de nova inspeção
4. responde itens da inspeção
5. coleta rubricas
6. salva e consulta histórico

### Fluxo 4. Controle de documentos STP

1. usuário abre lista de empresas
2. seleciona empresa
3. escolhe entre documentos da empresa e funcionários
4. envia arquivos e visualiza histórico documental

## Requisitos de produção corporativa

Para produção corporativa, o projeto deve ser operado com:

- frontend e backend hospedados em infraestrutura corporativa ou homologada
- banco MySQL corporativo
- segredos fora do repositório
- SSL habilitado para conexão com banco
- CORS restrito a origens explícitas
- migrations controladas pelo processo de implantação
- seed inicial controlado

## Configuração obrigatória

O backend não sobe sem configuração mínima.

### Variáveis essenciais da API

- `ConnectionStrings__Default`
- `Auth__JwtKey`
- `Auth__Issuer`
- `Auth__Audience`

### Variáveis recomendadas

- `Cors__AllowedOrigins`
- `ASPNETCORE_ENVIRONMENT`

### Exemplo de connection string

```text
Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;
```

## Política de segredos

O repositório não deve guardar:

- chave JWT real
- senha real de banco
- senha real do usuário bootstrap
- credenciais de produção

Arquivos de referência:

- `backend/Checklist.Api/appsettings.Corporate.example.json`
- `backend/Checklist.Api/appsettings.Development.example.json`

## Banco de dados e migrations

Comandos principais:

```powershell
dotnet ef migrations add NomeDaMigration --project backend/Checklist.Api/Checklist.Api.csproj --startup-project backend/Checklist.Api/Checklist.Api.csproj
dotnet ef database update --project backend/Checklist.Api/Checklist.Api.csproj --startup-project backend/Checklist.Api/Checklist.Api.csproj
```

Para produção corporativa:

- prefira aplicar migrations de forma controlada
- não dependa de migration automática no startup

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
```

### Frontend

```powershell
cd frontend/checklist-web
npm run build
```

## Pontos de atenção para produção

### 1. Arquivos em banco

Hoje os documentos do STP e imagens relacionadas a não conformidade estão armazenados no banco.

Isso simplifica a primeira versão, mas exige monitoramento de:

- crescimento do banco
- estratégia de backup
- tempo de restauração

### 2. Observabilidade

A API expõe:

- `GET /health`

Esse endpoint deve ser usado pelo monitoramento da plataforma.

## Guias auxiliares

- [Guia de deploy corporativo](DEPLOY.md)
- [Guia de migração para MySQL corporativo](docs/mysql-corporate-migration-guide.md)
- [Visão de arquitetura](docs/architecture.md)
- [Resumo da API](docs/api-overview.md)

## Estado da primeira versão

A primeira versão do projeto entrega:

- checklist operacional autenticado por operador
- supervisão operacional com tratativa de não conformidades
- módulo STP com áreas, inspeções e documentos
- base de administração de usuários, setores, equipamentos e templates

Essa base já suporta operação corporativa, desde que configuração de ambiente, segredos e banco sejam tratados conforme os guias deste repositório.
