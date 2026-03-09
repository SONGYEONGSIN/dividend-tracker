'use client';

import { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
    ComposedChart, Line, Legend,
} from 'recharts';
import {
    Wallet, TrendingUp, Banknote, PiggyBank, Loader2,
} from 'lucide-react';
import { formatCompactKRW, formatPercent, getReturnColorClass } from '@/lib/format';
import { CHART_COLORS, CHART_SEMANTIC } from '@/lib/constants';

interface Stats {
    summary: {
        totalInvested: number;
        totalValue: number;
        totalDividend: number;
        totalReturn: number;
        unrealizedGain: number;
        accountCount: number;
    };
    accountWeights: Array<{
        name: string;
        type: string;
        value: number;
        invested: number;
        returnRate: number;
        weight: number;
    }>;
    assetTrend: Array<{
        date: string;
        totalInvested: number;
        totalValue: number;
    }>;
    monthlyDividends: Array<{ month: string; amount: number }>;
    yearlyDividends: Array<{ year: string; amount: number }>;
    monthlyCombo: Array<{
        month: string;
        invested: number;
        value: number;
        dividend: number;
        returnRate: number;
    }>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
        <div className="custom-tooltip">
            <div className="label">{label}</div>
            {payload.map((entry, i) => (
                <div key={i} className="item">
                    <span className="dot" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}: {typeof entry.value === 'number' && entry.name.includes('률') ? formatPercent(entry.value) : formatCompactKRW(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then((r) => r.json())
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

    if (!stats || !stats.summary) {
        return (
            <div className="empty-state">
                <Wallet size={48} />
                <h3>데이터가 없습니다</h3>
                <p>설정에서 계좌와 종목을 추가한 후 데이터를 입력해주세요.</p>
            </div>
        );
    }

    const { summary, accountWeights, assetTrend, monthlyDividends, yearlyDividends, monthlyCombo } = stats;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">대시보드</h1>
                    <p className="page-subtitle">배당 투자 포트폴리오 종합 현황</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid-4">
                <div className="stat-card">
                    <div className="stat-label">
                        <Wallet size={16} /> 총 투자금
                    </div>
                    <div className="stat-value">{formatCompactKRW(summary.totalInvested)}</div>
                    <div className="stat-change neutral">{summary.accountCount}개 계좌</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">
                        <TrendingUp size={16} /> 총 평가액
                    </div>
                    <div className="stat-value">{formatCompactKRW(summary.totalValue)}</div>
                    <div className={`stat-change ${getReturnColorClass(summary.unrealizedGain)}`}>
                        {formatCompactKRW(summary.unrealizedGain)} ({formatPercent(summary.totalReturn)})
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">
                        <Banknote size={16} /> 누적 배당금
                    </div>
                    <div className="stat-value">{formatCompactKRW(summary.totalDividend)}</div>
                    <div className="stat-change neutral">
                        배당 수익률 {summary.totalInvested > 0 ? formatPercent((summary.totalDividend / summary.totalInvested) * 100) : '0%'}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">
                        <PiggyBank size={16} /> 총 수익률
                    </div>
                    <div className={`stat-value ${getReturnColorClass(summary.totalReturn)}`}>
                        {formatPercent(summary.totalReturn)}
                    </div>
                    <div className={`stat-change ${getReturnColorClass(summary.unrealizedGain)}`}>
                        평가손익 {formatCompactKRW(summary.unrealizedGain)}
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid-2 section-gap">
                {/* Account Allocation Donut */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">계좌별 자산 비중</span>
                    </div>
                    {accountWeights.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={accountWeights}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={3}
                                    label={((props: Record<string, unknown>) => `${props.name} ${(props.weight as number)?.toFixed(1)}%`) as unknown as undefined}
                                    labelLine={{ stroke: '#5a6478' }}
                                >
                                    {accountWeights.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>

                {/* Asset Trend Area Chart */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">월별 자산 추이</span>
                    </div>
                    {assetTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={assetTrend}>
                                <defs>
                                    <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={CHART_SEMANTIC.invested} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={CHART_SEMANTIC.invested} stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={CHART_SEMANTIC.marketValue} stopOpacity={0.3} />
                                        <stop offset="100%" stopColor={CHART_SEMANTIC.marketValue} stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fill: '#5a6478', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="totalInvested" name="투자원금" stroke={CHART_SEMANTIC.invested} fill="url(#investedGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="totalValue" name="평가액" stroke={CHART_SEMANTIC.marketValue} fill="url(#valueGrad)" strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid-2 section-gap">
                {/* Monthly Dividend + Return ComposedChart */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">월별 배당금 & 수익률 추이</span>
                    </div>
                    {monthlyCombo.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={monthlyCombo}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#5a6478', fontSize: 11 }} />
                                <YAxis yAxisId="left" tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar yAxisId="left" dataKey="dividend" name="배당금" fill={CHART_SEMANTIC.dividend} radius={[4, 4, 0, 0]} barSize={20} />
                                <Line yAxisId="right" type="monotone" dataKey="returnRate" name="수익률" stroke={CHART_SEMANTIC.marketValue} strokeWidth={2.5} dot={false} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a6' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>

                {/* Yearly Dividend Bar Chart */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">연도별 배당 성장</span>
                    </div>
                    {yearlyDividends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={yearlyDividends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="year" tick={{ fill: '#5a6478', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="amount" name="배당금" fill={CHART_SEMANTIC.dividend} radius={[6, 6, 0, 0]} barSize={40}>
                                    {yearlyDividends.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>
            </div>
        </div>
    );
}
