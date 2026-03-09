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

        const dividends = await prisma.dividend.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                account: { select: { name: true, type: true } },
                stock: { select: { name: true, ticker: true } },
            },
        });
        return NextResponse.json(dividends);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch dividends' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const dividend = await prisma.dividend.create({
            data: {
                accountId: body.accountId,
                stockId: body.stockId,
                amount: body.amount,
                amountOriginal: body.amountOriginal || 0,
                currency: body.currency || 'KRW',
                exchangeRate: body.exchangeRate || 1,
                taxAmount: body.taxAmount || 0,
                date: new Date(body.date),
            },
        });
        return NextResponse.json(dividend, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create dividend' }, { status: 500 });
    }
}
