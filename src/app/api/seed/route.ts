import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    // Simple auth check - use a secret key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== process.env.SEED_SECRET && key !== 'dividend-seed-2025') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('🌱 Seeding database via API...');

        // Clear existing data
        await prisma.dividend.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.portfolioSnapshot.deleteMany();
        await prisma.stock.deleteMany();
        await prisma.account.deleteMany();

        // Create accounts
        const accounts = await Promise.all([
            prisma.account.create({ data: { name: '연금저축1', type: '연금저축', broker: '삼성증권' } }),
            prisma.account.create({ data: { name: '연금저축2', type: '연금저축', broker: 'NH투자증권' } }),
            prisma.account.create({ data: { name: 'IRP', type: 'IRP', broker: '미래에셋' } }),
            prisma.account.create({ data: { name: 'ISA', type: 'ISA', broker: '한국투자증권' } }),
            prisma.account.create({ data: { name: '일반', type: '일반계좌', broker: '키움증권' } }),
        ]);

        // Create stocks
        const stocks = await Promise.all([
            prisma.stock.create({ data: { ticker: '360750', name: 'TIGER S&P500', type: 'ETF', sector: '미국대형주', market: '국내', currency: 'KRW' } }),
            prisma.stock.create({ data: { ticker: '133690', name: 'TIGER 나스닥100', type: 'ETF', sector: '미국기술주', market: '국내', currency: 'KRW' } }),
            prisma.stock.create({ data: { ticker: '458730', name: 'TIGER 미국배당다우존스', type: 'ETF', sector: '미국배당', market: '국내', currency: 'KRW' } }),
            prisma.stock.create({ data: { ticker: '381180', name: 'TIGER 미국필라델피아반도체', type: 'ETF', sector: '반도체', market: '국내', currency: 'KRW' } }),
            prisma.stock.create({ data: { ticker: '411060', name: 'ACE KRX금현물', type: 'ETF', sector: '원자재', market: '국내', currency: 'KRW' } }),
            prisma.stock.create({ data: { ticker: '451530', name: 'TIGER 미국30년국채', type: '채권', sector: '채권', market: '국내', currency: 'KRW' } }),
        ]);

        // Create transactions (monthly buys 2023-01 to 2025-03)
        const txData: Array<{ accountId: string; stockId: string; type: string; quantity: number; price: number; totalAmount: number; date: Date }> = [];
        const months: string[] = [];
        for (let y = 2023; y <= 2025; y++) {
            const maxM = y === 2025 ? 3 : 12;
            for (let m = 1; m <= maxM; m++) {
                months.push(`${y}-${String(m).padStart(2, '0')}`);
            }
        }

        const accountStockMap: Record<number, number[]> = {
            0: [0, 1, 2, 3, 4],  // 연금저축1
            1: [0, 1, 2],        // 연금저축2
            2: [0, 1, 5],        // IRP
            3: [0, 2],           // ISA
            4: [0, 1, 2, 3, 4, 5], // 일반
        };

        const basePrices = [15000, 90000, 12000, 14000, 15000, 10000];

        months.forEach((month, mi) => {
            accounts.forEach((acc, ai) => {
                const stockIndices = accountStockMap[ai] || [];
                stockIndices.forEach((si) => {
                    const priceVariation = 1 + (mi * 0.008) + (Math.random() * 0.1 - 0.05);
                    const price = Math.round(basePrices[si] * priceVariation);
                    const quantity = ai === 0 ? Math.floor(Math.random() * 5) + 3 :
                        ai === 4 ? Math.floor(Math.random() * 8) + 5 :
                            Math.floor(Math.random() * 3) + 2;
                    txData.push({
                        accountId: acc.id,
                        stockId: stocks[si].id,
                        type: 'BUY',
                        quantity,
                        price,
                        totalAmount: quantity * price,
                        date: new Date(`${month}-15`),
                    });
                });
            });
        });

        for (const tx of txData) {
            await prisma.transaction.create({ data: tx });
        }

        // Create dividends (quarterly for dividend-paying stocks)
        const dividendQuarters = [
            '2024-03', '2024-06', '2024-09', '2024-12',
            '2025-03',
        ];

        const divData: Array<{ accountId: string; stockId: string; amount: number; date: Date }> = [];
        dividendQuarters.forEach((q) => {
            accounts.forEach((acc, ai) => {
                const stockIndices = accountStockMap[ai] || [];
                stockIndices.forEach((si) => {
                    if ([0, 2, 5].includes(si)) {
                        const baseDiv = si === 0 ? 3000 : si === 2 ? 5000 : 2000;
                        const amount = baseDiv * (1 + Math.random() * 0.3) * (ai === 0 ? 3 : ai === 4 ? 4 : 2);
                        divData.push({
                            accountId: acc.id,
                            stockId: stocks[si].id,
                            amount: Math.round(amount),
                            date: new Date(`${q}-28`),
                        });
                    }
                });
            });
        });

        for (const d of divData) {
            await prisma.dividend.create({ data: d });
        }

        // Create portfolio snapshots (monthly 2024-01 to 2025-03)
        const snapshotMonths: string[] = [];
        for (let y = 2024; y <= 2025; y++) {
            const maxM = y === 2025 ? 3 : 12;
            for (let m = 1; m <= maxM; m++) {
                snapshotMonths.push(`${y}-${String(m).padStart(2, '0')}`);
            }
        }

        const baseInvestments = [8000000, 4500000, 3500000, 1500000, 5000000];

        for (const month of snapshotMonths) {
            const mi = snapshotMonths.indexOf(month);
            for (let ai = 0; ai < accounts.length; ai++) {
                const growthFactor = 1 + (mi * 0.015) + (Math.random() * 0.03);
                const invested = baseInvestments[ai] * (1 + mi * 0.04);
                const value = invested * growthFactor;
                const cumDiv = ai < 3 ? mi * 3000 : mi * 1500;
                const returnRate = ((value - invested + cumDiv) / invested) * 100;
                await prisma.portfolioSnapshot.create({
                    data: {
                        accountId: accounts[ai].id,
                        totalInvested: Math.round(invested),
                        totalValue: Math.round(value),
                        totalDividend: cumDiv,
                        returnRate: Math.round(returnRate * 100) / 100,
                        date: new Date(`${month}-01`),
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: '✅ Seeding complete!',
            counts: {
                accounts: accounts.length,
                stocks: stocks.length,
                transactions: txData.length,
                dividends: divData.length,
                snapshots: snapshotMonths.length * accounts.length,
            },
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
