import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const stocks = await prisma.stock.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { transactions: true, dividends: true } },
            },
        });
        return NextResponse.json(stocks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const stock = await prisma.stock.create({
            data: {
                ticker: body.ticker,
                name: body.name,
                type: body.type,
                sector: body.sector || '',
                market: body.market || 'KR',
                currency: body.currency || 'KRW',
            },
        });
        return NextResponse.json(stock, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create stock' }, { status: 500 });
    }
}
