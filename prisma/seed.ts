import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    await prisma.dividend.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.portfolioSnapshot.deleteMany({});
    await prisma.stock.deleteMany({});
    await prisma.account.deleteMany({});

    // ============ ACCOUNTS ============
    console.log('📁 Creating accounts...');
    const pension1 = await prisma.account.create({
        data: { name: '연금저축1', type: 'PENSION', broker: '삼성증권', description: '연금저축 1호 계좌' },
    });
    const pension2 = await prisma.account.create({
        data: { name: '연금저축2', type: 'PENSION', broker: 'NH투자증권', description: '연금저축 2호 계좌' },
    });
    const irp = await prisma.account.create({
        data: { name: 'IRP', type: 'IRP', broker: '미래에셋', description: '개인형 퇴직연금' },
    });
    const isa = await prisma.account.create({
        data: { name: 'ISA', type: 'ISA', broker: '한국투자증권', description: '개인종합자산관리' },
    });
    const general = await prisma.account.create({
        data: { name: '일반', type: 'GENERAL', broker: '키움증권', description: '일반 투자 계좌' },
    });

    // ============ STOCKS ============
    console.log('📈 Creating stocks...');
    const sp500 = await prisma.stock.create({
        data: { ticker: '360750', name: 'TIGER S&P500', type: 'ETF', sector: '미국 대형주', market: 'KR', currency: 'KRW' },
    });
    const nasdaq = await prisma.stock.create({
        data: { ticker: '133690', name: 'TIGER 나스닥100', type: 'ETF', sector: '미국 기술주', market: 'KR', currency: 'KRW' },
    });
    const dividendETF = await prisma.stock.create({
        data: { ticker: '329750', name: 'TIGER 미국배당다우존스', type: 'ETF', sector: '배당주', market: 'KR', currency: 'KRW' },
    });
    const reit = await prisma.stock.create({
        data: { ticker: '352560', name: 'TIGER 미국필라델피아반도체', type: 'ETF', sector: '반도체', market: 'KR', currency: 'KRW' },
    });
    const gold = await prisma.stock.create({
        data: { ticker: '411060', name: 'ACE KRX금현물', type: 'ETF', sector: '원자재', market: 'KR', currency: 'KRW' },
    });
    const bond = await prisma.stock.create({
        data: { ticker: '451530', name: 'TIGER 미국30년국채', type: 'BOND', sector: '채권', market: 'KR', currency: 'KRW' },
    });

    // ============ TRANSACTIONS ============
    console.log('💰 Creating transactions...');
    const stocks = [sp500, nasdaq, dividendETF, reit, gold, bond];
    const accounts = [pension1, pension2, irp, isa, general];

    // Distribute stocks across accounts
    const accountStockMap = [
        { account: pension1, stocks: [sp500, nasdaq, dividendETF, reit, gold] },
        { account: pension2, stocks: [sp500, nasdaq, dividendETF] },
        { account: irp, stocks: [sp500, dividendETF, bond] },
        { account: isa, stocks: [sp500, nasdaq] },
        { account: general, stocks: [sp500, nasdaq, reit, gold, bond, dividendETF] },
    ];

    // Generate realistic buy transactions over 2023-2025
    for (const mapping of accountStockMap) {
        for (const stock of mapping.stocks) {
            // Monthly buys from 2023-01 to 2025-03
            const startYear = 2023;
            const endYear = 2025;
            const endMonth = 3;

            for (let year = startYear; year <= endYear; year++) {
                const maxMonth = year === endYear ? endMonth : 12;
                for (let month = 1; month <= maxMonth; month++) {
                    // Base price varies by stock
                    let basePrice = 15000;
                    if (stock.ticker === '360750') basePrice = 17000 + (year - 2023) * 2000 + month * 100; // S&P500 trending up
                    if (stock.ticker === '133690') basePrice = 90000 + (year - 2023) * 15000 + month * 500; // Nasdaq
                    if (stock.ticker === '329750') basePrice = 12000 + (year - 2023) * 1000 + month * 50; // Dividend ETF
                    if (stock.ticker === '352560') basePrice = 13000 + (year - 2023) * 3000 + month * 200; // Semiconductor
                    if (stock.ticker === '411060') basePrice = 14000 + (year - 2023) * 2000 + month * 150; // Gold
                    if (stock.ticker === '451530') basePrice = 9500 + (year - 2023) * 500 + month * 30; // Bond

                    // Random variation
                    const price = basePrice + Math.floor(Math.random() * 1000 - 500);
                    const quantity = Math.floor(Math.random() * 5) + 1;
                    const totalAmount = price * quantity;

                    await prisma.transaction.create({
                        data: {
                            accountId: mapping.account.id,
                            stockId: stock.id,
                            type: 'BUY',
                            quantity,
                            price,
                            totalAmount,
                            date: new Date(`${year}-${String(month).padStart(2, '0')}-15`),
                        },
                    });
                }
            }
        }
    }

    // ============ DIVIDENDS ============
    console.log('💵 Creating dividends...');
    // Dividends for dividend-yielding stocks (quarterly)
    const dividendStocks = [sp500, dividendETF, bond];
    for (const mapping of accountStockMap) {
        for (const stock of dividendStocks) {
            if (!mapping.stocks.includes(stock)) continue;

            for (let year = 2024; year <= 2025; year++) {
                const months = year === 2025 ? [3] : [3, 6, 9, 12];
                for (const month of months) {
                    let baseDividend = 5000;
                    if (stock.ticker === '360750') baseDividend = 8000 + Math.floor(Math.random() * 3000);
                    if (stock.ticker === '329750') baseDividend = 15000 + Math.floor(Math.random() * 5000);
                    if (stock.ticker === '451530') baseDividend = 6000 + Math.floor(Math.random() * 2000);

                    // Scale by account size
                    let scale = 1;
                    if (mapping.account.id === pension1.id) scale = 3;
                    if (mapping.account.id === pension2.id) scale = 1.5;
                    if (mapping.account.id === irp.id) scale = 0.8;
                    if (mapping.account.id === general.id) scale = 2;

                    const amount = Math.round(baseDividend * scale);
                    const taxAmount = Math.round(amount * 0.154);

                    await prisma.dividend.create({
                        data: {
                            accountId: mapping.account.id,
                            stockId: stock.id,
                            amount,
                            taxAmount,
                            date: new Date(`${year}-${String(month).padStart(2, '0')}-25`),
                        },
                    });
                }
            }
        }
    }

    // ============ PORTFOLIO SNAPSHOTS ============
    console.log('📊 Creating portfolio snapshots...');

    // Monthly snapshots for each account (2024-01 to 2025-03)
    const snapshotData: Record<string, Array<{ month: string; invested: number; value: number; dividend: number; returnRate: number }>> = {
        [pension1.id]: [],
        [pension2.id]: [],
        [irp.id]: [],
        [isa.id]: [],
        [general.id]: [],
    };

    // Simulate growth patterns based on image data
    // Pension1: largest account, ~84M total
    for (let i = 0; i < 15; i++) {
        const month = i < 12 ? i + 1 : i - 11;
        const year = i < 12 ? 2024 : 2025;
        const baseInvested = 65000000 + i * 1200000;
        const growthRate = 1 + (0.05 + i * 0.015 + Math.random() * 0.03);
        snapshotData[pension1.id].push({
            month: `${year}-${String(month).padStart(2, '0')}`,
            invested: baseInvested,
            value: Math.round(baseInvested * growthRate),
            dividend: 15000 * (i + 1),
            returnRate: parseFloat(((growthRate - 1) * 100).toFixed(2)),
        });
    }

    // Pension2: second account, ~24M
    for (let i = 0; i < 15; i++) {
        const month = i < 12 ? i + 1 : i - 11;
        const year = i < 12 ? 2024 : 2025;
        const baseInvested = 18000000 + i * 400000;
        const growthRate = 1 + (0.03 + i * 0.012 + Math.random() * 0.025);
        snapshotData[pension2.id].push({
            month: `${year}-${String(month).padStart(2, '0')}`,
            invested: baseInvested,
            value: Math.round(baseInvested * growthRate),
            dividend: 8000 * (i + 1),
            returnRate: parseFloat(((growthRate - 1) * 100).toFixed(2)),
        });
    }

    // IRP: ~9M
    for (let i = 0; i < 15; i++) {
        const month = i < 12 ? i + 1 : i - 11;
        const year = i < 12 ? 2024 : 2025;
        const baseInvested = 7500000 + i * 200000;
        const growthRate = 1 + (0.02 + i * 0.008 + Math.random() * 0.02);
        snapshotData[irp.id].push({
            month: `${year}-${String(month).padStart(2, '0')}`,
            invested: baseInvested,
            value: Math.round(baseInvested * growthRate),
            dividend: 5000 * (i + 1),
            returnRate: parseFloat(((growthRate - 1) * 100).toFixed(2)),
        });
    }

    // ISA: smaller, ~1.3M
    for (let i = 0; i < 15; i++) {
        const month = i < 12 ? i + 1 : i - 11;
        const year = i < 12 ? 2024 : 2025;
        const baseInvested = 800000 + i * 50000;
        const growthRate = 1 + (0.01 + i * 0.005 + Math.random() * 0.015);
        snapshotData[isa.id].push({
            month: `${year}-${String(month).padStart(2, '0')}`,
            invested: baseInvested,
            value: Math.round(baseInvested * growthRate),
            dividend: 1000 * (i + 1),
            returnRate: parseFloat(((growthRate - 1) * 100).toFixed(2)),
        });
    }

    // General: ~17M
    for (let i = 0; i < 15; i++) {
        const month = i < 12 ? i + 1 : i - 11;
        const year = i < 12 ? 2024 : 2025;
        const baseInvested = 13000000 + i * 350000;
        const growthRate = 1 + (0.04 + i * 0.01 + Math.random() * 0.025);
        snapshotData[general.id].push({
            month: `${year}-${String(month).padStart(2, '0')}`,
            invested: baseInvested,
            value: Math.round(baseInvested * growthRate),
            dividend: 10000 * (i + 1),
            returnRate: parseFloat(((growthRate - 1) * 100).toFixed(2)),
        });
    }

    // Insert snapshots
    for (const [accountId, data] of Object.entries(snapshotData)) {
        for (const snap of data) {
            await prisma.portfolioSnapshot.create({
                data: {
                    accountId,
                    totalInvested: snap.invested,
                    totalValue: snap.value,
                    totalDividend: snap.dividend,
                    returnRate: snap.returnRate,
                    date: new Date(`${snap.month}-01`),
                },
            });
        }
    }

    console.log('✅ Seeding complete!');
    console.log(`  - ${accounts.length} accounts`);
    console.log(`  - ${stocks.length} stocks`);

    const txCount = await prisma.transaction.count();
    const divCount = await prisma.dividend.count();
    const snapCount = await prisma.portfolioSnapshot.count();
    console.log(`  - ${txCount} transactions`);
    console.log(`  - ${divCount} dividends`);
    console.log(`  - ${snapCount} portfolio snapshots`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
