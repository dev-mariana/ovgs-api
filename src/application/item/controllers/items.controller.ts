import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateItemDto } from '../dto/create-item.dto';
import { ListItemsDto } from '../dto/list-items.dto';
import { ItemsService } from '../services/items.service';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(private readonly service: ItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an item' })
  @ApiResponse({ status: 201, description: 'Item created.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 409, description: 'SKU already registered.' })
  create(@Body() dto: CreateItemDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List items with optional search' })
  @ApiResponse({ status: 200, description: 'Paginated list of items.' })
  findAll(@Query() query: ListItemsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item by id' })
  @ApiResponse({ status: 200, description: 'Item detail.' })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
