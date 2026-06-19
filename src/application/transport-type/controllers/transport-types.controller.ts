import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransportTypeDto } from '../dto/create-transport-type.dto';
import { UpdateTransportTypeDto } from '../dto/update-transport-type.dto';
import { TransportTypesService } from '../services/transport-types.service';

@ApiTags('Transport Types')
@Controller('transport-types')
export class TransportTypesController {
  constructor(private readonly service: TransportTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transport type' })
  @ApiResponse({ status: 201, description: 'Transport type created.' })
  @ApiResponse({ status: 409, description: 'Name already registered.' })
  create(@Body() dto: CreateTransportTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active transport types' })
  @ApiResponse({ status: 200, description: 'List of transport types.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transport type by id' })
  @ApiResponse({ status: 200, description: 'Transport type detail.' })
  @ApiResponse({ status: 404, description: 'Transport type not found.' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transport type' })
  @ApiResponse({ status: 200, description: 'Transport type updated.' })
  @ApiResponse({ status: 404, description: 'Transport type not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateTransportTypeDto) {
    return this.service.update(id, dto);
  }
}
