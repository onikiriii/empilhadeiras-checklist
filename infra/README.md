# Infra CheckFlow

Esta pasta agora suporta MySQL para desenvolvimento local e continua compatível com o MySQL Server corporativo.

## Modos de uso

### 1. Banco em Docker + API local

Use este modo quando quiser subir só o banco em container e rodar o backend pelo Visual Studio ou `dotnet run`.

1. Copie `infra/.env.example` para `infra/.env` se quiser personalizar portas ou credenciais.
2. Na pasta `infra`, suba o banco:

```powershell
docker compose up -d mysql
```

3. Rode a API localmente com ambiente `Docker`:

```powershell
$env:ASPNETCORE_ENVIRONMENT="Docker"
dotnet run --project ..\backend\Checklist.Api
```

Nesse modo, a API usa [appsettings.Docker.json](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/appsettings.Docker.json) e conecta em `localhost:3307`.

### 2. API + banco em Docker

Use este modo quando quiser padronizar o ambiente inteiro localmente.

```powershell
docker compose up -d --build
```

Serviços expostos:
- API: `http://localhost:5204`
- MySQL: `localhost:3307`

Nesse modo, a API containerizada usa a connection string por variável de ambiente e conecta no serviço `mysql:3306`.

### 3. MySQL Server corporativo ou local fora do Docker

Use este modo quando quiser rodar o CheckFlow apontando para um banco gerenciado fora da infra local.

- mantenha o ambiente `Development`
- ajuste [appsettings.Development.json](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/appsettings.Development.json) ou a variável `ConnectionStrings__Default`

## Observações

- O backend aplica `migrations` automaticamente no startup.
- Para o banco Docker, foi usada a porta `3307` no host para não colidir com instalações locais em `3306`.
- Se você já estiver usando o MySQL local em `3306`, pode continuar com ele sem usar Docker.
- Se quiser trocar portas ou credenciais do Docker, altere `infra/.env`.
