import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                _count: { select: { transactions: true, dividends: true, snapshots: true } },
            },
        });
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const account = await prisma.account.create({
            data: {
                name: body.name,
                type: body.type,
                broker: body.broker || '',
                description: body.description || '',
            },
        });
        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
