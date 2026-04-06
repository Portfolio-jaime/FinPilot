import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WalletsService } from './wallets.service';
import { DepositDto } from './dto/deposit.dto';
import { ConvertDto } from './dto/convert.dto';

@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private wallets: WalletsService) {}

  @Get()
  getWallets(@CurrentUser() user: { id: string }) {
    return this.wallets.getWallets(user.id);
  }

  @Post('deposit')
  deposit(@CurrentUser() user: { id: string }, @Body() dto: DepositDto) {
    return this.wallets.deposit(user.id, dto.currency, dto.amount);
  }

  @Post('convert')
  convert(@CurrentUser() user: { id: string }, @Body() dto: ConvertDto) {
    return this.wallets.convert(user.id, dto.amountCop, dto.exchangeRate);
  }
}
