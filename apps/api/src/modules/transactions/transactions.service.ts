import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { wallet: { userId } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.transaction.count({ where: { wallet: { userId } } }),
    ]);
    return {
      data: data.map(t => ({
        ...t,
        amount: Number(t.amount),
        exchangeRate: t.exchangeRate ? Number(t.exchangeRate) : undefined,
      })),
      total,
      page,
      limit: take,
    };
  }
}
