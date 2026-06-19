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

Os repositórios são definidos como interfaces em `domain/` e injetados via token string (`SALES_ORDER_REPOSITORY = 'ISalesOrderRepository'`). Isso desacopla os services das implementações concretas do Prisma e facilita a troca em testes unitários sem carregar o framework.

### OrderStatusMachine

As transições de status são centralizadas em `OrderStatusMachine` — uma classe pura sem dependências de framework. Qualquer tentativa de transição inválida lança `InvalidTransitionError`, que o service mapeia para HTTP 422. Isso garante que a regra de fluxo é testável sem subir a aplicação.

### Auditoria pós-operação

O `AuditService.record()` é chamado após a operação principal ser persistida com sucesso. Isso significa que em caso de falha no registro de auditoria, a operação já foi commitada. O trade-off consciente é favorecer consistência da operação de negócio sobre a completude do log — uma solução transacional (evento dentro da mesma transação) seria mais robusta mas exigiria maior complexidade de infraestrutura.

### itemCount via `_count` do Prisma

A listagem de ordens retorna `itemCount` sem carregar os itens completos. Isso é feito através de `_count: { select: { items: true } }` no `findAll` do repositório, evitando N+1 e mantendo a resposta leve.

### Logging estruturado com nestjs-pino

Todos os services usam `@InjectPinoLogger(ServiceName)` para logging contextualizado. Cada log de warning inclui o campo `rule` com o código da regra violada (ex: `TRANSPORT_NOT_AUTHORIZED`), facilitando a rastreabilidade em produção. O `correlationId` é propagado via header `x-correlation-id` ou gerado automaticamente por requisição.

### ConfigModule para carregamento do .env

O `ConfigModule.forRoot({ isGlobal: true })` é carregado como primeiro módulo no `AppModule`, garantindo que as variáveis de ambiente estejam disponíveis antes de qualquer instanciação de serviço (incluindo o `PrismaService`).
