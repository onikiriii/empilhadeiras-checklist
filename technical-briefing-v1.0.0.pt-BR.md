# CheckFlow v1.0.0

## Documento Técnico de Apresentação

## 1. Objetivo

Este documento explica como a solução opera atualmente na versão `1.0.0`, com foco em:

- rastreabilidade
- escalabilidade
- armazenamento de dados e arquivos
- configuração de ambiente
- limites técnicos atuais
- caminho recomendado de evolução

Todo o conteúdo abaixo foi elaborado com base na implementação real presente neste repositório.

---

## 2. Arquitetura Técnica Atual

A solução está organizada em duas camadas principais:

- `backend/Checklist.Api`
  - ASP.NET Core Web API
  - Entity Framework Core
  - persistência em MySQL
  - autenticação com JWT

- `frontend/checklist-web`
  - React
  - Vite
  - sessão no navegador baseada em token

Do ponto de vista arquitetural, trata-se de uma API HTTP stateless com persistência relacional.

Isso é relevante porque APIs stateless escalam horizontalmente com mais facilidade do que aplicações baseadas em sessão em memória.

---

## 3. Como a Solução Executa

### 3.1 Inicialização da aplicação

O ponto de entrada da API é:

- [Program.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Program.cs)

Uma das linhas centrais é:

```csharp
builder.Services.AddDbContext<AppDbContext>(options => options.UseMySQL(connectionString));
```

### O que essa linha faz

- `builder.Services` acessa o container de injeção de dependência.
- `AddDbContext<AppDbContext>` registra o contexto de banco usado pela aplicação.
- `options.UseMySQL(connectionString)` informa ao EF Core que o banco utilizado é MySQL e qual connection string deve ser usada.

### O que entra

- uma connection string válida, por exemplo:

```text
Server=db01;Port=3306;Database=CheckFlow;User ID=checkflow_app;Password=***;
```

### O que sai

- uma instância de `AppDbContext` disponível para controllers e serviços durante o ciclo de cada requisição

### Por que isso existe

Sem esse registro, os controllers não conseguiriam consultar nem persistir dados de negócio.

---

### 3.2 Mapeamento dos controllers

Outra linha importante é:

```csharp
app.MapControllers();
```

### O que essa linha faz

Ela publica todas as rotas ASP.NET definidas em classes com `[ApiController]` e `[Route(...)]`.

### Exemplo prático

Este controller:

```csharp
[ApiController]
[Route("api/checklists")]
public class ChecklistsController : ControllerBase
```

fica acessível por:

```text
POST /api/checklists
```

---

### 3.3 Endpoint de health

A API expõe um endpoint simples de saúde:

```csharp
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
```

### Por que isso importa

Esse é o ponto mínimo necessário para:

- validação de deploy
- sondas de disponibilidade
- verificação por proxy reverso
- validação por balanceador de carga

---

## 4. Modelo de Rastreabilidade

Rastreabilidade é um dos pontos mais fortes da implementação atual.

A solução já registra:

- quem autenticou
- a qual setor o usuário pertence
- qual equipamento ou área STP foi inspecionada
- quando o registro foi criado
- quando a assinatura foi capturada
- quem enviou um documento
- quem aprovou ou tratou um item não conforme

### 4.1 Checklist com operador autenticado

O endpoint principal do checklist operacional está em:

- [ChecklistsController.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Controllers/ChecklistsController.cs)

A rota é protegida com:

```csharp
[Authorize(Policy = "OperatorChecklistReady")]
```

### O que isso significa

A API não confia apenas no que o navegador informa.  
Ela primeiro exige um JWT válido emitido para um operador autenticado.

Depois ela extrai a identidade a partir das claims do token:

```csharp
var operadorId = CurrentOperadorClaims.GetOperadorId(User);
var operadorSetorId = CurrentOperadorClaims.GetSetorId(User);
```

### Por que isso é importante

Essa é a diferença entre:

- “a tela disse que o operador X fez o checklist”
- e
- “a API validou que o token autenticado pertence ao operador X”

Esse ponto melhora materialmente a rastreabilidade.

---

### 4.2 Proteção contra envio em nome de outro operador

A API bloqueia explicitamente cenário de impersonação:

```csharp
if (req.OperadorId != Guid.Empty && req.OperadorId != operador.Id)
    return BadRequest(new { message = "O operador autenticado nao corresponde ao operador informado." });
```

### O que essa linha faz

Se o corpo da requisição tentar enviar um checklist em nome de outro operador, a chamada é rejeitada.

### Exemplo prático

Token autenticado:

