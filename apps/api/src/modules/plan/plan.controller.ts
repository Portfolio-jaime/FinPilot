import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@UseGuards(JwtAuthGuard)
@Controller('plan')
export class PlanController {
  constructor(private plan: PlanService) {}

  @Get()
  get(@CurrentUser() user: { id: string }) {
    return this.plan.get(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreatePlanDto) {
    return this.plan.create(user.id, dto);
  }

  @Put()
  update(@CurrentUser() user: { id: string }, @Body() dto: UpdatePlanDto) {
    return this.plan.update(user.id, dto);
  }
}
