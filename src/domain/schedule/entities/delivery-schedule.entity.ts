export interface DeliverySchedule {
  id: string;
  salesOrderId: string;
  scheduledDate: Date;
  windowStart: string;
  windowEnd: string;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