```text
OperatorId = 8f24c930-8d0c-4f37-8d2c-0d6aab2a3f10
```

Body enviado:

```json
{
  "operadorId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
}
```

Resultado:

- requisição rejeitada
- consistência de auditoria preservada

---

### 4.3 Marcadores temporais persistidos

A entidade de checklist guarda múltiplos marcos de tempo:

- [Checklist.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Models/Checklist.cs)

```csharp
public DateTime DataRealizacao { get; set; } = DateTime.UtcNow;
public DateTime DataReferencia { get; set; } = DateTime.UtcNow.Date;
public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
public DateTime? AssinadoEm { get; set; }
```

### Por que isso importa

Esses timestamps separam momentos diferentes do processo:

- `DataRealizacao`
  - quando a inspeção é considerada realizada
- `DataReferencia`
  - o dia operacional usado para unicidade e relatórios
- `CriadoEm`
  - quando o registro entrou no sistema
- `AssinadoEm`
  - quando a assinatura foi capturada

Essa distinção é relevante para auditoria e reconstrução de evento.

---

### 4.4 Histórico de não conformidade

O sistema já possui histórico explícito para tratamento de itens não conformes:

- [ChecklistItemAcao.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Models/ChecklistItemAcao.cs)

```csharp
public class ChecklistItemAcaoHistorico
{
    public Guid CriadoPorSupervisorId { get; set; }
    public string Titulo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
```

Isso dá ao sistema uma trilha nativa de eventos de tratativa, e não apenas um status final.

O helper:

- [SupervisorNaoOkHistoryBuilder.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Controllers/Features/Supervisor/NaoOk/Helpers/SupervisorNaoOkHistoryBuilder.cs)

monta uma linha do tempo legível a partir do histórico persistido e dos eventos operacionais.

### Isso permite responder perguntas como

- quem atribuiu a tratativa
- quando a tratativa foi atribuída
- quem atualizou o progresso
- quem concluiu
- qual observação foi registrada em cada etapa

---

### 4.5 Rastreabilidade de upload de documentos STP

O módulo de controle documental STP guarda a identidade do usuário que enviou o arquivo:

- [StpDocumentoEmpresaArquivo.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Models/StpDocumentoEmpresaArquivo.cs)
- [StpDocumentoFuncionarioArquivo.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Models/StpDocumentoFuncionarioArquivo.cs)

```csharp
public Guid EnviadoPorSupervisorId { get; set; }
public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
```

### O que isso significa

Para cada documento enviado de empresa ou funcionário, o sistema consegue identificar:

- quem enviou
- quando enviou
- qual era o nome do arquivo
- qual o tipo MIME
- qual o tamanho em bytes

Para uma primeira camada de auditoria operacional, isso já é suficiente.

---

## 5. Modelo de Armazenamento

### 5.1 Dados relacionais de negócio

O principal ponto de persistência é:

- [AppDbContext.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Data/AppDbContext.cs)

Ele registra tabelas de negócio como:

- `Equipamentos`
- `Operadores`
- `Checklists`
- `ChecklistItens`
- `ChecklistItensAcoes`
- `StpAreaChecklists`
- `StpDocumentosEmpresasArquivos`
- `StpDocumentosFuncionariosArquivos`

Esse é um modelo relacional tradicional e adequado para:

- consistência transacional
- filtros
- joins
- consultas históricas

---

### 5.2 Armazenamento atual de imagens e assinaturas

Hoje a solução armazena assinaturas e algumas evidências em Base64.

Exemplos:

- [Checklist.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Models/Checklist.cs)

```csharp
public string? AssinaturaOperadorBase64 { get; set; }
```

- [ChecklistItem.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Models/ChecklistItem.cs)

```csharp
public string? ImagemNokBase64 { get; set; }
public string? ImagemNokNomeArquivo { get; set; }
public string? ImagemNokMimeType { get; set; }
```

### Benefícios dessa abordagem

- simplicidade de implementação
- persistência em uma única transação
- não exige serviço externo de arquivos

### Custos dessa abordagem

- payloads HTTP maiores
- crescimento maior do banco
- overhead de Base64 em relação a binário
- maior pressão de memória durante serialização e desserialização
- menor escalabilidade para cenários com muitas imagens

Esse é um dos principais limitadores técnicos da versão atual.

---

### 5.3 Armazenamento de documentos STP

Documentos STP de empresa e funcionário são armazenados no banco como binário:

```csharp
public byte[] Conteudo { get; set; } = [];
```

e enviados por:

- [StpDocumentControlController.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Controllers/StpDocumentControlController.cs)

