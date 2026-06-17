import { OrderStatus } from './enums/order-status.enum';

export class InvalidTransitionError extends Error {
  readonly from: OrderStatus;
  readonly to: OrderStatus;

  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

const TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.CREATED]: OrderStatus.PLANNED,
  [OrderStatus.PLANNED]: OrderStatus.SCHEDULED,
  [OrderStatus.SCHEDULED]: OrderStatus.IN_TRANSIT,
  [OrderStatus.IN_TRANSIT]: OrderStatus.DELIVERED,
};

export class OrderStatusMachine {
  static transition(from: OrderStatus, to: OrderStatus): void {
    if (TRANSITIONS[from] !== to) {
      throw new InvalidTransitionError(from, to);
    }
  }
}
