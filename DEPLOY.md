# Deploy Corporativo CheckFlow

Este documento descreve a implantacao da aplicacao em ambiente corporativo.

## Arquitetura recomendada

- frontend SPA hospedado em ambiente corporativo
- backend ASP.NET Core hospedado em ambiente corporativo
- banco MySQL corporativo

## Topologia esperada

```text
Usuario
  |
  v
Frontend SPA
  |
  v
Checklist.Api
  |
  v
MySQL corporativo
```

## Requisitos de infraestrutura

### Backend

- runtime compativel com .NET 10
- acesso ao banco MySQL corporativo
- exposicao HTTP/HTTPS conforme padrao interno
- armazenamento de segredos fora do repositorio

### Frontend

- build estatico gerado por Vite
- publicacao do diretório `frontend/checklist-web/dist`
- configuracao da URL da API via variavel de ambiente

### Banco

- MySQL acessivel pelo backend
- SSL habilitado quando exigido pela empresa
- usuario de aplicacao com permissoes adequadas

## Configuracao obrigatoria da API

Variaveis minimas:

- `ConnectionStrings__Default`
- `Auth__JwtKey`
- `Auth__Issuer`
- `Auth__Audience`

Variaveis recomendadas:

- `Cors__AllowedOrigins`
- `ASPNETCORE_ENVIRONMENT`

Exemplo:

```env
ConnectionStrings__Default=Server=HOST;Port=3306;Database=CHECKFLOW;User ID=USUARIO;Password=SENHA;SslMode=Required;
Auth__JwtKey=CHAVE_FORTE_DA_APLICACAO
Auth__Issuer=CheckFlow.Api
Auth__Audience=CheckFlow.Web
```

## Configuracao do frontend

Variavel principal:

- `VITE_API_BASE_URL`

Exemplo:

```env
VITE_API_BASE_URL=https://api.checkflow.empresa.com.br
```

## CORS

Em producao corporativa, configure origens explicitas.

Exemplo:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://checkflow.empresa.com.br"
    ]
  }
}
```

## Migrations e seed

Para ambiente corporativo, a recomendacao e:

- migrations controladas pelo processo de implantacao
- seed inicial controlado
- evitar dependencia de automacao no startup

Use como referencia:

- `backend/Checklist.Api/appsettings.Corporate.example.json`

## Sequencia recomendada de implantacao

1. publicar backend
2. configurar segredos e connection string
3. validar acesso ao banco
4. aplicar migrations de forma controlada
5. validar `GET /health`
6. publicar frontend apontando para a URL final da API
7. validar login, dashboard, checklist operacional e STP

## Healthcheck

Endpoint:

```text
GET /health
```

Resposta esperada:

```json
{"status":"ok"}
```

## Checklist de validacao pos-deploy

### Backend

- API sobe sem excecao
- banco conecta com SSL conforme exigencia
- endpoint `/health` responde
- JWT esta sendo emitido corretamente

### Frontend

- SPA carrega sem erro de roteamento
- comunicacao com a API esta funcional
- login administrativo funciona
- login operacional do operador funciona

### Fluxos funcionais

- checklist operacional envia com sucesso
- supervisao visualiza historico
- itens nao conformes aparecem no painel
- STP abre areas, inspeções e documentos
- fechamento mensal continua operacional

## Seguranca

Nao publique em producao:

- segredos em `appsettings.json`
- senhas reais no repositorio
- connection string real no codigo
- CORS aberto genericamente

## Documentos relacionados

- [README principal](README.md)
- [Guia de migracao para MySQL corporativo](docs/mysql-corporate-migration-guide.md)
