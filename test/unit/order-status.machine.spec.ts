import { OrderStatus } from '../../src/domain/sales-order/enums/order-status.enum';
import {
  InvalidTransitionError,
  OrderStatusMachine,
} from '../../src/domain/sales-order/order-status.machine';

describe('OrderStatusMachine', () => {
  describe('valid transitions', () => {
    it.each([
      [OrderStatus.CREATED, OrderStatus.PLANNED],
      [OrderStatus.PLANNED, OrderStatus.SCHEDULED],
      [OrderStatus.SCHEDULED, OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED],
    ])('%s → %s', (from, to) => {
      expect(() => OrderStatusMachine.transition(from, to)).not.toThrow();
    });
  });

  describe('invalid transitions', () => {
    it.each([
      [OrderStatus.CREATED, OrderStatus.SCHEDULED],
      [OrderStatus.CREATED, OrderStatus.IN_TRANSIT],
      [OrderStatus.CREATED, OrderStatus.DELIVERED],
      [OrderStatus.PLANNED, OrderStatus.CREATED],
      [OrderStatus.PLANNED, OrderStatus.IN_TRANSIT],
      [OrderStatus.SCHEDULED, OrderStatus.PLANNED],
      [OrderStatus.SCHEDULED, OrderStatus.CREATED],
      [OrderStatus.DELIVERED, OrderStatus.IN_TRANSIT],
    ])('%s → %s throws InvalidTransitionError', (from, to) => {
      expect(() => OrderStatusMachine.transition(from, to)).toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe('terminal state', () => {
    it('DELIVERED has no valid next transition', () => {
      const allStatuses = Object.values(OrderStatus);
      for (const to of allStatuses) {
        expect(() =>
          OrderStatusMachine.transition(OrderStatus.DELIVERED, to),
        ).toThrow(InvalidTransitionError);
      }
    });
  });
});
