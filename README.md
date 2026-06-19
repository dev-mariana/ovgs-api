# OVGS — Sistema de Gestão de Ordens de Venda

API REST para gerenciamento do ciclo de vida completo de Ordens de Venda: cadastros, transições de status, agendamento de entregas e auditoria de alterações.

---

## Stack

| Tecnologia | Papel |
|---|---|
| Node.js 22 + TypeScript | Runtime e linguagem |
| NestJS 11 | Framework HTTP (módulos, DI, pipes, filtros) |
| PostgreSQL 16 | Banco de dados relacional |
| Prisma 7 | ORM, migrations e type-safety |
| nestjs-pino | Logs estruturados em JSON com correlationId |
| @nestjs/swagger | Documentação interativa OpenAPI |
| Jest + Supertest | Testes unitários e E2E |

---

## Pré-requisitos

- Node.js >= 22
- Docker e Docker Compose (ou PostgreSQL 16 rodando localmente)

---

## Instalação e execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

O arquivo `.env` já vem preenchido para o ambiente local:

```env
DATABASE_URL=postgresql://ovgs:ovgs@localhost:5432/ovgs
PORT=3000
NODE_ENV=development
```

### 3. Subir o banco de dados

```bash
docker compose up -d
```

### 4. Rodar as migrations

```bash
npx prisma migrate deploy
```

### 5. Iniciar a aplicação

```bash
# Modo desenvolvimento (hot reload)
npm run start:dev

# Modo produção
npm run build && npm run start:prod
```

A API estará disponível em `http://localhost:3000`.

Documentação interativa (Swagger): `http://localhost:3000/docs`

---

## Testes

```bash
# Unitários (sem banco)
npm run test

# E2E (requer banco rodando)
npm run test:e2e

# Cobertura
npm run test:cov
```

> Os testes E2E limpam e recriam os dados a cada caso de teste — use um banco separado ou garanta que o banco de desenvolvimento pode ser descartado.

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/transport-types` | Criar tipo de transporte |
| `GET` | `/transport-types` | Listar tipos de transporte |
| `GET` | `/transport-types/:id` | Detalhe do tipo de transporte |
| `PATCH` | `/transport-types/:id` | Atualizar tipo de transporte |
| `POST` | `/items` | Criar item |
| `GET` | `/items` | Listar itens (com busca por `search`) |
| `GET` | `/items/:id` | Detalhe do item |
| `POST` | `/customers` | Criar cliente |
| `GET` | `/customers` | Listar clientes (com busca por `search`) |
| `GET` | `/customers/:id` | Detalhe do cliente com transportes autorizados |
| `PATCH` | `/customers/:id` | Atualizar cliente |
| `PUT` | `/customers/:id/transport-types` | Substituir transportes autorizados |
| `POST` | `/sales-orders` | Criar ordem de venda |
| `GET` | `/sales-orders` | Listar ordens (filtros: status, cliente, transporte, datas) |
| `GET` | `/sales-orders/:id` | Detalhe da ordem com itens, agendamento e histórico de auditoria |
| `PATCH` | `/sales-orders/:id/status` | Avançar status da ordem |
| `PATCH` | `/sales-orders/:id/transport-type` | Alterar tipo de transporte da ordem |
| `POST` | `/sales-orders/:id/schedule` | Criar agendamento de entrega |
| `PATCH` | `/sales-orders/:id/schedule` | Reagendar entrega |
| `POST` | `/sales-orders/:id/schedule/confirm` | Confirmar agendamento |
| `GET` | `/audit-logs` | Consultar logs de auditoria (filtros: entity, entityId, action) |

---

## Regras de negócio

| Código | Regra |
|--------|-------|
| RN-01 | O tipo de transporte da ordem deve estar na lista de autorizados do cliente |
| RN-02 | Uma ordem deve ter ao menos um item |
| RN-03 | Todos os itens referenciados devem existir no cadastro |
| RN-06 | Para avançar ao status `SCHEDULED` a ordem deve possuir um agendamento |
| RN-07 | Para avançar ao status `IN_TRANSIT` o agendamento deve estar confirmado |
| RN-09 | O horário `windowEnd` deve ser posterior ao `windowStart` |
| RN-10 | Reagendamento só é permitido nos status `PLANNED` e `SCHEDULED` |

### Fluxo de status

```
CREATED → PLANNED → SCHEDULED → IN_TRANSIT → DELIVERED
```

Não há transições retroativas nem saltos de etapa.

---

## Modelagem do domínio

O domínio foi modelado a partir das entidades de negócio, sem acoplamento a frameworks ou banco de dados. Todas as entidades são interfaces TypeScript puras (`SalesOrder`, `Customer`, `DeliverySchedule`, etc.) e vivem em `src/domain/`.

As relações principais são:

```
Customer (1) ──< CustomerTransportType >── (N) TransportType
    │
    └── (1) ──< SalesOrder
                    ├── (N) SalesOrderItem ──> Item
                    ├── (1) TransportType
                    └── (0..1) DeliverySchedule
