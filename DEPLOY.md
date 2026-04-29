# Deploy Corporativo

Documento de referência para implantação do CheckFlow em ambiente corporativo.

## Topologia alvo

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
MySQL corporativo
```

## Componentes

### Frontend

- aplicação React com build estático gerado por Vite
- publicação do diretório `frontend/checklist-web/dist`
- configuração de integração via `VITE_API_BASE_URL`

### Backend

- aplicação ASP.NET Core Web API
- runtime compatível com .NET 10
- autenticação JWT
- integração com banco MySQL corporativo

### Banco de dados

- instância MySQL acessível pelo backend
- SSL habilitado quando exigido pela política da organização
- credencial de aplicação com permissões compatíveis com o escopo operacional

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
VITE_API_BASE_URL=https://api.checkflow.empresa.com.br
```

## Política de CORS

Em produção, o backend deve operar com origens explícitas.

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

## Banco e migrations

Diretrizes operacionais:

- migrations executadas de forma controlada
- seed inicial executado de forma explícita
- ausência de dependência de automação de startup para evolução de esquema

Arquivo de referência:

- `backend/Checklist.Api/appsettings.Corporate.example.json`

## Sequência de implantação

1. publicar o backend
2. configurar segredos e connection string
3. validar conectividade com o banco
4. aplicar migrations
5. validar `GET /health`
6. publicar o frontend com a URL final da API
7. executar validação funcional

## Healthcheck

Endpoint:

```text
GET /health
```

Resposta esperada:

```json
{"status":"ok"}
```

## Validação pós-implantação

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

## Restrições

Não utilizar em produção:

- segredos em arquivos versionados
- connection strings reais no código
- senhas reais no repositório
- CORS aberto genericamente

## Referências

- [README.md](README.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/api-overview.md](docs/api-overview.md)
- [docs/mysql-corporate-migration-guide.md](docs/mysql-corporate-migration-guide.md)
