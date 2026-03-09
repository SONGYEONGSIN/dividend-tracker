'use client';

import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ComposedChart, Line, Legend, Cell,
} from 'recharts';
import { Loader2, Banknote, Plus, X } from 'lucide-react';
import { formatKRW, formatCompactKRW, formatPercent } from '@/lib/format';
import { CHART_COLORS, CHART_SEMANTIC } from '@/lib/constants';

interface DividendRecord {
    id: string;
    amount: number;
    amountOriginal: number;
    currency: string;
    taxAmount: number;
    date: string;
    account: { name: string; type: string };
    stock: { name: string; ticker: string };
}

interface Account { id: string; name: string; }
interface Stock { id: string; name: string; ticker: string; }

interface Stats {
    monthlyDividends: Array<{ month: string; amount: number }>;
    yearlyDividends: Array<{ year: string; amount: number }>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null;
    return (
        <div className="custom-tooltip">
            <div className="label">{label}</div>
            {payload.map((entry, i) => (
                <div key={i} className="item">
                    <span className="dot" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}: {formatCompactKRW(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

export default function DividendsPage() {
    const [dividends, setDividends] = useState<DividendRecord[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        accountId: '', stockId: '', amount: '', date: '', taxAmount: '0',
    });

    const fetchData = () => {
        Promise.all([
            fetch('/api/dividends').then(r => r.json()),
            fetch('/api/accounts').then(r => r.json()),
            fetch('/api/stocks').then(r => r.json()),
            fetch('/api/stats').then(r => r.json()),
        ])
            .then(([divs, accs, stks, st]) => {
                setDividends(divs);
                setAccounts(accs);
                setStocks(stks);
                setStats(st);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/dividends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountId: form.accountId,
                stockId: form.stockId,
                amount: parseFloat(form.amount),
                taxAmount: parseFloat(form.taxAmount),
                date: form.date,
            }),
        });
        setShowModal(false);
        setForm({ accountId: '', stockId: '', amount: '', date: '', taxAmount: '0' });
        fetchData();
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Loader2 size={40} className="loading-spinner" />
                <p>데이터를 불러오는 중...</p>
            </div>
        );
    }

    // Calc monthly dividend + cumulative
    const monthlyWithCumulative = (stats?.monthlyDividends || []).reduce((acc, item) => {
        const prevCum = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
        acc.push({ ...item, cumulative: prevCum + item.amount });
        return acc;
    }, [] as Array<{ month: string; amount: number; cumulative: number }>);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">배당관리</h1>
                    <p className="page-subtitle">배당금 수령 내역 및 추이 분석</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> 배당 등록
                </button>
            </div>

            {/* Charts */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">월별 배당금 추이</span>
                    </div>
                    {monthlyWithCumulative.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={monthlyWithCumulative}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="month" tick={{ fill: '#5a6478', fontSize: 11 }} />
                                <YAxis yAxisId="left" tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar yAxisId="left" dataKey="amount" name="월 배당금" fill={CHART_SEMANTIC.dividend} radius={[4, 4, 0, 0]} barSize={18} />
                                <Line yAxisId="right" type="monotone" dataKey="cumulative" name="누적 배당금" stroke={CHART_SEMANTIC.marketValue} strokeWidth={2.5} dot={false} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#8892a6' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state"><p>데이터 없음</p></div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">연도별 배당 총액</span>
                    </div>
                    {stats?.yearlyDividends && stats.yearlyDividends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={stats.yearlyDividends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="year" tick={{ fill: '#5a6478', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#5a6478', fontSize: 11 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="amount" name="배당금" radius={[6, 6, 0, 0]} barSize={50}>
                                    {stats.yearlyDividends.map((_, i) => (
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

            {/* Dividend Table */}
            <div className="section-gap">
                <div className="table-container">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-primary)' }}>
                        <span className="card-title">배당 수령 내역</span>
                        <span style={{ float: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            총 {dividends.length}건
                        </span>
                    </div>
                    {dividends.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>계좌</th>
                                    <th>종목</th>
                                    <th>배당금 (원)</th>
                                    <th>세금</th>
                                    <th>실수령액</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dividends.slice(0, 100).map((d) => (
                                    <tr key={d.id}>
                                        <td>{new Date(d.date).toLocaleDateString('ko-KR')}</td>
                                        <td>{d.account.name}</td>
                                        <td>{d.stock.name}</td>
                                        <td>{formatKRW(d.amount)}</td>
                                        <td>{formatKRW(d.taxAmount)}</td>
                                        <td className="gain">{formatKRW(d.amount - d.taxAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <Banknote size={40} />
                            <h3>배당 내역이 없습니다</h3>
                            <p>배당 등록 버튼을 눌러 배당금을 기록해주세요.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Dividend Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="modal-title">배당 등록</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">계좌</label>
                                <select className="form-select" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} required>
                                    <option value="">선택</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">종목</label>
                                <select className="form-select" value={form.stockId} onChange={e => setForm({ ...form, stockId: e.target.value })} required>
                                    <option value="">선택</option>
                                    {stocks.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ticker})</option>)}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">배당금 (원)</label>
                                    <input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">세금 (원)</label>
                                    <input type="number" className="form-input" value={form.taxAmount} onChange={e => setForm({ ...form, taxAmount: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">배당일</label>
                                <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                                <button type="submit" className="btn btn-primary">등록</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
