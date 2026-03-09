'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { formatCompactKRW, formatPercent, getReturnColorClass, formatKRW } from '@/lib/format';
import { CHART_COLORS, CHART_SEMANTIC } from '@/lib/constants';

interface Stats {
    summary: {
        totalInvested: number;
        totalValue: number;
        totalReturn: number;
        unrealizedGain: number;
    };
    accountWeights: Array<{
        name: string;
        type: string;
        value: number;
        invested: number;
        returnRate: number;
    }>;
    assetTrend: Array<{
        date: string;
        totalInvested: number;
        totalValue: number;
    }>;
    monthlyCombo: Array<{
        month: string;
        invested: number;
        value: number;
        returnRate: number;
    }>;
    accountReturnTrend: Record<string, Array<{ date: string; returnRate: number }>>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey?: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
        <div className="custom-tooltip">
            <div className="label">{label}</div>
            {payload.map((entry, i) => (
                <div key={i} className="item">
                    <span className="dot" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}: {
                        entry.dataKey?.includes('Rate') || entry.name.includes('률')
                            ? formatPercent(entry.value)
                            : formatCompactKRW(entry.value)
                    }</span>
                </div>
            ))}
        </div>
    );
};

export default function PerformancePage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(r => r.json())
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 size={40} className="loading-spinner" />
                <p>데이터를 불러오는 중...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="empty-state">
                <TrendingUp size={48} />
                <h3>데이터가 없습니다</h3>
            </div>
        );
    }

    const { summary, accountWeights, assetTrend, monthlyCombo, accountReturnTrend } = stats;

    // Build return rate trend data
    const returnTrendData: Array<Record<string, string | number>> = [];
    const allDates = new Set<string>();
    Object.values(accountReturnTrend || {}).forEach(entries =>
        entries.forEach(e => allDates.add(e.date))
    );
    const sortedDates = Array.from(allDates).sort();
    sortedDates.forEach(date => {
        const point: Record<string, string | number> = { date };
        Object.entries(accountReturnTrend || {}).forEach(([name, entries]) => {
            const entry = entries.find(e => e.date === date);
            if (entry) point[name] = entry.returnRate;
        });
        returnTrendData.push(point);
    });
    const accountNames = Object.keys(accountReturnTrend || {});

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">수익률 분석</h1>
                    <p className="page-subtitle">포트폴리오 성과 분석 및 추이</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid-4">
                <div className="stat-card">
                    <div className="stat-label">총 투자원금</div>
                    <div className="stat-value">{formatCompactKRW(summary.totalInvested)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">현재 평가액</div>
                    <div className="stat-value">{formatCompactKRW(summary.totalValue)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">평가손익</div>
                    <div className={`stat-value ${getReturnColorClass(summary.unrealizedGain)}`}>
                        {formatCompactKRW(summary.unrealizedGain)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">총 수익률</div>
                    <div className={`stat-value ${getReturnColorClass(summary.totalReturn)}`}>
                        {formatPercent(summary.totalReturn)}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid-2 section-gap">
                {/* Asset Growth Area */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">자산 변동 추이</span>
                    </div>
                    {assetTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={assetTrend}>
                                <defs>
                                    <linearGradient id="perfInvGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={CHART_SEMANTIC.invested} stopOpacity={0.25} />
                                        <stop offset="100%" stopColor={CHART_SEMANTIC.invested} stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="perfValGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={CHART_SEMANTIC.marketValue} stopOpacity={0.25} />
                                        <stop offset="100%" stopColor={CHART_SEMANTIC.marketValue} stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fill: '#5a6478', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="totalInvested" name="투자원금" stroke={CHART_SEMANTIC.invested} fill="url(#perfInvGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="totalValue" name="평가액" stroke={CHART_SEMANTIC.marketValue} fill="url(#perfValGrad)" strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>

                {/* Account Return Trend */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">계좌별 수익률 추이</span>
                    </div>
                    {returnTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={returnTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fill: '#5a6478', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                                <Tooltip content={<CustomTooltip />} />
                                {accountNames.map((name, i) => (
                                    <Line key={name} type="monotone" dataKey={name} name={name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2.5} dot={false} />
                                ))}
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>
            </div>

            {/* Account Performance Table */}
            <div className="section-gap">
                <div className="table-container">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-primary)' }}>
                        <span className="card-title">계좌별 수익 현황</span>
                    </div>
                    {accountWeights.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>계좌</th>
                                    <th>투자원금</th>
                                    <th>평가액</th>
                                    <th>평가손익</th>
                                    <th>수익률</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accountWeights.map((acc, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{acc.name}</td>
                                        <td>{formatKRW(acc.invested)}</td>
                                        <td>{formatKRW(acc.value)}</td>
                                        <td className={getReturnColorClass(acc.value - acc.invested)}>
                                            {formatKRW(acc.value - acc.invested)}
                                        </td>
                                        <td className={getReturnColorClass(acc.returnRate)}>
                                            {formatPercent(acc.returnRate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state"><p>계좌 데이터가 없습니다.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
}
