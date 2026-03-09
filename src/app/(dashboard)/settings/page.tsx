'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X, Settings as SettingsIcon } from 'lucide-react';
import { ACCOUNT_TYPES, STOCK_TYPES, MARKETS } from '@/lib/constants';
import { getAccountTypeLabel, getStockTypeLabel } from '@/lib/format';

interface Account {
    id: string;
    name: string;
    type: string;
    broker: string;
    description: string;
    _count: { transactions: number; dividends: number; snapshots: number };
}

interface Stock {
    id: string;
    ticker: string;
    name: string;
    type: string;
    sector: string;
    market: string;
    currency: string;
    _count: { transactions: number; dividends: number };
}

export default function SettingsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [accountForm, setAccountForm] = useState({ name: '', type: 'PENSION', broker: '', description: '' });
    const [stockForm, setStockForm] = useState({ ticker: '', name: '', type: 'ETF', sector: '', market: 'KR', currency: 'KRW' });

    const fetchData = () => {
        Promise.all([
            fetch('/api/accounts').then(r => r.json()),
            fetch('/api/stocks').then(r => r.json()),
        ])
            .then(([accs, stks]) => {
                setAccounts(accs);
                setStocks(stks);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const addAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountForm),
        });
        setShowAccountModal(false);
        setAccountForm({ name: '', type: 'PENSION', broker: '', description: '' });
        fetchData();
    };

    const deleteAccount = async (id: string) => {
        if (!confirm('이 계좌를 삭제하시겠습니까? 관련된 모든 거래/배당/스냅샷이 삭제됩니다.')) return;
        await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        fetchData();
    };

    const addStock = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/stocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stockForm),
        });
        setShowStockModal(false);
        setStockForm({ ticker: '', name: '', type: 'ETF', sector: '', market: 'KR', currency: 'KRW' });
        fetchData();
    };

    const deleteStock = async (id: string) => {
        if (!confirm('이 종목을 삭제하시겠습니까?')) return;
        await fetch(`/api/stocks/${id}`, { method: 'DELETE' });
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

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">설정</h1>
                    <p className="page-subtitle">계좌 및 종목 관리</p>
                </div>
            </div>

            {/* Accounts Section */}
            <div className="table-container">
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title">계좌 관리</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAccountModal(true)}>
                        <Plus size={14} /> 계좌 추가
                    </button>
                </div>
                {accounts.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>계좌명</th>
                                <th>유형</th>
                                <th>증권사</th>
                                <th>거래</th>
                                <th>배당</th>
                                <th>스냅샷</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => (
                                <tr key={acc.id}>
                                    <td style={{ fontWeight: 600 }}>{acc.name}</td>
                                    <td><span className="badge badge-blue">{getAccountTypeLabel(acc.type)}</span></td>
                                    <td>{acc.broker || '-'}</td>
                                    <td>{acc._count.transactions}건</td>
                                    <td>{acc._count.dividends}건</td>
                                    <td>{acc._count.snapshots}건</td>
                                    <td>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteAccount(acc.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <SettingsIcon size={40} />
                        <h3>등록된 계좌가 없습니다</h3>
                        <p>계좌 추가 버튼을 눌러 시작하세요.</p>
                    </div>
                )}
            </div>

            {/* Stocks Section */}
            <div className="table-container section-gap">
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title">종목 관리</span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowStockModal(true)}>
                        <Plus size={14} /> 종목 추가
                    </button>
                </div>
                {stocks.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>종목명</th>
                                <th>티커</th>
                                <th>유형</th>
                                <th>시장</th>
                                <th>통화</th>
                                <th>거래</th>
                                <th>배당</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                    <td><span className="badge badge-purple">{s.ticker}</span></td>
                                    <td><span className="badge badge-blue">{getStockTypeLabel(s.type)}</span></td>
                                    <td>{s.market === 'US' ? '🇺🇸 미국' : '🇰🇷 국내'}</td>
                                    <td>{s.currency}</td>
                                    <td>{s._count.transactions}건</td>
                                    <td>{s._count.dividends}건</td>
                                    <td>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteStock(s.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <SettingsIcon size={40} />
                        <h3>등록된 종목이 없습니다</h3>
                    </div>
                )}
            </div>

            {/* Add Account Modal */}
            {showAccountModal && (
                <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="modal-title">계좌 추가</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowAccountModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={addAccount}>
                            <div className="form-group">
                                <label className="form-label">계좌명</label>
                                <input className="form-input" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} placeholder="예: 연금저축1" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">유형</label>
                                    <select className="form-select" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}>
                                        {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">증권사</label>
                                    <input className="form-input" value={accountForm.broker} onChange={e => setAccountForm({ ...accountForm, broker: e.target.value })} placeholder="예: 삼성증권" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">설명</label>
                                <input className="form-input" value={accountForm.description} onChange={e => setAccountForm({ ...accountForm, description: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAccountModal(false)}>취소</button>
                                <button type="submit" className="btn btn-primary">추가</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Stock Modal */}
            {showStockModal && (
                <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className="modal-title">종목 추가</h2>
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowStockModal(false)}><X size={16} /></button>
                        </div>
                        <form onSubmit={addStock}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">종목명</label>
                                    <input className="form-input" value={stockForm.name} onChange={e => setStockForm({ ...stockForm, name: e.target.value })} placeholder="예: TIGER S&P500" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">티커</label>
                                    <input className="form-input" value={stockForm.ticker} onChange={e => setStockForm({ ...stockForm, ticker: e.target.value })} placeholder="예: 360750" required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">유형</label>
                                    <select className="form-select" value={stockForm.type} onChange={e => setStockForm({ ...stockForm, type: e.target.value })}>
                                        {STOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">시장</label>
                                    <select className="form-select" value={stockForm.market} onChange={e => setStockForm({ ...stockForm, market: e.target.value })}>
                                        {MARKETS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">섹터</label>
                                <input className="form-input" value={stockForm.sector} onChange={e => setStockForm({ ...stockForm, sector: e.target.value })} placeholder="예: 미국 대형주" />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>취소</button>
                                <button type="submit" className="btn btn-primary">추가</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
