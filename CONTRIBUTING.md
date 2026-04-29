# Contributing

## Objetivo

Este repositório segue um padrão de manutenção orientado para:

- código limpo
- mudanças pequenas e revisáveis
- segredos fora do Git
- build reproduzível

## Regras básicas

1. Não commitar artefatos gerados:
   - `bin/`
   - `obj/`
   - `dist/`
   - `artifacts/`
   - `temp-build-*`
2. Não commitar segredos reais:
   - chaves JWT
   - connection strings reais
   - senhas
3. Prefira mudanças pequenas por PR.
4. Toda migration deve acompanhar a mudança de modelo correspondente.
5. Documentação operacional deve ser atualizada quando a mudança afetar deploy, banco ou fluxo crítico.

## Branches

Sugestão de convenção:

- `feature/<nome-curto>`
- `fix/<nome-curto>`
- `refactor/<nome-curto>`
- `docs/<nome-curto>`

## Commits

Sugestão de padrão:

- `feat(stp): add document control flow`
- `fix(auth): bind checklist to authenticated operator`
- `refactor(supervisor): split controller by feature`
- `docs(deploy): update corporate deployment guide`

## Checklist antes de abrir PR

1. Rodar build do backend:

```powershell
dotnet build backend/Checklist.Api/Checklist.Api.csproj
```

2. Rodar testes do backend, quando aplicável:

```powershell
dotnet test backend/Checklist.Api.Tests/Checklist.Api.Tests.csproj
```

3. Rodar build do frontend:

```powershell
cd frontend/checklist-web
npm ci
npm run build
```

4. Confirmar que não há arquivos gerados no `git status`.
5. Confirmar que `appsettings` e `.env` não contêm credenciais reais.

## Migrations

Criar migration:

```powershell
dotnet ef migrations add NomeDaMigration --project backend/Checklist.Api/Checklist.Api.csproj --startup-project backend/Checklist.Api/Checklist.Api.csproj
```

Aplicar migration:

```powershell
dotnet ef database update --project backend/Checklist.Api/Checklist.Api.csproj --startup-project backend/Checklist.Api/Checklist.Api.csproj
```

## Documentação

Atualize estes arquivos quando aplicável:

- `README.md`
- `DEPLOY.md`
- `docs/mysql-corporate-migration-guide.md`
- `docs/architecture.md`
- `docs/api-overview.md`
