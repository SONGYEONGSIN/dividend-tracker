// Chart color palette
export const CHART_COLORS = [
    '#4f8cff', // Blue
    '#7b61ff', // Purple
    '#00d68f', // Green
    '#ffbb38', // Yellow
    '#ff6b8a', // Pink
    '#36d1c4', // Teal
    '#ff9f43', // Orange
    '#a55eea', // Violet
];

// Semantic colors for charts
export const CHART_SEMANTIC = {
    invested: '#4f8cff',
    marketValue: '#00d68f',
    dividend: '#7b61ff',
    warning: '#ffbb38',
};

// Account type options
export const ACCOUNT_TYPES = [
    { value: 'PENSION', label: '연금저축' },
    { value: 'IRP', label: 'IRP' },
    { value: 'ISA', label: 'ISA' },
    { value: 'GENERAL', label: '일반계좌' },
] as const;

// Stock type options
export const STOCK_TYPES = [
    { value: 'ETF', label: 'ETF' },
    { value: 'STOCK', label: '주식' },
    { value: 'REIT', label: '리츠' },
    { value: 'BOND', label: '채권' },
] as const;

// Market options
export const MARKETS = [
    { value: 'KR', label: '국내' },
    { value: 'US', label: '미국' },
] as const;

// Navigation items
export const NAV_ITEMS = [
    { href: '/', label: '대시보드', icon: 'LayoutDashboard' },
    { href: '/portfolio', label: '포트폴리오', icon: 'PieChart' },
    { href: '/dividends', label: '배당관리', icon: 'Banknote' },
    { href: '/performance', label: '수익률분석', icon: 'TrendingUp' },
    { href: '/settings', label: '설정', icon: 'Settings' },
] as const;
