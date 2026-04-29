# API Overview

## Auth

### Administrativo

- `POST /api/auth/login`

### Operador

- `POST /api/operadores-auth/login`
- `GET /api/operadores-auth/me`
- `POST /api/operadores-auth/definir-nova-senha`

## Administração

### Setores

- endpoints de cadastro e listagem de setores

### Operadores

- endpoints de cadastro, edição e listagem de operadores

### Equipamentos

- endpoints de catálogo de equipamentos

### Templates

- endpoints de template de checklist operacional

## Checklist operacional

- `POST /api/checklists`
- endpoints auxiliares de consulta de equipamento, histórico e detalhes relacionados

## Supervisão

### Dashboard e histórico

- endpoints em `Controllers/Features/Supervisor/Dashboard`
- endpoints em `Controllers/Features/Supervisor/Checklists`

### Itens não conformes

- endpoints em `Controllers/Features/Supervisor/NaoOk`

## STP

### Áreas

- endpoints em `StpAreasController`

### Inspeções

- endpoints em `StpController`

### Controle de documentos

- endpoints em `StpDocumentControlController`

## Health

- `GET /health`
