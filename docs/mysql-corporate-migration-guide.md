# MySQL Configuration Guide

Documento de referência para configuração do CheckFlow com MySQL.

## Objetivo

Padronizar a aplicação para:

- usar uma connection string única
- operar com SSL quando necessário
- evitar segredos versionados
- controlar migrations e seed de forma explícita

## Informações necessárias

Antes da configuração, confirme:

1. host do banco
2. porta
3. nome do banco
4. usuário da aplicação
5. senha da aplicação
6. política de SSL

## Configuração recomendada

Use uma connection string completa em:

```env
ConnectionStrings__Default=Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;
```

## Exemplo de configuração

Arquivo de referência:

- `backend/Checklist.Api/appsettings.Corporate.example.json`

Exemplo:

```json
{
  "ConnectionStrings": {
    "Default": "Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;"
  },
  "Auth": {
    "JwtKey": "CONFIGURAR_VIA_VARIAVEL_DE_AMBIENTE",
    "Issuer": "CheckFlow.Api",
    "Audience": "CheckFlow.Web"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173"
    ]
  }
}
```

## Passos

### 1. Montar a connection string

Monte a string com:

- host
- porta
- database
- usuário
- senha
- SSL

### 2. Configurar a API

Defina no ambiente:

```env
ConnectionStrings__Default=Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;
Auth__JwtKey=CHAVE_FORTE_DA_APLICACAO
Auth__Issuer=CheckFlow.Api
Auth__Audience=CheckFlow.Web
```

### 3. Configurar CORS

Defina as origens necessárias:

```env
Cors__AllowedOrigins__0=http://localhost:5173
```

### 4. Aplicar migrations

```powershell
dotnet ef database update --project backend/Checklist.Api/Checklist.Api.csproj --startup-project backend/Checklist.Api/Checklist.Api.csproj
```

### 5. Validar a API

Checklist:

1. API sobe sem exceção
2. conexão com banco funciona
3. `/health` responde `ok`
4. login funciona
5. dashboard funciona
6. checklist operacional funciona
7. STP funciona

## Política de segredos

- não versionar segredo
- não versionar senha de banco
- não versionar JWT real
- não usar credenciais reais em `appsettings.json`

## Erros comuns

1. manter `SslMode=Disabled` quando o banco exige SSL
2. usar mais de um caminho de connection string
3. deixar CORS aberto demais
4. aplicar migration automática sem controle
5. subir backend sem validar acesso ao banco
