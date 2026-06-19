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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { ListCustomersDto } from '../dto/list-customers.dto';
import { SetTransportTypesDto } from '../dto/set-transport-types.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomersService } from '../services/customers.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  @ApiResponse({ status: 201, description: 'Customer created.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({
    status: 409,
    description: 'Document or email already registered.',
  })
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customers' })
  @ApiResponse({ status: 200, description: 'Paginated list of customers.' })
  findAll(@Query() query: ListCustomersDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiResponse({
    status: 200,
    description: 'Customer detail with authorized transport types.',
  })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer name or email' })
  @ApiResponse({ status: 200, description: 'Customer updated.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/transport-types')
  @ApiOperation({ summary: 'Replace authorized transport types for customer' })
  @ApiResponse({
    status: 200,
    description: 'Authorized transport types updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer or transport type not found.',
  })
  setTransportTypes(
    @Param('id') id: string,
    @Body() dto: SetTransportTypesDto,
  ) {
    return this.service.setAuthorizedTransportTypes(id, dto);
  }
}
