import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { CUSTOMER_REPOSITORY } from '../../src/application/customer/services/customers.service';
import { ITEM_REPOSITORY } from '../../src/application/item/services/items.service';
import {
  SALES_ORDER_REPOSITORY,
  SalesOrdersService,
} from '../../src/application/sales-order/services/sales-orders.service';
import { TRANSPORT_TYPE_REPOSITORY } from '../../src/application/transport-type/services/transport-types.service';
import { AuditService } from '../../src/application/audit/services/audit.service';
import { BadRequestException } from '../../src/common/filters/errors/bad-request.exception';
import { NotFoundException } from '../../src/common/filters/errors/not-found.exception';
import { UnprocessableEntityException } from '../../src/common/filters/errors/unprocessable-entity.exception';
import type { Customer } from '../../src/domain/customer/entities/customer.entity';
import type { SalesOrder } from '../../src/domain/sales-order/entities/sales-order.entity';
import { OrderStatus } from '../../src/domain/sales-order/enums/order-status.enum';
import type { TransportType } from '../../src/domain/transport-type/entities/transport-type.entity';
import type { Item } from '../../src/domain/item/entities/item.entity';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockOrderRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  updateStatus: jest.fn(),
};

const mockCustomerRepository = { findById: jest.fn() };
const mockItemRepository = { findManyByIds: jest.fn() };
const mockTransportTypeRepository = { findById: jest.fn() };
const mockAuditService = { record: jest.fn(), findAll: jest.fn() };