```csharp
await using var stream = new MemoryStream();
await arquivo!.CopyToAsync(stream);

var document = new StpDocumentoEmpresaArquivo
{
    Conteudo = stream.ToArray(),
    TamanhoBytes = arquivo.Length
};
```

### O que essa sintaxe significa

- `MemoryStream` mantém o arquivo na memória da API
- `CopyToAsync` copia todo o stream recebido para RAM
- `stream.ToArray()` converte o conteúdo para `byte[]`
- esse `byte[]` é persistido no MySQL

### Por que isso funciona

Funcionalmente, a implementação está correta e é simples.

### Por que isso limita escala

Para arquivos maiores ou uploads frequentes, o sistema paga o custo três vezes:

1. o arquivo trafega pela rede
2. o arquivo fica temporariamente em memória da API
3. o arquivo é persistido dentro do banco relacional

Isso é aceitável em versões iniciais, mas não é o desenho mais escalável para longo prazo.

---

## 6. Autenticação e Controle de Acesso

### 6.1 Geração de token JWT

O serviço de token está em:

- [JwtTokenService.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Security/JwtTokenService.cs)

Exemplo:

```csharp
var token = new JwtSecurityToken(
    issuer: _authOptions.Issuer,
    audience: _authOptions.Audience,
    claims: claims,
    notBefore: DateTime.UtcNow,
    expires: expiresAt,
    signingCredentials: credentials);
```

### O que cada argumento faz

- `issuer`
  - quem emitiu o token
- `audience`
  - para quem esse token é válido
- `claims`
  - dados de identidade e autorização transportados no token
- `notBefore`
  - momento mínimo de validade
- `expires`
  - momento de expiração
- `signingCredentials`
  - assinatura criptográfica usada para proteger a integridade do token

### Por que isso importa para escala

JWT mantém a API stateless.

O servidor não precisa guardar sessão em memória para saber quem é o usuário.  
Qualquer instância da API consegue validar o mesmo token.

Isso é um ponto positivo para escalabilidade horizontal.

---

### 6.2 Autorização por policies

A aplicação não espalha checagens manuais de perfil em todos os endpoints.  
Ela centraliza autorização em policies:

```csharp
options.AddPolicy("OperatorChecklistReady", policy =>
{
    policy.RequireAuthenticatedUser();
    policy.RequireAssertion(context =>
        CurrentOperadorClaims.GetOperadorId(context.User).HasValue &&
        CurrentOperadorClaims.GetSetorId(context.User).HasValue &&
        !CurrentOperadorClaims.GetForceChangePassword(context.User));
});
```

### Por que isso é bom

- as regras de acesso ficam explícitas
- o comportamento fica consistente
- revisão e evolução de permissão ficam mais simples

Para uma avaliação de gestão, isso é um indicativo positivo de governança técnica.

---

## 7. Configuração de Ambiente

### 7.1 Configuração obrigatória

A API não sobe sem:

- chave JWT
- connection string do banco

Isso é garantido diretamente em:

- [Program.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Program.cs)

```csharp
if (string.IsNullOrWhiteSpace(authOptions.JwtKey))
    throw new InvalidOperationException("Auth:JwtKey precisa estar configurado.");
```

e:

```csharp
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:Default precisa estar configurado para o MySQL.");
```

### Por que isso importa

A aplicação falha cedo quando falta uma dependência crítica.  
Isso é melhor do que subir parcialmente configurada.

---

### 7.2 Resolução de CORS

As origens permitidas do frontend são resolvidas por configuração e variáveis de ambiente:

- [FrontendCorsPolicyHelper.cs](/c:/Users/Gabriel/Documents/empilhadeiras-checklist/backend/Checklist.Api/Support/FrontendCorsPolicyHelper.cs)

```csharp
var envOrigins = (Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS") ?? string.Empty)
    .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
```

### O que essa sintaxe faz

- `Environment.GetEnvironmentVariable(...)`
  - lê a variável de ambiente
- `?? string.Empty`
  - usa string vazia se ela não existir
- `.Split([',', ';'], ...)`
  - permite múltiplas origens separadas por vírgula ou ponto e vírgula

Esse é um padrão prático para deploy em ambientes distintos.

---

### 7.3 Binding de porta

A API suporta porta dinâmica injetada pela plataforma:

```csharp
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(int.Parse(port));
    });
}
```

### Por que isso importa

Esse trecho é necessário para ambientes com contêiner e PaaS, nos quais a plataforma define a porta de escuta em runtime.

---

## 8. Características Atuais de Escalabilidade

## 8.1 Pontos positivos

