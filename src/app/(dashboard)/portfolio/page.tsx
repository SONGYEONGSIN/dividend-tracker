'use client';

import { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Loader2, Briefcase } from 'lucide-react';
import { formatKRW, formatPercent, getReturnColorClass, formatCompactKRW } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';

interface Account {
    id: string;
    name: string;
    type: string;
}

interface Stats {
    accountWeights: Array<{
        name: string;
        type: string;
        value: number;
        invested: number;
        returnRate: number;
        weight: number;
    }>;
    accountReturnTrend: Record<string, Array<{ date: string; returnRate: number }>>;
}

interface Transaction {
    id: string;
    type: string;
    quantity: number;
    price: number;
    totalAmount: number;
    date: string;
    stock: { name: string; ticker: string };
    account: { name: string };
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
        <div className="custom-tooltip">
            <div className="label">{label}</div>
            {payload.map((entry, i) => (
                <div key={i} className="item">
                    <span className="dot" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}: {formatPercent(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

export default function PortfolioPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/accounts').then(r => r.json()),
            fetch('/api/stats').then(r => r.json()),
            fetch('/api/transactions').then(r => r.json()),
        ])
            .then(([accs, st, txs]) => {
                setAccounts(accs);
                setStats(st);
                setTransactions(txs);
            })
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

    const filteredTx = selectedAccount === 'all'
        ? transactions
        : transactions.filter(t => t.account.name === selectedAccount);

    // Build return trend data for line chart
    const returnTrendData: Array<Record<string, string | number>> = [];
    if (stats?.accountReturnTrend) {
        const allDates = new Set<string>();
        Object.values(stats.accountReturnTrend).forEach(entries =>
            entries.forEach(e => allDates.add(e.date))
        );
        const sortedDates = Array.from(allDates).sort();
        sortedDates.forEach(date => {
            const point: Record<string, string | number> = { date };
            Object.entries(stats.accountReturnTrend).forEach(([name, entries]) => {
                const entry = entries.find(e => e.date === date);
                if (entry) point[name] = entry.returnRate;
            });
            returnTrendData.push(point);
        });
    }

    const accountNames = stats ? Object.keys(stats.accountReturnTrend || {}) : [];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">포트폴리오</h1>
                    <p className="page-subtitle">계좌별 자산 현황 및 수익률 추이</p>
                </div>
            </div>

            {/* Account Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${selectedAccount === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedAccount('all')}
                >
                    전체
                </button>
                {accounts.map(acc => (
                    <button
                        key={acc.id}
                        className={`tab ${selectedAccount === acc.name ? 'active' : ''}`}
                        onClick={() => setSelectedAccount(acc.name)}
                    >
                        {acc.name}
                    </button>
                ))}
            </div>

            {/* Charts */}
            <div className="grid-2">
                {/* Account allocation */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">종목별 비중 (리밸런싱)</span>
                    </div>
                    {stats?.accountWeights && stats.accountWeights.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={stats.accountWeights}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={105}
                                    paddingAngle={3}
                                    label={((props: Record<string, unknown>) => `${props.name} ${(props.weight as number)?.toFixed(1)}%`) as unknown as undefined}
                                    labelLine={{ stroke: '#5a6478' }}
                                >
                                    {stats.accountWeights.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>

                {/* Return rate trend per account */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">계좌별 누적수익률 추이</span>
                    </div>
                    {returnTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={returnTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" tick={{ fill: '#5a6478', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                                <Tooltip content={<CustomTooltip />} />
                                {accountNames.map((name, i) => (
                                    <Line
                                        key={name}
                                        type="monotone"
                                        dataKey={name}
                                        name={name}
                                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                        strokeWidth={2.5}
                                        dot={false}
                                    />
                                ))}
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a6' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>
            </div>

            {/* Transaction Table */}
            <div className="section-gap">
                <div className="table-container">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-primary)' }}>
                        <span className="card-title">거래 내역</span>
                    </div>
                    {filteredTx.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>계좌</th>
                                    <th>종목</th>
                                    <th>구분</th>
                                    <th>수량</th>
                                    <th>단가</th>
                                    <th>총액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTx.slice(0, 50).map((tx) => (
                                    <tr key={tx.id}>
                                        <td>{new Date(tx.date).toLocaleDateString('ko-KR')}</td>
                                        <td>{tx.account.name}</td>
                                        <td>{tx.stock.name}</td>
                                        <td>
                                            <span className={`badge ${tx.type === 'BUY' ? 'badge-blue' : 'badge-red'}`}>
                                                {tx.type === 'BUY' ? '매수' : '매도'}
                                            </span>
                                        </td>
                                        <td>{tx.quantity.toLocaleString()}</td>
                                        <td>{formatKRW(tx.price)}</td>
                                        <td>{formatKRW(tx.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <Briefcase size={40} />
                            <h3>거래 내역이 없습니다</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
