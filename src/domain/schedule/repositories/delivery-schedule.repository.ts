import { DeliverySchedule } from '../entities/delivery-schedule.entity';

export type CreateScheduleData = {
  salesOrderId: string;
  scheduledDate: Date;
  windowStart: string;
  windowEnd: string;
};

export type UpdateScheduleData = Partial<
  Pick<DeliverySchedule, 'scheduledDate' | 'windowStart' | 'windowEnd'>
>;

export interface IDeliveryScheduleRepository {
  findBySalesOrderId(salesOrderId: string): Promise<DeliverySchedule | null>;
  create(data: CreateScheduleData): Promise<DeliverySchedule>;
  update(
    salesOrderId: string,
    data: UpdateScheduleData,
  ): Promise<DeliverySchedule>;
  confirm(salesOrderId: string): Promise<DeliverySchedule>;
}