const makeTransportType = (
  overrides?: Partial<TransportType>,
): TransportType => ({
  id: 'tt-1',
  name: 'Caminhão',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeCustomer = (
  authorizedTransportTypes: TransportType[] = [],
): Customer => ({
  id: 'customer-1',
  name: 'Cliente',
  document: '12345678000100',
  email: 'test@test.com',
  authorizedTransportTypes,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeItem = (id = 'item-1'): Item => ({
  id,
  sku: 'P-001',
  name: 'Product',
  unit: 'UN',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeOrder = (overrides?: Partial<SalesOrder>): SalesOrder => ({
  id: 'order-1',
  orderNumber: 'OV-2026-00001',
  customerId: 'customer-1',
  transportTypeId: 'tt-1',
  status: OrderStatus.CREATED,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        {
          provide: getLoggerToken(SalesOrdersService.name),
          useValue: mockLogger,
        },
        { provide: SALES_ORDER_REPOSITORY, useValue: mockOrderRepository },
        { provide: CUSTOMER_REPOSITORY, useValue: mockCustomerRepository },
        { provide: ITEM_REPOSITORY, useValue: mockItemRepository },
        {
          provide: TRANSPORT_TYPE_REPOSITORY,
          useValue: mockTransportTypeRepository,
        },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get(SalesOrdersService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('RN-02: throws 422 NO_ITEMS when items array is empty', async () => {
      await expect(
        service.create({
          customerId: 'c-1',
          transportTypeId: 'tt-1',
          items: [],
        }),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        service.create({
          customerId: 'c-1',
          transportTypeId: 'tt-1',
          items: [],
        }),
      ).rejects.toMatchObject({ response: { code: 'NO_ITEMS' } });

      expect(mockCustomerRepository.findById).not.toHaveBeenCalled();
    });

    it('throws 400 when duplicate item IDs are provided', async () => {
      mockCustomerRepository.findById.mockResolvedValue(makeCustomer());
      mockTransportTypeRepository.findById.mockResolvedValue(
        makeTransportType(),
      );

      await expect(
        service.create({
          customerId: 'customer-1',
          transportTypeId: 'tt-1',
          items: [
            { itemId: 'item-1', quantity: 1 },
            { itemId: 'item-1', quantity: 2 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws 404 when customer does not exist', async () => {
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(
        service.create({
          customerId: 'nonexistent',
          transportTypeId: 'tt-1',
          items: [{ itemId: 'item-1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when transport type does not exist', async () => {
      mockCustomerRepository.findById.mockResolvedValue(makeCustomer());
      mockTransportTypeRepository.findById.mockResolvedValue(null);

      await expect(
        service.create({
          customerId: 'customer-1',
          transportTypeId: 'nonexistent',
          items: [{ itemId: 'item-1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('RN-01: throws 422 TRANSPORT_NOT_AUTHORIZED when customer has no authorized types', async () => {
      const tt = makeTransportType();
      mockCustomerRepository.findById.mockResolvedValue(makeCustomer([])); // no authorized types
      mockTransportTypeRepository.findById.mockResolvedValue(tt);

      await expect(
        service.create({
          customerId: 'customer-1',
          transportTypeId: 'tt-1',
          items: [{ itemId: 'item-1', quantity: 1 }],
        }),
      ).rejects.toMatchObject({
        response: { code: 'TRANSPORT_NOT_AUTHORIZED' },
      });
    });

    it('RN-01: throws 422 TRANSPORT_NOT_AUTHORIZED when transport type is not in customer authorized list', async () => {
      const otherTT = makeTransportType({ id: 'tt-other' });
      mockCustomerRepository.findById.mockResolvedValue(
        makeCustomer([otherTT]),
      );
      mockTransportTypeRepository.findById.mockResolvedValue(
        makeTransportType({ id: 'tt-1' }),
      );

      await expect(
        service.create({
          customerId: 'customer-1',
          transportTypeId: 'tt-1',
          items: [{ itemId: 'item-1', quantity: 1 }],
        }),
      ).rejects.toMatchObject({
        response: { code: 'TRANSPORT_NOT_AUTHORIZED' },
      });
    });

    it('throws 404 when one or more items do not exist (RN-03)', async () => {
      const tt = makeTransportType();
      mockCustomerRepository.findById.mockResolvedValue(makeCustomer([tt]));
      mockTransportTypeRepository.findById.mockResolvedValue(tt);
      mockItemRepository.findManyByIds.mockResolvedValue([]); // no items found

      await expect(
        service.create({
          customerId: 'customer-1',
          transportTypeId: 'tt-1',
          items: [{ itemId: 'nonexistent', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the order and records audit on success', async () => {
      const tt = makeTransportType();
      const item = makeItem();
      const order = makeOrder();

      mockCustomerRepository.findById.mockResolvedValue(makeCustomer([tt]));
      mockTransportTypeRepository.findById.mockResolvedValue(tt);
      mockItemRepository.findManyByIds.mockResolvedValue([item]);
      mockOrderRepository.create.mockResolvedValue(order);
      mockAuditService.record.mockResolvedValue(undefined);

      const result = await service.create({
        customerId: 'customer-1',
        transportTypeId: 'tt-1',
        items: [{ itemId: 'item-1', quantity: 2 }],
      });

      expect(result.id).toBe('order-1');
      expect(result.status).toBe(OrderStatus.CREATED);
      expect(mockOrderRepository.create).toHaveBeenCalledWith({
        customerId: 'customer-1',
        transportTypeId: 'tt-1',
        notes: undefined,
        items: [{ itemId: 'item-1', quantity: 2 }],
      });
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORDER_CREATED',
          entity: 'SalesOrder',
        }),
      );
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('throws 404 when order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: OrderStatus.PLANNED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 422 INVALID_STATUS_TRANSITION for invalid transition (CREATED → SCHEDULED)', async () => {
      mockOrderRepository.findById.mockResolvedValue(
        makeOrder({ status: OrderStatus.CREATED }),
      );

      await expect(
        service.updateStatus('order-1', { status: OrderStatus.SCHEDULED }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_STATUS_TRANSITION' },
      });
    });

    it('RN-06: throws 422 SCHEDULE_REQUIRED when transitioning to SCHEDULED without a schedule', async () => {
      mockOrderRepository.findById.mockResolvedValue(
        makeOrder({ status: OrderStatus.PLANNED, schedule: null }),
      );

      await expect(
        service.updateStatus('order-1', { status: OrderStatus.SCHEDULED }),
      ).rejects.toMatchObject({ response: { code: 'SCHEDULE_REQUIRED' } });
    });

    it('RN-07: throws 422 SCHEDULE_NOT_CONFIRMED when transitioning to IN_TRANSIT without confirmed schedule', async () => {
      mockOrderRepository.findById.mockResolvedValue(
        makeOrder({
          status: OrderStatus.SCHEDULED,
          schedule: {
            id: 's-1',
            salesOrderId: 'order-1',
            scheduledDate: new Date(),
            windowStart: '08:00',
            windowEnd: '12:00',
            confirmedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      );

      await expect(
        service.updateStatus('order-1', { status: OrderStatus.IN_TRANSIT }),
      ).rejects.toMatchObject({ response: { code: 'SCHEDULE_NOT_CONFIRMED' } });
    });

    it('updates status and records audit on valid transition', async () => {
      mockOrderRepository.findById.mockResolvedValue(
        makeOrder({ status: OrderStatus.CREATED }),
      );
      const updated = makeOrder({ status: OrderStatus.PLANNED });
      mockOrderRepository.updateStatus.mockResolvedValue(updated);
      mockAuditService.record.mockResolvedValue(undefined);

      const result = await service.updateStatus('order-1', {
        status: OrderStatus.PLANNED,
      });

      expect(result.status).toBe(OrderStatus.PLANNED);
      expect(mockAuditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ORDER_STATUS_CHANGED',
          previousState: { status: OrderStatus.CREATED },
          nextState: { status: OrderStatus.PLANNED },
        }),
      );
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('throws 404 when order not found', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns order with audit history', async () => {
      const order = makeOrder();
      mockOrderRepository.findById.mockResolvedValue(order);
      mockAuditService.findAll.mockResolvedValue({
        data: [{ action: 'ORDER_CREATED' }],
        total: 1,
      });

      const result = await service.findById('order-1');

      expect(result.id).toBe('order-1');
      expect(result.auditHistory).toHaveLength(1);
      expect(mockAuditService.findAll).toHaveBeenCalledWith({
        entity: 'SalesOrder',
        entityId: 'order-1',
      });
    });
  });
});
