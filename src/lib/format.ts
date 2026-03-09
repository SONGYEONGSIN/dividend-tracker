/**
 * KRW currency format
 */
export function formatKRW(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * USD currency format
 */
export function formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Compact KRW (만/억 단위)
 */
export function formatCompactKRW(amount: number): string {
    if (Math.abs(amount) >= 100000000) {
        return `${(amount / 100000000).toFixed(1)}억`;
    }
    if (Math.abs(amount) >= 10000) {
        return `${Math.round(amount / 10000).toLocaleString()}만`;
    }
    return amount.toLocaleString();
}

/**
 * Number with comma separator
 */
export function formatNumber(value: number, decimals = 0): string {
    return value.toLocaleString('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Percentage with sign (+/-)
 */
export function formatPercent(value: number, decimals = 2): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * CSS class for financial gain/loss indicators
 */
export function getReturnColorClass(value: number): string {
    if (value > 0) return 'gain';
    if (value < 0) return 'loss';
    return 'neutral';
}

/**
 * Account type to Korean label
 */
export function getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        PENSION: '연금저축',
        IRP: 'IRP',
        ISA: 'ISA',
        GENERAL: '일반계좌',
    };
    return labels[type] || type;
}

/**
 * Stock type to Korean label
 */
export function getStockTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        ETF: 'ETF',
        STOCK: '주식',
        REIT: '리츠',
        BOND: '채권',
    };
    return labels[type] || type;
}
