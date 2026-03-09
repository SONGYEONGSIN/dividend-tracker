import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');
        const stockId = searchParams.get('stockId');
        const year = searchParams.get('year');

        const where: Record<string, unknown> = {};
        if (accountId) where.accountId = accountId;
        if (stockId) where.stockId = stockId;
        if (year) {
            where.date = {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            };
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                account: { select: { name: true, type: true } },
                stock: { select: { name: true, ticker: true } },
            },
        });
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const transaction = await prisma.transaction.create({
            data: {
                accountId: body.accountId,
                stockId: body.stockId,
                type: body.type,
                quantity: body.quantity,
                price: body.price,
                totalAmount: body.totalAmount,
                exchangeRate: body.exchangeRate || 1,
                fee: body.fee || 0,
                date: new Date(body.date),
            },
        });
        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}
