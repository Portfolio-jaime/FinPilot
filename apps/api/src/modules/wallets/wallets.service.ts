import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  async getWallets(userId: string) {
    const wallets = await this.prisma.wallet.findMany({ where: { userId } });
    return wallets.map(w => ({ ...w, balance: Number(w.balance) }));
  }

  async deposit(userId: string, currency: string, amount: number) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId_currency: { userId, currency } },
      update: { balance: { increment: new Decimal(amount) } },
      create: { userId, currency, balance: new Decimal(amount) },
    });
    await this.prisma.transaction.create({
      data: { type: 'DEPOSIT', amount: new Decimal(amount), currency, walletId: wallet.id },
    });
    return { ...wallet, balance: Number(wallet.balance) };
  }

  async convert(userId: string, amountCop: number, exchangeRate: number) {
    const grossUsd = amountCop / exchangeRate;
    const costUsd = grossUsd * 0.005;
    const netUsd = grossUsd - costUsd;

    const [copWallet, usdWallet] = await Promise.all([
      this.prisma.wallet.upsert({
        where: { userId_currency: { userId, currency: 'COP' } },
        update: { balance: { decrement: new Decimal(amountCop) } },
        create: { userId, currency: 'COP', balance: new Decimal(0) },
      }),
      this.prisma.wallet.upsert({
        where: { userId_currency: { userId, currency: 'USD' } },
        update: { balance: { increment: new Decimal(netUsd) } },
        create: { userId, currency: 'USD', balance: new Decimal(netUsd) },
      }),
    ]);

    await this.prisma.transaction.createMany({
      data: [
        { type: 'CONVERT', amount: new Decimal(amountCop), currency: 'COP', exchangeRate: new Decimal(exchangeRate), walletId: copWallet.id },
        { type: 'CONVERT', amount: new Decimal(netUsd), currency: 'USD', exchangeRate: new Decimal(exchangeRate), walletId: usdWallet.id },
      ],
    });
    return { copDeducted: amountCop, usdReceived: Math.round(netUsd * 100) / 100, exchangeRate };
  }
}