A arquitetura atual já possui algumas características boas para escala:

### Autenticação stateless

A API usa JWT em vez de sessão em memória.

Isso significa:

- não depende de sticky session
- facilita escala horizontal
- múltiplas instâncias conseguem validar o mesmo token

### Consistência relacional

EF Core + MySQL é uma combinação adequada para fluxos transacionais como:

- um checklist por equipamento por dia
- validação de operador autenticado
- histórico de tratativa de não conformidade
- metadados de documentos STP

### Separação de domínio por módulo

O sistema já possui fronteiras funcionais claras na prática:

- supervisão operacional
- STP
- autenticação de operador
- inspeção de materiais

Isso reduz o custo de modularização futura.

---

## 8.2 Gargalos atuais de escala

Os principais gargalos de escalabilidade na `1.0.0` são:

### 1. Evidências em Base64 dentro do banco relacional

Assinaturas e imagens NOK são armazenadas como strings grandes.

Impacto:

- payload maior na rede
- mais CPU para serialização JSON
- maior crescimento do banco

### 2. Documentos binários armazenados no MySQL

Os documentos STP são armazenados em `byte[] Conteudo`.

Impacto:

- o banco cresce com carga de arquivo
- backup fica mais pesado
- restore demora mais
- leitura e escrita concentram pressão no mesmo tier

### 3. Bufferização integral de upload em memória

Os uploads atuais usam `MemoryStream` seguido de `ToArray()`.

Impacto:

- cada upload consome memória proporcional ao arquivo
- concorrência em uploads reduz a folga de RAM disponível

### 4. Migrations automáticas no startup

Hoje o startup pode executar:

```csharp
db.Database.Migrate();
```

Impacto em ambiente com múltiplas instâncias:

- disputa de startup
- corrida entre réplicas
- cold start mais lento

### 5. Ausência de camada explícita de cache

Endpoints de leitura acessam o banco diretamente.

Isso é aceitável em carga moderada, mas não é o ideal para dashboards muito acessados.

### 6. Ausência de descarregamento assíncrono de fluxos pesados

Tudo roda inline dentro da requisição HTTP.

Isso simplifica a aplicação, mas não é o melhor desenho para:

- geração de PDF
- exportações
- validações futuras de documento
- notificações

---

## 9. Melhorias Recomendadas para Escalabilidade Real

As melhorias mais valiosas não são cosméticas. Elas são estruturais.

## Prioridade 1: Tirar arquivos do banco transacional

### Mudança recomendada

Substituir:

- `byte[] Conteudo`
- Base64 de imagens e assinaturas

por:

- object storage
- metadados persistidos em MySQL
- chave do arquivo / URL / hash no banco

### Exemplo de modelo-alvo

Em vez de:

```csharp
public byte[] Conteudo { get; set; } = [];
```

evoluir para algo como:

```csharp
public string StorageKey { get; set; } = string.Empty;
public string StorageProvider { get; set; } = "s3";
public string MimeType { get; set; } = "application/octet-stream";
public long TamanhoBytes { get; set; }
public string Sha256 { get; set; } = string.Empty;
```

### Por que isso é melhor

- o banco guarda metadados, não blobs pesados
- arquivos escalam separadamente
- backup fica menor
- CDN e URL assinada passam a ser possíveis

---

## Prioridade 2: Substituir Base64 no checklist por multipart ou referência externa

Fluxo atual:

- a imagem vai embutida dentro do JSON

Fluxo recomendado:

- subir o arquivo separadamente
- receber um identificador
- enviar o checklist JSON referenciando a evidência

### Por que isso é melhor

- bodies menores
- menos pressão de memória
- menos custo de serialização
- retry e deduplicação mais simples

---

## Prioridade 3: Otimização de banco e caminho de requisição

Melhorias recomendadas:

- usar `AddDbContextPool<AppDbContext>(...)`
- revisar índices para filtros mais consultados
- avaliar configuração do pool de conexão MySQL
- manter `AsNoTracking()` em queries somente leitura, como já é feito em vários pontos

Exemplo de boa prática já existente:

```csharp
var equipamento = await _db.Equipamentos
    .AsNoTracking()
    .Include(e => e.Categoria)
    .FirstOrDefaultAsync(e => e.Id == req.EquipamentoId && e.Ativa);
```

### Por que `AsNoTracking()` ajuda

Ele evita o custo de change tracking do EF Core em consultas de leitura.

Isso melhora uso de memória e throughput em cenários read-heavy.

---

## Prioridade 4: Externalizar migrations do startup

Hoje a aplicação pode aplicar migration automaticamente no boot.

