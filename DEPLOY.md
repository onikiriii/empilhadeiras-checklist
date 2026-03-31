# Deploy CheckFlow

## Arquitetura recomendada

- Frontend SPA no Vercel
- Backend ASP.NET Core no Railway
- Banco MySQL no Railway ou MySQL Server corporativo

## Vercel

Projeto:
- Root Directory: `frontend/checklist-web`
- Framework Preset: `Vite`

Build:
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Variáveis:
- `VITE_API_BASE_URL=https://SEU-BACKEND.up.railway.app`

Observações:
- O arquivo [vercel.json](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/frontend/checklist-web/vercel.json) já mantém o rewrite da SPA para `index.html`
- Se usar domínio customizado no frontend, cadastre a URL no backend via `FRONTEND_URL` ou `CORS_ALLOWED_ORIGINS`

## Railway

Projeto:
- Deploy a partir da raiz do repositório
- O Railway vai usar [railway.json](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/railway.json) e [Dockerfile.railway](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/Dockerfile.railway)

Variáveis obrigatórias da API:
- `Auth__JwtKey`
- `Auth__Issuer=CheckFlow.Api`
- `Auth__Audience=CheckFlow.Web`
- `FRONTEND_URL=https://SEU-FRONTEND.vercel.app`

Banco:
- opção 1: referenciar a URL MySQL em `ConnectionStrings__Default`
- opção 2: usar `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`

Observações:
- O container Railway instala LibreOffice para a geração do PDF mensal
- O backend expõe `GET /health` para healthcheck do Railway
- O backend aplica `migrations` automaticamente ao subir

## Sequência recomendada

1. Suba o backend no Railway
2. Configure as variáveis da API
3. Confirme `GET /health`
4. Suba o frontend no Vercel apontando `VITE_API_BASE_URL` para o Railway
5. Atualize `FRONTEND_URL` no Railway com a URL final do Vercel
