# Guia de Migracao para MySQL Corporativo

Este guia documenta a preparacao do projeto para uso com o banco MySQL da empresa.

## Objetivo

Padronizar a aplicacao para:

- usar uma connection string corporativa unica
- operar com SSL quando exigido
- evitar segredos no repositorio
- controlar migrations e seed de forma explicita

## Premissas

Antes da implantacao, confirme com a equipe de infraestrutura:

1. host do banco
2. porta
3. nome do banco
4. usuario da aplicacao
5. senha da aplicacao
6. politica de SSL
7. regras de firewall e allowlist
8. politica de aplicacao de migrations

## Configuracao recomendada

Use uma connection string completa em:

```env
ConnectionStrings__Default=Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;
```

Nao dependa de fragmentos soltos de configuracao em producao.

## Exemplo de configuracao corporativa

Arquivo de referencia:

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
      "https://checkflow.empresa.com.br"
    ]
  }
}
```

## Passo a passo

### Passo 1. Montar a connection string final

Monte a string com:

- host
- porta
- database
- usuario
- senha
- SSL

### Passo 2. Configurar a API

Defina no ambiente:

```env
ConnectionStrings__Default=Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;
Auth__JwtKey=CHAVE_FORTE_DA_APLICACAO
Auth__Issuer=CheckFlow.Api
Auth__Audience=CheckFlow.Web
```

### Passo 3. Restringir CORS

Defina apenas as origens corporativas reais:

```env
Cors__AllowedOrigins__0=https://checkflow.empresa.com.br
```

### Passo 4. Decidir como aplicar migrations

Recomendacao:

- aplicar migrations fora do startup automatico
- executar de forma controlada

Comando:

```powershell
dotnet ef database update --project backend/Checklist.Api/Checklist.Api.csproj --startup-project backend/Checklist.Api/Checklist.Api.csproj
```

### Passo 5. Validar a subida da API

Checklist:

1. API sobe sem excecao
2. conexao com banco funciona
3. `/health` responde `ok`
4. login funciona
5. dashboard funciona
6. checklist operacional funciona
7. STP funciona

## Politica de segredos

Em ambiente corporativo:

- nao versionar segredo
- nao versionar senha de banco
- nao versionar JWT real
- nao usar credenciais de producao em `appsettings.json`

## Erros comuns

1. manter `SslMode=Disabled` quando o banco exige SSL
2. usar mais de um caminho de connection string em producao
3. deixar CORS aberto demais
4. aplicar migration automatica sem alinhamento com a operacao
5. subir backend sem validar acesso de rede ao banco

## Validacao final

Ambiente considerado pronto quando:

- backend conecta com banco corporativo
- segredos estao fora do repositorio
- origem do frontend esta configurada explicitamente
- migrations foram aplicadas com sucesso
- fluxos principais foram testados