Para ambientes maiores, o desenho melhor é:

- migrations executadas por pipeline ou job de release
- instâncias da aplicação sobem sem responsabilidade de alterar schema

### Por que isso é melhor

- deploy mais seguro
- processo de release mais claro
- sem disputa de migration entre réplicas

---

## Prioridade 5: Introduzir observabilidade estruturada

Adições recomendadas:

- correlation ID por requisição
- logs estruturados em JSON
- agregação centralizada de logs
- métricas de aplicação
- visibilidade de queries lentas
- rastreamento de erro

### Por que isso importa

Escalabilidade não é só “aguentar mais tráfego”.  
É também conseguir detectar gargalos antes de virar incidente.

---

## Prioridade 6: Introduzir processamento assíncrono em fluxos pesados

Candidatos:

- geração de PDF mensal
- exportações
- validação futura de documentos
- notificações

Desenho recomendado:

- fila ou worker em background
- a requisição HTTP responde rápido
- o status do job pode ser consultado depois

---

## 10. Quantidade de Usuários Suportados e Requisições Simultâneas

Esse é o ponto em que mais importa ser tecnicamente rigoroso:

**hoje não existe um número fixo defensável sem teste formal de carga.**

Qualquer número absoluto dito sem benchmark seria especulação.

### O que pode ser afirmado com segurança

A arquitetura atual é adequada para:

- uso concorrente baixo a moderado
- fluxos transacionais autenticados
- leitura moderada de dashboards
- volume moderado de envio de checklist

### O que impede um número exato neste momento

A capacidade depende de:

- CPU da instância
- memória da instância
- dimensionamento do MySQL
- banda de rede
- frequência de upload
- tamanho médio das imagens
- tamanho médio dos documentos
- número de réplicas ativas
- configuração do pool de conexão

### Interpretação prática

Hoje, a tendência é que os limitadores venham mais de:

- tamanho de arquivo
- I/O de banco
- pressão de memória durante uploads

do que da lógica dos controllers em si.

### Resposta técnica correta para gestão

Uma resposta segura para o gerente é:

> A arquitetura da API é horizontalmente escalável na camada de aplicação porque ela é stateless e baseada em JWT. No entanto, a versão atual ainda armazena imagens, assinaturas e arquivos STP dentro do caminho transacional principal. Por isso, o limite real de concorrência precisa ser estabelecido por teste de carga, e não por estimativa informal.

Essa é a resposta tecnicamente correta e defensável.

---

## 11. Posicionamento Recomendado para a Reunião

Se você precisar resumir sem prometer demais, use esta linha:

### Estado atual

- adequado para piloto e início de operação
- apropriado para operação controlada por setor
- consistente para uso transacional autenticado

### Limitadores atuais

- arquivos binários e Base64 dentro do caminho de persistência principal
- ausência de camada dedicada de armazenamento de arquivos
- ausência de benchmark formal de performance

### Caminho de escala

- object storage externo
- acesso a banco com pooling
- revisão explícita de índices
- observabilidade estruturada
- teste de carga e definição de baseline
- replicação horizontal da API

---

## 12. Roadmap de Evolução Recomendado

## Fase 1. Hardening

- mover documentos STP para object storage
- remover imagens/assinaturas Base64 do JSON principal
- adicionar correlation ID por requisição
- adicionar logging estruturado
- desabilitar migrations automáticas em ambiente com múltiplas instâncias

## Fase 2. Performance

- adicionar `AddDbContextPool`
- benchmarkar endpoints principais
- revisar índices de dashboard, checklist e STP
- definir orçamento máximo de payload por endpoint

## Fase 3. Escala

- introduzir camada de arquivo/CDN
- introduzir background jobs para operações pesadas
- introduzir cache de leitura onde fizer sentido
- executar teste de carga formal e publicar baseline de capacidade

---

## 13. Avaliação Técnica Final

A versão `1.0.0` é funcionalmente forte e já apresenta decisões boas de engenharia em:

- autorização por policy
- rastreabilidade por operador autenticado
- consistência relacional
- timestamps relevantes para auditoria
- separação de domínio por módulo

O principal limitador arquitetural atual não está na regra de negócio.  
Ele está na estratégia de armazenamento de mídia.

Se o próximo passo é escalar, as melhorias mais valiosas são:

1. remover arquivos pesados do caminho quente do banco relacional
2. formalizar observabilidade
3. benchmarkar antes de prometer capacidade
4. externalizar a responsabilidade de migration

Esse é o caminho mais limpo para tornar a solução materialmente mais escalável sem reescrever o núcleo do domínio.
