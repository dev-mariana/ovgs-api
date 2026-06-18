import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateItemDto } from '../dto/create-item.dto';
import { ListItemsDto } from '../dto/list-items.dto';
import { ItemsService } from '../services/items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly service: ItemsService) {}

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: ListItemsDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
