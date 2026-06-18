import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { ListCustomersDto } from '../dto/list-customers.dto';
import { SetTransportTypesDto } from '../dto/set-transport-types.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomersService } from '../services/customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListCustomersDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/transport-types')
  setTransportTypes(
    @Param('id') id: string,
    @Body() dto: SetTransportTypesDto,
  ) {
    return this.service.setAuthorizedTransportTypes(id, dto);
  }
}
