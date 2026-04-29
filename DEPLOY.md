# Setup and Deploy

Documento de referência para configuração e execução do CheckFlow.

## Topologia

```text
Usuário
  |
  v
Frontend SPA
  |
  v
Checklist.Api
  |
  v
MySQL
```

## Componentes

### Frontend

- aplicação React com build estático gerado por Vite
- publicação do diretório `frontend/checklist-web/dist`
- integração com a API por `VITE_API_BASE_URL`

### Backend

- aplicação ASP.NET Core Web API
- runtime compatível com .NET 10
- autenticação JWT
- integração com banco MySQL

### Banco de dados

- instância MySQL acessível pelo backend
- credencial de aplicação com permissões compatíveis com o sistema

## Configuração da API

Variáveis mínimas:

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

## Configuração do frontend

Variável principal:

- `VITE_API_BASE_URL`

Exemplo:

```env
VITE_API_BASE_URL=http://localhost:5204
```

## CORS

Quando necessário, configure origens explícitas no backend.

Exemplo:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173"
    ]
  }
}
```

## Banco e migrations

Diretrizes:

- migrations executadas de forma controlada
- seed inicial executado de forma explícita
- ausência de dependência de automação de startup para evolução de esquema

Comando para aplicar migrations:

```powershell
dotnet ef database update --project backend/Checklist.Api/Checklist.Api.csproj --startup-project backend/Checklist.Api/Checklist.Api.csproj
```

## Sequência de execução

1. configurar variáveis do backend
2. validar conectividade com o banco
3. aplicar migrations
4. iniciar a API
5. validar `GET /health`
6. configurar `VITE_API_BASE_URL`
7. iniciar ou publicar o frontend

## Healthcheck

Endpoint:

```text
GET /health
```

Resposta esperada:

```json
{"status":"ok"}
```

## Validação

### Backend

- inicialização sem exceção
- conexão com banco estabelecida
- emissão de JWT funcional
- healthcheck operacional

### Frontend

- carregamento da SPA sem erro de roteamento
- comunicação com a API estabelecida
- login administrativo funcional
- login operacional funcional

### Fluxos críticos

- envio de checklist operacional
- visualização de histórico em supervisão
- processamento de não conformidades
- inspeções STP
- controle documental STP
- fechamento mensal

## Referências

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api-overview.md](docs/api-overview.md)
- [docs/mysql-corporate-migration-guide.md](docs/mysql-corporate-migration-guide.md)
