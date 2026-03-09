import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Fetch all accounts
        const accounts = await prisma.account.findMany({
            orderBy: { createdAt: 'asc' },
        });

        // 2. Get latest snapshot per account
        const latestSnapshots = await Promise.all(
            accounts.map(async (account) => {
                const snapshot = await prisma.portfolioSnapshot.findFirst({
                    where: { accountId: account.id },
                    orderBy: { date: 'desc' },
                });
                return {
                    accountId: account.id,
                    accountName: account.name,
                    accountType: account.type,
                    snapshot,
                };
            })
        );

        // 3. Calculate portfolio summary
        let totalInvested = 0;
        let totalValue = 0;
        let totalDividend = 0;

        const accountWeights = latestSnapshots
            .filter((s) => s.snapshot)
            .map((s) => {
                totalInvested += s.snapshot!.totalInvested;
                totalValue += s.snapshot!.totalValue;
                totalDividend += s.snapshot!.totalDividend;
                return {
                    name: s.accountName,
                    type: s.accountType,
                    value: s.snapshot!.totalValue,
                    invested: s.snapshot!.totalInvested,
                    returnRate: s.snapshot!.returnRate,
                };
            });

        // calculate weights
        accountWeights.forEach((a) => {
            (a as Record<string, unknown>).weight = totalValue > 0 ? (a.value / totalValue) * 100 : 0;
        });

        const totalReturn = totalInvested > 0
            ? ((totalValue - totalInvested) / totalInvested) * 100
            : 0;

        // 4. All dividends for trend
        const allDividends = await prisma.dividend.findMany({
            orderBy: { date: 'asc' },
            include: { account: { select: { name: true } } },
        });

        // Monthly dividends
        const monthlyDividendMap: Record<string, number> = {};
        allDividends.forEach((d) => {
            const key = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}`;
            monthlyDividendMap[key] = (monthlyDividendMap[key] || 0) + d.amount;
        });
        const monthlyDividends = Object.entries(monthlyDividendMap)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Yearly dividends
        const yearlyDividendMap: Record<string, number> = {};
        allDividends.forEach((d) => {
            const year = d.date.getFullYear().toString();
            yearlyDividendMap[year] = (yearlyDividendMap[year] || 0) + d.amount;
        });
        const yearlyDividends = Object.entries(yearlyDividendMap)
            .map(([year, amount]) => ({ year, amount }))
            .sort((a, b) => a.year.localeCompare(b.year));

        // 5. Asset trend from snapshots
        const allSnapshots = await prisma.portfolioSnapshot.findMany({
            orderBy: { date: 'asc' },
            include: { account: { select: { name: true } } },
        });

        const assetTrendMap: Record<string, { date: string; totalInvested: number; totalValue: number }> = {};
        allSnapshots.forEach((s) => {
            const dateKey = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}`;
            if (!assetTrendMap[dateKey]) {
                assetTrendMap[dateKey] = { date: dateKey, totalInvested: 0, totalValue: 0 };
            }
            assetTrendMap[dateKey].totalInvested += s.totalInvested;
            assetTrendMap[dateKey].totalValue += s.totalValue;
        });
        const assetTrend = Object.values(assetTrendMap).sort((a, b) => a.date.localeCompare(b.date));

        // 6. Account-level return rate trend
        const accountReturnTrend: Record<string, Array<{ date: string; returnRate: number }>> = {};
        allSnapshots.forEach((s) => {
            const name = s.account.name;
            const dateKey = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}`;
            if (!accountReturnTrend[name]) accountReturnTrend[name] = [];
            accountReturnTrend[name].push({ date: dateKey, returnRate: s.returnRate });
        });

        // 7. Monthly dividend + return rate combined (for ComposedChart)
        const monthlyCombo = assetTrend.map((a) => {
            const returnRate = a.totalInvested > 0
                ? ((a.totalValue - a.totalInvested) / a.totalInvested) * 100
                : 0;
            return {
                month: a.date,
                invested: a.totalInvested,
                value: a.totalValue,
                dividend: monthlyDividendMap[a.date] || 0,
                returnRate: parseFloat(returnRate.toFixed(2)),
            };
        });

        return NextResponse.json({
            summary: {
                totalInvested,
                totalValue,
                totalDividend,
                totalReturn: parseFloat(totalReturn.toFixed(2)),
                unrealizedGain: totalValue - totalInvested,
                accountCount: accounts.length,
            },
            accountWeights,
            assetTrend,
            monthlyDividends,
            yearlyDividends,
            accountReturnTrend,
            monthlyCombo,
        });
    } catch (error) {
        console.error('Stats API error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
