import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvestmentsService } from './investments.service';

@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private investments: InvestmentsService) {}

  @Get('recommendation')
  recommendation(@CurrentUser() user: { id: string }) {
    return this.investments.getRecommendation(user.id);
  }

  @Get('simulate')
  simulate(
    @CurrentUser() user: { id: string },
    @Query('months', new DefaultValuePipe(36), ParseIntPipe) months: number,
  ) {
    return this.investments.simulate(user.id, months);
  }

  @Get('scenarios')
  scenarios(@CurrentUser() user: { id: string }) {
    return this.investments.scenarios(user.id);
  }
}