```

`CustomerTransportType` é uma tabela de junção explícita que modela a autorização de tipos de transporte por cliente — escolhida sobre um simples array de IDs para suportar futuros atributos na relação (ex: validade, limite de peso).

O fluxo de status da `SalesOrder` é governado por `OrderStatusMachine`, uma classe pura sem dependências externas. O grafo de transições válidas é declarado como um mapa estático, tornando as regras visíveis e extensíveis sem alterar lógica de negócio dispersa nos services.

A `AuditLog` é uma entidade genérica com `entity` + `entityId` + `action` + estados JSON anterior/posterior — escolha deliberada para suportar auditoria de qualquer entidade sem criar tabelas de log por domínio.

---

## Estratégia de persistência

O banco de dados é PostgreSQL 16, acessado via Prisma com o adapter `@prisma/adapter-pg` (driver nativo, sem dependência do `pg` legado do lado do Prisma Engine).

As principais decisões de persistência:

- **Índices compostos** em `sales_orders`: `(status)`, `(customer_id)`, `(transport_type_id)` e `(status, created_at)` para suportar os filtros de monitoramento operacional sem full scan.
- **`_count` em vez de JOIN**: a listagem de ordens retorna `itemCount` via `_count: { select: { items: true } }`, evitando carregar todos os itens só para contar.
- **Mappers explícitos** (`SalesOrderMapper.toDomain`): a conversão entre o tipo Prisma e a entidade de domínio é isolada em `src/infra/database/prisma/mappers/`, mantendo os services agnósticos ao esquema do banco.
- **Migrations versionadas**: todo schema é gerenciado pelo Prisma Migrate, garantindo reprodutibilidade do ambiente entre desenvolvedores e em CI.

---

## Decisões arquiteturais

### Clean Architecture em camadas

O projeto segue separação explícita entre domínio, aplicação e infraestrutura:

```
src/
├── domain/          # Entidades, interfaces de repositório, enums, regras puras
├── application/     # Services, controllers, DTOs — orquestração de casos de uso
└── infra/           # Implementações Prisma, módulo de log
```

Nenhuma dependência do `domain/` aponta para NestJS ou Prisma, mantendo a lógica de negócio testável de forma isolada.

### Repository Pattern com injeção por token string

Os repositórios são definidos como interfaces em `domain/` e injetados via token string (`SALES_ORDER_REPOSITORY = 'ISalesOrderRepository'`). Isso desacopla os services das implementações concretas do Prisma e facilita a substituição em testes unitários sem carregar o framework.

### OrderStatusMachine

As transições de status são centralizadas em `OrderStatusMachine` — uma classe pura sem dependências de framework. Qualquer tentativa de transição inválida lança `InvalidTransitionError`, que o service mapeia para HTTP 422. Isso garante que a regra de fluxo é testável isoladamente e facilita adicionar novos estados sem modificar código espalhado.

### Logging estruturado com nestjs-pino

Todos os services usam `@InjectPinoLogger(ServiceName)` para logging contextualizado em JSON. Cada log de warning inclui o campo `rule` com o código da regra violada (ex: `TRANSPORT_NOT_AUTHORIZED`), facilitando a rastreabilidade em produção. O `correlationId` é propagado via header `x-correlation-id` ou gerado automaticamente por requisição.

---

## Considerações sobre escalabilidade

A arquitetura atual suporta escala vertical sem mudanças. Para escala horizontal, os pontos de atenção são:

- **Stateless por design**: a API não mantém estado em memória entre requisições — pode ser escalada horizontalmente com múltiplas instâncias atrás de um load balancer sem ajustes.
- **Geração de `orderNumber`**: o número da OV (`OV-YYYY-NNNNN`) é gerado com um `COUNT` no banco. Em alta concorrência, isso pode gerar colisões ou lentidão. A solução recomendada para escala é substituir por uma sequence de banco (`SERIAL` / `SEQUENCE` no PostgreSQL) ou um serviço de geração de IDs ordenados.
- **Auditoria assíncrona**: hoje o `AuditService.record()` é chamado de forma síncrona após cada operação. Em volume alto, isso adiciona latência. O próximo passo natural seria publicar eventos em uma fila (ex: BullMQ, SQS) e processar o log de auditoria de forma assíncrona, desacoplando a escrita do log da resposta HTTP.
- **Índices de banco**: os índices em `sales_orders` cobrem os filtros de monitoramento operacional. À medida que o volume cresce, índices parciais (ex: `WHERE status != 'DELIVERED'`) e particionamento por data podem ser considerados.

---

## Considerações sobre performance

- **N+1 eliminado na listagem**: a rota `GET /sales-orders` usa `_count` do Prisma para `itemCount` e carrega `customer` e `transportType` em uma única query com `include`, sem queries adicionais por registro.
- **Paginação obrigatória**: todos os endpoints de listagem aceitam `page` e `limit` (máximo 100) e nunca retornam conjuntos ilimitados.
- **Detalhe vs. lista separados**: o endpoint `GET /sales-orders` retorna uma representação resumida (sem itens completos). Os itens, agendamento e histórico de auditoria só são carregados no `GET /sales-orders/:id`, que é acessado sob demanda.
- **JSON nativo do PostgreSQL para auditoria**: `previousState` e `nextState` são colunas `Json` — a gravação e leitura são feitas diretamente pelo Prisma sem serialização adicional na aplicação.

---

## Trade-offs assumidos

| Decisão | Alternativa preterida | Motivo |
|---|---|---|
| Auditoria síncrona pós-operação | Transação compartilhada ou fila assíncrona | Reduz complexidade de infraestrutura sem comprometer o requisito funcional para o volume atual |
| `orderNumber` gerado via `COUNT` | Sequence de banco | Suficiente para o contexto do desafio; documentado como débito técnico para produção em alta escala |
| Entidades de domínio como interfaces TypeScript | Classes com decorators (ex: TypeORM entities) | Mantém o domínio puro e testável sem acoplamento a frameworks |
| Auditoria genérica (`entity` + `entityId` em texto) | Tabelas de log por entidade | Evita proliferação de tabelas e permite auditar qualquer entidade nova sem migrations adicionais |
| Sem autenticação/autorização | JWT + RBAC | Fora do escopo definido; a estrutura de módulos NestJS facilita a adição de guards globais sem refatoração |
