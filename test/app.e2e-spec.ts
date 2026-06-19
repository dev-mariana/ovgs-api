import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { globalValidationPipe } from '../src/common/pipes/validation.pipe';
import { PrismaService } from '../src/infra/database/prisma/prisma.service';

async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.deliverySchedule.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.customerTransportType.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.transportType.deleteMany();
  await prisma.item.deleteMany();
}

describe('OVGS API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    app.useGlobalPipes(globalValidationPipe);
    app.useGlobalFilters(
      new PrismaExceptionFilter(),
      new HttpExceptionFilter(),
    );
    await app.init();

    prisma = app.get(PrismaService);
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  // ─── Transport Types ───────────────────────────────────────────────────────

  describe('/transport-types', () => {
    it('POST 201 — creates a transport type', async () => {
      const res = await http
        .post('/transport-types')
        .send({ name: 'Caminhão', description: 'Truck' })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        name: 'Caminhão',
        active: true,
      });
    });

    it('POST 409 — duplicate name', async () => {
      await http
        .post('/transport-types')
        .send({ name: 'Caminhão' })
        .expect(201);
      await http
        .post('/transport-types')
        .send({ name: 'Caminhão' })
        .expect(409);
    });

    it('GET 200 — lists transport types', async () => {
      await http
        .post('/transport-types')
        .send({ name: 'Caminhão' })
        .expect(201);

      const res = await http.get('/transport-types').expect(200);
      expect(res.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'Caminhão' })]),
      );
    });

    it('GET :id 200 — gets by id', async () => {
      const { body: tt } = await http
        .post('/transport-types')
        .send({ name: 'Carreta' })
        .expect(201);
      const res = await http.get(`/transport-types/${tt.id}`).expect(200);
      expect(res.body.id).toBe(tt.id);
    });

    it('GET :id 404 — not found', async () => {
      await http.get('/transport-types/nonexistent-id').expect(404);
    });

    it('PATCH :id 200 — updates', async () => {
      const { body: tt } = await http
        .post('/transport-types')
        .send({ name: 'Bi-truck' })
        .expect(201);
      const res = await http
        .patch(`/transport-types/${tt.id}`)
        .send({ active: false })
        .expect(200);
      expect(res.body.active).toBe(false);
    });
  });

  // ─── Items ────────────────────────────────────────────────────────────────

  describe('/items', () => {
    it('POST 201 — creates an item', async () => {
      const res = await http
        .post('/items')
        .send({ sku: 'PROD-001', name: 'Pallet de cimento', unit: 'UN' })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        sku: 'PROD-001',
      });
    });

    it('POST 409 — duplicate SKU', async () => {
      await http
        .post('/items')
        .send({ sku: 'PROD-001', name: 'Item A', unit: 'UN' })
        .expect(201);
      await http
        .post('/items')
        .send({ sku: 'PROD-001', name: 'Item B', unit: 'UN' })
        .expect(409);
    });

    it('GET 200 — lists items with search', async () => {
      await http
        .post('/items')
        .send({ sku: 'PROD-001', name: 'Cimento', unit: 'KG' })
        .expect(201);
      await http
        .post('/items')
        .send({ sku: 'PROD-002', name: 'Areia', unit: 'KG' })
        .expect(201);

      const res = await http.get('/items?search=cimento').expect(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].sku).toBe('PROD-001');
    });

    it('GET :id 200 — gets by id', async () => {
      const { body: item } = await http
        .post('/items')
        .send({ sku: 'X-001', name: 'Item X', unit: 'UN' })
        .expect(201);
      const res = await http.get(`/items/${item.id}`).expect(200);
      expect(res.body.sku).toBe('X-001');
    });

    it('GET :id 404 — not found', async () => {
      await http.get('/items/nonexistent-id').expect(404);
    });
  });

  // ─── Customers ────────────────────────────────────────────────────────────

  describe('/customers', () => {
    it('POST 201 — creates a customer', async () => {
      const res = await http
        .post('/customers')
        .send({
          name: 'Transportes Silva',
          document: '12345678000100',
          email: 'silva@example.com',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        document: '12345678000100',
      });
    });

    it('POST 409 — duplicate document', async () => {
      await http
        .post('/customers')
        .send({ name: 'Silva', document: '12345678000100', email: 'a@a.com' })
        .expect(201);
      await http
        .post('/customers')
        .send({ name: 'Outro', document: '12345678000100', email: 'b@b.com' })
        .expect(409);
    });

    it('GET 200 — lists with search', async () => {
      await http
        .post('/customers')
        .send({
          name: 'Transportes Silva',
          document: '11111111000100',
          email: 'x@x.com',
        })
        .expect(201);
      const res = await http.get('/customers?search=silva').expect(200);
      expect(res.body.total).toBe(1);
    });

    it('GET :id 200 — detail with authorizedTransportTypes', async () => {
      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Cliente A',
          document: '22222222000100',
          email: 'a@test.com',
        })
        .expect(201);

      const res = await http.get(`/customers/${customer.id}`).expect(200);
      expect(res.body.authorizedTransportTypes).toEqual([]);
    });

    it('GET :id 404 — not found', async () => {
      await http.get('/customers/nonexistent-id').expect(404);
    });

    it('PATCH :id 200 — updates name', async () => {
      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Old Name',
          document: '33333333000100',
          email: 'b@test.com',
        })
        .expect(201);

      const res = await http
        .patch(`/customers/${customer.id}`)
        .send({ name: 'New Name' })
        .expect(200);
      expect(res.body.name).toBe('New Name');
    });

    it('PATCH :id 404 — not found', async () => {
      await http
        .patch('/customers/nonexistent-id')
        .send({ name: 'X' })
        .expect(404);
    });

    it('PUT :id/transport-types 200 — sets authorized transport types', async () => {
      const { body: tt } = await http
        .post('/transport-types')
        .send({ name: 'Truck' })
        .expect(201);
      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Cliente B',
          document: '44444444000100',
          email: 'c@test.com',
        })
        .expect(201);

      const res = await http
        .put(`/customers/${customer.id}/transport-types`)
        .send({ transportTypeIds: [tt.id] })
        .expect(200);

      expect(res.body.authorizedTransportTypes).toHaveLength(1);
      expect(res.body.authorizedTransportTypes[0].id).toBe(tt.id);
    });

    it('PUT :id/transport-types 404 — invalid transport type id', async () => {
      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Cliente C',
          document: '55555555000100',
          email: 'd@test.com',
        })
        .expect(201);

      await http
        .put(`/customers/${customer.id}/transport-types`)
        .send({ transportTypeIds: ['nonexistent-id'] })
        .expect(404);
    });
  });

  // ─── Sales Orders — Error Cases ───────────────────────────────────────────

  describe('/sales-orders — business rule errors', () => {
    let transportTypeId: string;
    let itemId: string;
    let customerId: string;

    beforeEach(async () => {
      const { body: tt } = await http
        .post('/transport-types')
        .send({ name: 'Caminhão' })
        .expect(201);
      transportTypeId = tt.id;

      const { body: item } = await http
        .post('/items')
        .send({ sku: 'P-001', name: 'Item', unit: 'UN' })
        .expect(201);
      itemId = item.id;

      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Cliente',
          document: '66666666000100',
          email: 'e@test.com',
        })
        .expect(201);
      customerId = customer.id;

      await http
        .put(`/customers/${customerId}/transport-types`)
        .send({ transportTypeIds: [transportTypeId] })
        .expect(200);
    });

    it('POST 422 — RN-02: no items', async () => {
      const res = await http
        .post('/sales-orders')
        .send({ customerId, transportTypeId, items: [] })
        .expect(422);

      expect(res.body.code).toBe('NO_ITEMS');
    });

    it('POST 422 — RN-01: transport not authorized', async () => {
      const { body: otherTT } = await http
        .post('/transport-types')
        .send({ name: 'Carreta' })
        .expect(201);

      const res = await http
        .post('/sales-orders')
        .send({
          customerId,
          transportTypeId: otherTT.id,
          items: [{ itemId, quantity: 1 }],
        })
        .expect(422);

      expect(res.body.code).toBe('TRANSPORT_NOT_AUTHORIZED');
    });

    it('POST 404 — customer not found', async () => {
      await http
        .post('/sales-orders')
        .send({
          customerId: 'nonexistent',
          transportTypeId,
          items: [{ itemId, quantity: 1 }],
        })
        .expect(404);
    });

    it('POST 404 — transport type not found', async () => {
      await http
        .post('/sales-orders')
        .send({
          customerId,
          transportTypeId: 'nonexistent',
          items: [{ itemId, quantity: 1 }],
        })
        .expect(404);
    });

    it('POST 400 — duplicate item IDs', async () => {
      await http
        .post('/sales-orders')
        .send({
          customerId,
          transportTypeId,
          items: [
            { itemId, quantity: 1 },
            { itemId, quantity: 2 },
          ],
        })
        .expect(400);
    });

    it('POST 404 — item not found (RN-03)', async () => {
      await http
        .post('/sales-orders')
        .send({
          customerId,
          transportTypeId,
          items: [{ itemId: 'nonexistent', quantity: 1 }],
        })
        .expect(404);
    });

    it('PATCH :id/status 422 — invalid transition (CREATED → SCHEDULED)', async () => {
      const { body: order } = await http
        .post('/sales-orders')
        .send({ customerId, transportTypeId, items: [{ itemId, quantity: 1 }] })
        .expect(201);

      const res = await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'SCHEDULED' })
        .expect(422);
      expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('PATCH :id/status 422 — RN-06: PLANNED → SCHEDULED without schedule', async () => {
      const { body: order } = await http
        .post('/sales-orders')
        .send({ customerId, transportTypeId, items: [{ itemId, quantity: 1 }] })
        .expect(201);

      await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'PLANNED' })
        .expect(200);

      const res = await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'SCHEDULED' })
        .expect(422);
      expect(res.body.code).toBe('SCHEDULE_REQUIRED');
    });

    it('PATCH :id/status 422 — RN-07: SCHEDULED → IN_TRANSIT without confirmed schedule', async () => {
      const { body: order } = await http
        .post('/sales-orders')
        .send({ customerId, transportTypeId, items: [{ itemId, quantity: 1 }] })
        .expect(201);

      await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'PLANNED' })
        .expect(200);
      await http
        .post(`/sales-orders/${order.id}/schedule`)
        .send({
          scheduledDate: '2026-12-01',
          windowStart: '08:00',
          windowEnd: '12:00',
        })
        .expect(201);
      await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'SCHEDULED' })
        .expect(200);

      const res = await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'IN_TRANSIT' })
        .expect(422);
      expect(res.body.code).toBe('SCHEDULE_NOT_CONFIRMED');
    });

    it('GET :id 404 — not found', async () => {
      await http.get('/sales-orders/nonexistent-id').expect(404);
    });
  });

  // ─── Schedule — Error Cases ───────────────────────────────────────────────

  describe('/sales-orders/:id/schedule — error cases', () => {
    let orderId: string;

    beforeEach(async () => {
      const { body: tt } = await http
        .post('/transport-types')
        .send({ name: 'Truck' })
        .expect(201);
      const { body: item } = await http
        .post('/items')
        .send({ sku: 'S-001', name: 'Item', unit: 'UN' })
        .expect(201);
      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Cliente',
          document: '77777777000100',
          email: 'f@test.com',
        })
        .expect(201);
      await http
        .put(`/customers/${customer.id}/transport-types`)
        .send({ transportTypeIds: [tt.id] })
        .expect(200);

      const { body: order } = await http
        .post('/sales-orders')
        .send({
          customerId: customer.id,
          transportTypeId: tt.id,
          items: [{ itemId: item.id, quantity: 2 }],
        })
        .expect(201);
      orderId = order.id;
    });

    it('POST 422 — order not in PLANNED status', async () => {
      const res = await http
        .post(`/sales-orders/${orderId}/schedule`)
        .send({
          scheduledDate: '2026-12-01',
          windowStart: '08:00',
          windowEnd: '12:00',
        })
        .expect(422);

      expect(res.body.code).toBe('INVALID_ORDER_STATUS');
    });

    it('POST 400 — windowEnd not after windowStart (RN-09)', async () => {
      await http
        .patch(`/sales-orders/${orderId}/status`)
        .send({ status: 'PLANNED' })
        .expect(200);

      await http
        .post(`/sales-orders/${orderId}/schedule`)
        .send({
          scheduledDate: '2026-12-01',
          windowStart: '12:00',
          windowEnd: '08:00',
        })
        .expect(400);
    });

    it('POST 409 — schedule already exists', async () => {
      await http
        .patch(`/sales-orders/${orderId}/status`)
        .send({ status: 'PLANNED' })
        .expect(200);
      await http
        .post(`/sales-orders/${orderId}/schedule`)
        .send({
          scheduledDate: '2026-12-01',
          windowStart: '08:00',
          windowEnd: '12:00',
        })
        .expect(201);
      await http
        .post(`/sales-orders/${orderId}/schedule`)
        .send({
          scheduledDate: '2026-12-02',
          windowStart: '09:00',
          windowEnd: '11:00',
        })
        .expect(409);
    });

    it('PATCH 422 — rescheduling not allowed in CREATED status (RN-10)', async () => {
      const res = await http
        .patch(`/sales-orders/${orderId}/schedule`)
        .send({ scheduledDate: '2026-12-05' })
        .expect(422);

      expect(res.body.code).toBe('INVALID_ORDER_STATUS');
    });

    it('PATCH 400 — windowEnd not after windowStart on reschedule (RN-09)', async () => {
      await http
        .patch(`/sales-orders/${orderId}/status`)
        .send({ status: 'PLANNED' })
        .expect(200);
      await http
        .post(`/sales-orders/${orderId}/schedule`)
        .send({
          scheduledDate: '2026-12-01',
          windowStart: '08:00',
          windowEnd: '12:00',
        })
        .expect(201);

      await http
        .patch(`/sales-orders/${orderId}/schedule`)
        .send({ windowStart: '14:00', windowEnd: '10:00' })
        .expect(400);
    });

    it('POST /confirm 409 — already confirmed', async () => {
      await http
        .patch(`/sales-orders/${orderId}/status`)
        .send({ status: 'PLANNED' })
        .expect(200);
      await http
        .post(`/sales-orders/${orderId}/schedule`)
        .send({
          scheduledDate: '2026-12-01',
          windowStart: '08:00',
          windowEnd: '12:00',
        })
        .expect(201);
      await http.post(`/sales-orders/${orderId}/schedule/confirm`).expect(200);
      await http.post(`/sales-orders/${orderId}/schedule/confirm`).expect(409);
    });
  });

  // ─── Full Order Lifecycle ─────────────────────────────────────────────────

  describe('Full order lifecycle', () => {
    it('should complete CREATED → PLANNED → SCHEDULED → IN_TRANSIT → DELIVERED with audit trail', async () => {
      // Seed
      const { body: tt } = await http
        .post('/transport-types')
        .send({ name: 'Caminhão Baú' })
        .expect(201);
      const { body: item } = await http
        .post('/items')
        .send({ sku: 'CEMENT-50KG', name: 'Cimento 50kg', unit: 'SC' })
        .expect(201);
      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Construtora ABC',
          document: '99999999000100',
          email: 'abc@const.com',
        })
        .expect(201);
      await http
        .put(`/customers/${customer.id}/transport-types`)
        .send({ transportTypeIds: [tt.id] })
        .expect(200);

      // Create order
      const { body: order } = await http
        .post('/sales-orders')
        .send({
          customerId: customer.id,
          transportTypeId: tt.id,
          notes: 'Entrega urgente',
          items: [{ itemId: item.id, quantity: 10 }],
        })
        .expect(201);

      expect(order.status).toBe('CREATED');
      expect(order.orderNumber).toMatch(/^OV-\d{4}-\d{5}$/);
      expect(order.items).toHaveLength(1);
      expect(order.deliverySchedule).toBeNull();

      // List with filter
      const listRes = await http
        .get(`/sales-orders?status=CREATED&customerId=${customer.id}`)
        .expect(200);
      expect(listRes.body.total).toBe(1);
      expect(listRes.body.data[0].itemCount).toBe(1);

      // CREATED → PLANNED
      const { body: planned } = await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'PLANNED' })
        .expect(200);
      expect(planned.status).toBe('PLANNED');

      // Create schedule
      const { body: schedule } = await http
        .post(`/sales-orders/${order.id}/schedule`)
        .send({
          scheduledDate: '2026-12-15',
          windowStart: '08:00',
          windowEnd: '14:00',
        })
        .expect(201);
      expect(schedule.scheduledDate).toBe('2026-12-15');
      expect(schedule.confirmedAt).toBeNull();

      // Reschedule
      const { body: rescheduled } = await http
        .patch(`/sales-orders/${order.id}/schedule`)
        .send({ windowEnd: '12:00' })
        .expect(200);
      expect(rescheduled.windowEnd).toBe('12:00');

      // PLANNED → SCHEDULED
      const { body: scheduled } = await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'SCHEDULED' })
        .expect(200);
      expect(scheduled.status).toBe('SCHEDULED');

      // Confirm schedule
      const { body: confirmed } = await http
        .post(`/sales-orders/${order.id}/schedule/confirm`)
        .expect(200);
      expect(confirmed.confirmedAt).not.toBeNull();

      // SCHEDULED → IN_TRANSIT
      const { body: inTransit } = await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'IN_TRANSIT' })
        .expect(200);
      expect(inTransit.status).toBe('IN_TRANSIT');

      // IN_TRANSIT → DELIVERED
      const { body: delivered } = await http
        .patch(`/sales-orders/${order.id}/status`)
        .send({ status: 'DELIVERED' })
        .expect(200);
      expect(delivered.status).toBe('DELIVERED');

      // Verify full detail with audit history (entity=SalesOrder only)
      const { body: detail } = await http
        .get(`/sales-orders/${order.id}`)
        .expect(200);
      expect(detail.status).toBe('DELIVERED');
      expect(detail.deliverySchedule.confirmedAt).not.toBeNull();
      expect(detail.auditHistory).toHaveLength(5); // ORDER_CREATED + 4 × ORDER_STATUS_CHANGED

      const actions = detail.auditHistory.map(
        (h: { action: string }) => h.action,
      );
      expect(actions).toContain('ORDER_CREATED');
      expect(
        actions.filter((a: string) => a === 'ORDER_STATUS_CHANGED'),
      ).toHaveLength(4);

      // Schedule events live under entity=DeliverySchedule — verify via audit-logs endpoint
      const scheduleAudit = await http
        .get('/audit-logs?entity=DeliverySchedule')
        .expect(200);
      const scheduleActions = scheduleAudit.body.data.map(
        (h: { action: string }) => h.action,
      );
      expect(scheduleActions).toContain('SCHEDULE_CREATED');
      expect(scheduleActions).toContain('SCHEDULE_RESCHEDULED');
      expect(scheduleActions).toContain('SCHEDULE_CONFIRMED');
    });
  });

  // ─── Audit Logs ───────────────────────────────────────────────────────────

  describe('/audit-logs', () => {
    it('GET 200 — lists with entity and action filters', async () => {
      // Create data to generate audit entries
      const { body: tt } = await http
        .post('/transport-types')
        .send({ name: 'Van' })
        .expect(201);
      const { body: item } = await http
        .post('/items')
        .send({ sku: 'A-001', name: 'Item A', unit: 'UN' })
        .expect(201);
      const { body: customer } = await http
        .post('/customers')
        .send({
          name: 'Audit Customer',
          document: '88888888000100',
          email: 'audit@test.com',
        })
        .expect(201);
      await http
        .put(`/customers/${customer.id}/transport-types`)
        .send({ transportTypeIds: [tt.id] })
        .expect(200);
      const { body: order } = await http
        .post('/sales-orders')
        .send({
          customerId: customer.id,
          transportTypeId: tt.id,
          items: [{ itemId: item.id, quantity: 3 }],
        })
        .expect(201);

      // List all
      const all = await http.get('/audit-logs').expect(200);
      expect(all.body.total).toBeGreaterThan(0);

      // Filter by entity
      const filtered = await http
        .get(`/audit-logs?entity=SalesOrder&entityId=${order.id}`)
        .expect(200);
      expect(filtered.body.total).toBe(1);
      expect(filtered.body.data[0].action).toBe('ORDER_CREATED');

      // Filter by action
      const byAction = await http
        .get('/audit-logs?action=ORDER_CREATED')
        .expect(200);
      expect(
        byAction.body.data.every(
          (l: { action: string }) => l.action === 'ORDER_CREATED',
        ),
      ).toBe(true);
    });
  });
});
