import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateTransportTypeDto } from '../dto/create-transport-type.dto';
import { UpdateTransportTypeDto } from '../dto/update-transport-type.dto';
import { TransportTypesService } from '../services/transport-types.service';

@Controller('transport-types')
export class TransportTypesController {
  constructor(private readonly service: TransportTypesService) {}

  @Post()
  create(@Body() dto: CreateTransportTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTransportTypeDto) {
    return this.service.update(id, dto);
  }
}
