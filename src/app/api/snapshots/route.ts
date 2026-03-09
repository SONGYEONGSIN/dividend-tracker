import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const snapshots = await prisma.portfolioSnapshot.findMany({
            orderBy: { date: 'asc' },
            include: {
                account: { select: { name: true, type: true } },
            },
        });
        return NextResponse.json(snapshots);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const snapshot = await prisma.portfolioSnapshot.create({
            data: {
                accountId: body.accountId,
                totalInvested: body.totalInvested,
                totalValue: body.totalValue,
                totalDividend: body.totalDividend || 0,
                returnRate: body.returnRate || 0,
                date: new Date(body.date),
            },
        });
        return NextResponse.json(snapshot, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
    }
}
